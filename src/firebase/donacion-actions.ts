
'use server';

import { addDoc, collection, serverTimestamp, deleteDoc, doc, updateDoc, writeBatch, getDocs, query, where, increment, getDoc } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const getOrCreateArticulo = async (batch: any, articulo: any) => {
    if (articulo.articuloId) {
        return articulo.articuloId;
    }

    // Check if an article with the same name already exists
    const catalogoRef = collection(firestore, 'catalogoArticulos');
    const q = query(catalogoRef, where("nombre", "==", articulo.nombre));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        // Article exists, return its ID
        return querySnapshot.docs[0].id;
    } else {
        // Article does not exist, create it
        const newArticuloRef = doc(catalogoRef);
        batch.set(newArticuloRef, {
            nombre: articulo.nombre,
            unidad: articulo.unidad || 'und', // Default to 'und' if not provided
            categoria: 'General', // Default category
            createdAt: serverTimestamp(),
        });
        return newArticuloRef.id;
    }
};


export const updateInventory = async (batch: any, articulos: any[], operation: 'add' | 'subtract') => {
    const inventarioRef = collection(firestore, 'inventario');
    
    for (const articulo of articulos) {
        const articuloId = articulo.articuloId || await getOrCreateArticulo(batch, articulo);
        if (!articuloId) {
             console.warn(`No se pudo obtener o crear el ID del artículo para: ${articulo.nombre}`);
             continue;
        }

        const q = query(inventarioRef, where("articuloId", "==", articuloId));
        const querySnapshot = await getDocs(q);
        const cantidad = operation === 'add' ? articulo.cantidad : -articulo.cantidad;

        if (querySnapshot.empty) {
            const newDocRef = doc(inventarioRef);
            batch.set(newDocRef, {
                articuloId: articuloId,
                nombre: articulo.nombre,
                unidad: articulo.unidad,
                cantidad: cantidad, // Can be negative if subtracting from non-existent, which is okay for reconciliation
                lastUpdatedAt: serverTimestamp(),
            });
        } else {
            const docRef = querySnapshot.docs[0].ref;
            batch.update(docRef, {
                cantidad: increment(cantidad),
                lastUpdatedAt: serverTimestamp(),
            });
        }
    }
};


export const addDonacion = async (donacionData: any) => {
    const collectionRef = collection(firestore, 'donaciones');
    const batch = writeBatch(firestore);

    try {
        const newDonacionRef = doc(collectionRef);
        
        if (donacionData.articulos && donacionData.articulos.length > 0) {
            await updateInventory(batch, donacionData.articulos, 'add');
        }

        // Must update the payload AFTER getOrCreateArticulo has run
        const finalArticulos = await Promise.all(
            (donacionData.articulos || []).map(async (art: any) => ({
                ...art,
                articuloId: art.articuloId || await getOrCreateArticulo(batch, art),
            }))
        );
        
        batch.set(newDonacionRef, {
            ...donacionData,
            articulos: finalArticulos,
            createdAt: serverTimestamp(),
        });
        
        await batch.commit();

    } catch (serverError: any) {
        console.error("Error adding donation and updating inventory:", serverError);
        const permissionError = new FirestorePermissionError({
            path: collectionRef.path,
            operation: 'create',
            requestResourceData: donacionData,
        });
        throw permissionError;
    }
};

export const updateDonacion = async (id: string, donacionData: any) => {
    // Note: This function doesn't automatically handle inventory changes
    // for simplicity. A real-world scenario would require complex logic to
    // compare the old vs. new items and adjust the inventory accordingly.
    const docRef = doc(firestore, 'donaciones', id);
    try {
        await updateDoc(docRef, donacionData);
    } catch (serverError: any) {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: donacionData,
        });
        throw permissionError;
    }
};

export const deleteDonacion = async (id: string) => {
    const docRef = doc(firestore, 'donaciones', id);
    const batch = writeBatch(firestore);
    try {
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            throw new Error("La donación que intenta eliminar no existe.");
        }
        const donacion = docSnap.data();

        // Subtract items from inventory
        if (donacion.articulos && donacion.articulos.length > 0) {
            await updateInventory(batch, donacion.articulos, 'subtract');
        }
        
        // Delete the donation document
        batch.delete(docRef);

        await batch.commit();

    } catch (serverError: any) {
        console.error("Error deleting donation:", serverError);
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        throw permissionError;
    }
};

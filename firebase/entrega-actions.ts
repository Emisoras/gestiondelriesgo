
'use server';

import { addDoc, collection, serverTimestamp, deleteDoc, doc, updateDoc, writeBatch, query, where, getDocs, increment } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const updateInventory = async (batch: any, articulos: any[], operation: 'add' | 'subtract') => {
    const inventarioRef = collection(firestore, 'inventario');
    
    for (const articulo of articulos) {
         if (!articulo.articuloId) {
            console.warn(`Artículo sin ID del catálogo, no se puede actualizar inventario: ${articulo.nombre}`);
            continue;
        }

        const q = query(inventarioRef, where("articuloId", "==", articulo.articuloId));
        const querySnapshot = await getDocs(q);
        const cantidad = operation === 'add' ? articulo.cantidad : -articulo.cantidad;

        if (querySnapshot.empty) {
            // Should not happen for a 'subtract' operation on a well-managed inventory
            if (operation === 'add') {
                const newDocRef = doc(inventarioRef); 
                batch.set(newDocRef, {
                    articuloId: articulo.articuloId,
                    nombre: articulo.nombre,
                    unidad: articulo.unidad,
                    cantidad: articulo.cantidad,
                    lastUpdatedAt: serverTimestamp(),
                });
            } else {
                // To prevent negative inventory, we could throw an error here.
                // For now, we log a warning. A more robust implementation could check stock before committing.
                console.warn(`Intento de restar del inventario un artículo no existente o sin stock: ${articulo.nombre}`);
                 const newDocRef = doc(inventarioRef); 
                 batch.set(newDocRef, {
                    articuloId: articulo.articuloId,
                    nombre: articulo.nombre,
                    unidad: articulo.unidad,
                    cantidad: cantidad, // This will create a negative stock record
                    lastUpdatedAt: serverTimestamp(),
                });
            }
        } else {
            const docRef = querySnapshot.docs[0].ref;
             // Here too, we could check if stock - cantidad >= 0 before updating.
            batch.update(docRef, {
                cantidad: increment(cantidad),
                lastUpdatedAt: serverTimestamp(),
            });
        }
    }
};


export const addEntrega = async (entregaData: any) => {
    const collectionRef = collection(firestore, 'entregas');
    const batch = writeBatch(firestore);
    try {
        const newEntregaRef = doc(collectionRef);
        batch.set(newEntregaRef, {
            ...entregaData,
            createdAt: serverTimestamp(),
        });

        if (entregaData.articulos && entregaData.articulos.length > 0) {
            await updateInventory(batch, entregaData.articulos, 'subtract');
        }
        
        await batch.commit();

    } catch (serverError: any) {
        console.error("Error adding entrega and updating inventory:", serverError);
        const permissionError = new FirestorePermissionError({
            path: collectionRef.path,
            operation: 'create',
            requestResourceData: entregaData,
        });
        throw permissionError;
    }
};

export const updateEntrega = async (id: string, entregaData: any) => {
    // Updating an "entrega" should ideally reverse the original inventory change
    // and apply the new one. This is complex and is omitted for this MVP.
    const docRef = doc(firestore, 'entregas', id);
    try {
        await updateDoc(docRef, entregaData);
    } catch (serverError: any) {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: entregaData,
        });
        throw permissionError;
    }
};

export const deleteEntrega = async (id: string) => {
     // Deleting an "entrega" should ideally reverse the inventory change (add items back).
    // This is complex and is omitted for this MVP.
    const docRef = doc(firestore, 'entregas', id);
    try {
        await deleteDoc(docRef);
    } catch (serverError: any) {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        throw permissionError;
    }
};

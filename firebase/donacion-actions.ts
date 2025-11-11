
'use server';

import { addDoc, collection, serverTimestamp, deleteDoc, doc, updateDoc, writeBatch, getDocs, query, where, increment, getDoc } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Finds an existing article by its normalized name or creates a new one if it doesn't exist.
 * This function is robust against case-insensitive duplicates.
 * @param batch - The Firestore write batch to add operations to.
 * @param articulo - The article data from the form { nombre, unidad, cantidad }.
 * @returns The canonical article data object from the catalog, including its ID.
 */
const getOrCreateArticulo = async (batch: any, articulo: any) => {
    const catalogoRef = collection(firestore, 'catalogoArticulos');
    const nombreNormalizado = articulo.nombre.trim().toLowerCase();

    if (!nombreNormalizado) {
        throw new Error("El nombre del artículo no puede estar vacío.");
    }
    
    // Always search by normalized name to prevent duplicates.
    const q = query(catalogoRef, where("nombre_normalizado", "==", nombreNormalizado));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        // If found, return the data of the existing article.
        const existingDoc = querySnapshot.docs[0];
        return { id: existingDoc.id, ...existingDoc.data() };
    } 
    
    // If we are here, it means no article with that normalized name exists.
    // We can now safely create a new one.
    const newArticuloData = {
        nombre: articulo.nombre.trim(),
        nombre_normalizado: nombreNormalizado,
        unidad: articulo.unidad || 'und', // Default to 'und' if not provided
        categoria: 'General', // Default category for auto-created items
        createdAt: serverTimestamp(),
    };
    const newArticuloRef = doc(catalogoRef);
    batch.set(newArticuloRef, newArticuloData);
    
    // Return a representation of the new document for immediate use.
    return { id: newArticuloRef.id, ...newArticuloData };
};


/**
 * Updates the inventory for a list of articles, either adding or subtracting quantities.
 * @param batch - The Firestore write batch.
 * @param articulos - An array of article objects, each with articuloId, nombre, unidad, and cantidad.
 * @param operation - 'add' to increase stock, 'subtract' to decrease stock.
 */
export const updateInventory = async (batch: any, articulos: any[], operation: 'add' | 'subtract') => {
    const inventarioRef = collection(firestore, 'inventario');
    
    for (const articulo of articulos) {
        const { articuloId, nombre, unidad, cantidad } = articulo;
        if (!articuloId) continue; 

        const q = query(inventarioRef, where("articuloId", "==", articuloId));
        const querySnapshot = await getDocs(q);
        
        const amountToChange = operation === 'add' ? cantidad : -cantidad;

        if (querySnapshot.empty) {
             if (operation === 'subtract') {
                throw new Error(`Intentando restar stock para "${nombre}" que no existe en el inventario.`);
            }
            // Create new inventory item if it doesn't exist
            const newDocRef = doc(inventarioRef);
            batch.set(newDocRef, {
                articuloId,
                nombre,
                unidad,
                cantidad: Math.max(0, amountToChange),
                lastUpdatedAt: serverTimestamp(),
            });
        } else {
            // Update existing inventory item
            const inventarioDocRef = querySnapshot.docs[0].ref;
            const currentStock = querySnapshot.docs[0].data()?.cantidad ?? 0;
            
            if (operation === 'subtract' && currentStock < cantidad) {
                throw new Error(`Stock insuficiente para "${nombre}". Stock actual: ${currentStock}, se necesitan: ${cantidad}`);
            }
            
            batch.update(inventarioDocRef, {
                cantidad: increment(amountToChange),
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
            const finalArticulos = [];
            for (const art of donacionData.articulos) {
                // This function now robustly handles finding or creating the article.
                const catalogoArticulo = await getOrCreateArticulo(batch, art);
                
                finalArticulos.push({
                    articuloId: catalogoArticulo.id,
                    nombre: catalogoArticulo.nombre, // Use canonical name from catalog
                    unidad: catalogoArticulo.unidad, // Use canonical unit from catalog
                    cantidad: art.cantidad,
                });
            }

            // Update inventory with the canonical data
            await updateInventory(batch, finalArticulos, 'add');
            
            // Save the canonical article data in the donation document itself
            donacionData.articulos = finalArticulos;
        }
        
        batch.set(newDonacionRef, {
            ...donacionData,
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

        // When deleting a donation, the items are "returned" to inventory.
        // We must ADD them back to inventory to reverse the donation.
        if (donacion.articulos && donacion.articulos.length > 0) {
            await updateInventory(batch, donacion.articulos, 'add');
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

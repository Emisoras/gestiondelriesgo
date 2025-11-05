
'use server';

import { addDoc, collection, serverTimestamp, deleteDoc, doc, updateDoc, writeBatch, query, where, getDocs, increment, getDoc } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { updateInventory } from './donacion-actions';


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
    const docRef = doc(firestore, 'entregas', id);
    const batch = writeBatch(firestore);
    try {
        // First, get the document to know which items to return to inventory
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            throw new Error("La entrega que intenta eliminar no existe.");
        }
        const entrega = docSnap.data();

        // Add items back to inventory
        if (entrega.articulos && entrega.articulos.length > 0) {
            await updateInventory(batch, entrega.articulos, 'add');
        }

        // Then, delete the delivery document
        batch.delete(docRef);

        // Commit the batch operation
        await batch.commit();

    } catch (serverError: any) {
        console.error("Error deleting entrega:", serverError);
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        throw permissionError;
    }
};

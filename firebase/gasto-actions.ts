
'use server';

import { addDoc, collection, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';
import { FirestorePermissionError } from './errors';

export const addGasto = async (gastoData: any) => {
    const collectionRef = collection(firestore, 'gastos');
    try {
        await addDoc(collectionRef, {
            ...gastoData,
            createdAt: serverTimestamp(),
        });
    } catch (error: any) {
        console.error("Error adding document: ", error);
        throw new FirestorePermissionError({
            path: collectionRef.path,
            operation: 'create',
            requestResourceData: gastoData,
        });
    }
};

export const updateGasto = async (id: string, gastoData: any) => {
    const docRef = doc(firestore, 'gastos', id);
    try {
        await updateDoc(docRef, gastoData);
    } catch (error: any) {
        console.error("Error updating document: ", error);
         throw new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: gastoData,
        });
    }
};

export const deleteGasto = async (id: string) => {
    const docRef = doc(firestore, 'gastos', id);
    try {
        await deleteDoc(docRef);
    } catch (error: any) {
        console.error("Error deleting document: ", error);
        throw new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
    }
};

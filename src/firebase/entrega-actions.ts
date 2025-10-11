
'use server';

import { addDoc, collection, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export const addEntrega = async (entregaData: any) => {
    const collectionRef = collection(firestore, 'entregas');
    try {
        await addDoc(collectionRef, {
            ...entregaData,
            createdAt: serverTimestamp(),
        });
    } catch (serverError: any) {
        const permissionError = new FirestorePermissionError({
            path: collectionRef.path,
            operation: 'create',
            requestResourceData: entregaData,
        });
        throw permissionError;
    }
};

export const updateEntrega = async (id: string, entregaData: any) => {
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

    
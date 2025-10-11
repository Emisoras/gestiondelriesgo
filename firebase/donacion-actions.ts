
'use server';

import { addDoc, collection, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export const addDonacion = async (donacionData: any) => {
    const collectionRef = collection(firestore, 'donaciones');
    try {
        await addDoc(collectionRef, {
            ...donacionData,
            createdAt: serverTimestamp(),
        });
    } catch (serverError: any) {
        const permissionError = new FirestorePermissionError({
            path: collectionRef.path,
            operation: 'create',
            requestResourceData: donacionData,
        });
        throw permissionError;
    }
};

export const updateDonacion = async (id: string, donacionData: any) => {
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

    
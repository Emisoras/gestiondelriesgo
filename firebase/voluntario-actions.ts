
'use server';
import { addDoc, collection, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export const addVoluntario = async (voluntarioData: any) => {
    const collectionRef = collection(firestore, 'voluntarios');
    try {
        await addDoc(collectionRef, {
            ...voluntarioData,
            createdAt: serverTimestamp(),
        });
    } catch (serverError: any) {
        const permissionError = new FirestorePermissionError({
            path: collectionRef.path,
            operation: 'create',
            requestResourceData: voluntarioData,
        });
        throw permissionError;
    }
};

export const deleteVoluntario = async (id: string) => {
    const docRef = doc(firestore, 'voluntarios', id);
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

    
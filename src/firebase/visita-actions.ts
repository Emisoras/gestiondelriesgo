
'use server';

import { addDoc, collection, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';

export const addVisita = async (visitaData: any) => {
    const collectionRef = collection(firestore, 'visitas');
    try {
        const docRef = await addDoc(collectionRef, {
            ...visitaData,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error: any) {
        console.error("Error adding document: ", error);
        throw new Error("No se pudo registrar la visita. Verifique los permisos.");
    }
};

export const updateVisita = async (id: string, visitaData: any) => {
    const docRef = doc(firestore, 'visitas', id);
    try {
        await updateDoc(docRef, visitaData);
    } catch (error: any) {
        console.error("Error updating document: ", error);
        throw new Error("No se pudo actualizar la visita. Verifique los permisos.");
    }
};

export const deleteVisita = async (id: string) => {
    const docRef = doc(firestore, 'visitas', id);
    try {
        await deleteDoc(docRef);
    } catch (error: any) {
        console.error("Error deleting document: ", error);
        throw new Error("No se pudo eliminar la visita. Verifique los permisos.");
    }
};

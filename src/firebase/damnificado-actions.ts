
'use server';
import { addDoc, collection, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';

export const addDamnificado = async (damnificadoData: any) => {
    const collectionRef = collection(firestore, 'damnificados');
    try {
        await addDoc(collectionRef, {
            ...damnificadoData,
            createdAt: serverTimestamp(),
        });
    } catch (error: any) {
        console.error("Error adding document: ", error);
        throw new Error("No se pudo agregar el damnificado. Verifique los permisos.");
    }
};

export const updateDamnificado = async (id: string, damnificadoData: any) => {
    const docRef = doc(firestore, 'damnificados', id);
    try {
        await updateDoc(docRef, damnificadoData);
    } catch (error: any) {
        console.error("Error updating document: ", error);
        throw new Error("No se pudo actualizar el damnificado. Verifique los permisos.");
    }
};


export const deleteDamnificado = async (id: string) => {
    const docRef = doc(firestore, 'damnificados', id);
    try {
        await deleteDoc(docRef);
    } catch (error: any) {
        console.error("Error deleting document: ", error);
        throw new Error("No se pudo eliminar el damnificado. Verifique los permisos.");
    }
};

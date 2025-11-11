
'use server';

import { addDoc, collection, serverTimestamp, deleteDoc, doc, updateDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';

export const getNextActaNumber = async (): Promise<string> => {
    const visitasRef = collection(firestore, 'visitas');
    const q = query(visitasRef, orderBy('createdAt', 'desc'), limit(1));

    const querySnapshot = await getDocs(q);

    const initialNumber = 342;
    const prefix = "CMGRD -";

    if (querySnapshot.empty) {
        return `${prefix} ${initialNumber}`;
    }

    const lastDoc = querySnapshot.docs[0];
    const lastActaNumero = lastDoc.data().actaNumero as string;

    if (lastActaNumero && lastActaNumero.startsWith(prefix)) {
        const lastNumberStr = lastActaNumero.replace(prefix, '').trim();
        const lastNumber = parseInt(lastNumberStr, 10);
        if (!isNaN(lastNumber)) {
            return `${prefix} ${lastNumber + 1}`;
        }
    }

    // Fallback if the last acta has a weird format or doesn't exist
    // This could also fetch all documents and find the max number, but it's less efficient.
    // For now, this is a reasonable fallback.
    return `${prefix} ${initialNumber}`;
};


export const addVisita = async (visitaData: any) => {
    const collectionRef = collection(firestore, 'visitas');
    try {
        const docRef = await addDoc(collectionRef, {
            ...visitaData,
            createdAt: serverTimestamp(),
        });
        return { id: docRef.id };
    } catch (error: any) {
        console.error("Error adding document: ", error);
        throw new Error("No se pudo registrar la visita. Verifique los permisos.");
    }
};

export const updateVisita = async (id: string, visitaData: any) => {
    const docRef = doc(firestore, 'visitas', id);
    try {
        await updateDoc(docRef, {
            ...visitaData,
            updatedAt: serverTimestamp() // Add an updated timestamp
        });
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

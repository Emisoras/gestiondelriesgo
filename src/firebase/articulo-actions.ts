
'use server';

import { addDoc, collection, serverTimestamp, deleteDoc, doc, updateDoc, writeBatch, getDocs } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';
import { catalogoData } from '@/lib/catalogo-seed';

export const addArticulo = async (articuloData: any) => {
    const collectionRef = collection(firestore, 'catalogoArticulos');
    try {
        await addDoc(collectionRef, {
            ...articuloData,
            createdAt: serverTimestamp(),
        });
    } catch (error: any) {
        console.error("Error adding document: ", error);
        throw new Error("No se pudo agregar el artículo. Verifique los permisos.");
    }
};

export const updateArticulo = async (id: string, articuloData: any) => {
    const docRef = doc(firestore, 'catalogoArticulos', id);
    try {
        await updateDoc(docRef, articuloData);
    } catch (error: any) {
        console.error("Error updating document: ", error);
        throw new Error("No se pudo actualizar el artículo. Verifique los permisos.");
    }
};


export const deleteArticulo = async (id: string) => {
    const docRef = doc(firestore, 'catalogoArticulos', id);
    try {
        await deleteDoc(docRef);
    } catch (error: any) {
        console.error("Error deleting document: ", error);
        throw new Error("No se pudo eliminar el artículo. Verifique los permisos.");
    }
};

export const seedCatalogo = async () => {
    const collectionRef = collection(firestore, 'catalogoArticulos');
    
    // Check if the collection is already populated
    const snapshot = await getDocs(collectionRef);
    if (!snapshot.empty) {
        throw new Error("El catálogo ya contiene artículos. No se puede realizar la carga inicial.");
    }

    const batch = writeBatch(firestore);
    catalogoData.forEach(articulo => {
        const docRef = doc(collectionRef); // Automatically generate unique ID
        batch.set(docRef, { ...articulo, createdAt: serverTimestamp() });
    });

    try {
        await batch.commit();
        console.log("Catálogo de artículos cargado exitosamente.");
        return { success: true, message: `${catalogoData.length} artículos han sido cargados.` };
    } catch (error) {
        console.error("Error al cargar el catálogo inicial: ", error);
        throw new Error("Ocurrió un error al cargar los artículos iniciales.");
    }
};

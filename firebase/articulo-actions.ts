
'use server';

import { addDoc, collection, serverTimestamp, deleteDoc, doc, updateDoc, writeBatch, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';
import { catalogoData } from '@/lib/catalogo-seed';

// Helper function to check for existing articles
const checkExistingArticulo = async (nombre: string, currentId?: string) => {
    const collectionRef = collection(firestore, 'catalogoArticulos');
    const nombreNormalizado = nombre.trim().toLowerCase();
    const q = query(collectionRef, where('nombre_normalizado', '==', nombreNormalizado));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        // If we are updating, we need to make sure the found doc is not the same doc we are editing
        if (currentId && querySnapshot.docs[0].id === currentId) {
            return false; // It's the same document, so it's not a duplicate
        }
        return true; // A duplicate exists
    }
    return false; // No duplicate found
};


export const addArticulo = async (articuloData: any) => {
    
    const alreadyExists = await checkExistingArticulo(articuloData.nombre);
    if (alreadyExists) {
        throw new Error(`El artículo "${articuloData.nombre}" ya existe en el catálogo.`);
    }

    const collectionRef = collection(firestore, 'catalogoArticulos');
    try {
        await addDoc(collectionRef, {
            ...articuloData,
            nombre_normalizado: articuloData.nombre.trim().toLowerCase(),
            createdAt: serverTimestamp(),
        });
    } catch (error: any) {
        console.error("Error adding document: ", error);
        throw new Error("No se pudo agregar el artículo. Verifique los permisos.");
    }
};

export const updateArticulo = async (id: string, articuloData: any) => {
    const alreadyExists = await checkExistingArticulo(articuloData.nombre, id);
    if (alreadyExists) {
        throw new Error(`Ya existe otro artículo con el nombre "${articuloData.nombre}".`);
    }

    const docRef = doc(firestore, 'catalogoArticulos', id);
    try {
        await updateDoc(docRef, {
            ...articuloData,
            nombre_normalizado: articuloData.nombre.trim().toLowerCase(),
        });
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
        batch.set(docRef, { 
            ...articulo, 
            nombre_normalizado: articulo.nombre.toLowerCase(),
            createdAt: serverTimestamp() 
        });
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


'use server';

import { doc, updateDoc } from "firebase/firestore";
import { firestore, auth } from "./firebase";
import { errorEmitter } from "./error-emitter";
import { FirestorePermissionError } from "./errors";
import { updateProfile, EmailAuthProvider, reauthenticateWithCredential, updatePassword, sendPasswordResetEmail } from "firebase/auth";

type UserProfileUpdate = {
    displayName?: string;
    role?: 'administrador' | 'empleado';
    estado?: 'activo' | 'inactivo' | 'pendiente';
};


export const updateUserProfile = async (uid: string, data: UserProfileUpdate) => {
    if (!uid) {
        throw new Error("UID de usuario no proporcionado.");
    }
    const userRef = doc(firestore, `users/${uid}`);
    try {
        await updateDoc(userRef, data);
    } catch (error: any) {
        const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'update',
            requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    }
};

type CurrentUserProfileUpdate = {
    displayName?: string;
};

export const updateCurrentUserInfo = async (data: CurrentUserProfileUpdate) => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("Usuario no autenticado.");
    }

    try {
        // Update Firebase Auth profile
        if (data.displayName) {
            await updateProfile(user, { displayName: data.displayName });
        }

        // Update Firestore profile
        const userRef = doc(firestore, `users/${user.uid}`);
        await updateDoc(userRef, {
            displayName: data.displayName
        });

    } catch (error: any) {
        console.error("Error updating user info: ", error);
        // We can make this more specific if needed
        throw new Error("No se pudo actualizar la información del perfil.");
    }
};


export const reauthenticateAndChangePassword = async (currentPassword: string, newPassword: string) => {
    const user = auth.currentUser;
    if (!user || !user.email) {
        throw new Error("Usuario no autenticado o sin email.");
    }

    const credential = EmailAuthProvider.credential(user.email, currentPassword);

    try {
        await reauthenticateWithCredential(user, credential);
        // User re-authenticated. Now they can change the password.
        await updatePassword(user, newPassword);
    } catch (error: any) {
        console.error("Password change error:", error.code);
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            throw new Error("La contraseña actual es incorrecta.");
        }
        throw new Error("Ocurrió un error al cambiar la contraseña.");
    }
};

export const sendPasswordResetEmailForUser = async (email: string) => {
    if (!email) {
        throw new Error("No se proporcionó un correo electrónico.");
    }
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
        console.error("Error sending password reset email:", error);
        throw new Error("No se pudo enviar el correo de restablecimiento. Verifique que el correo sea correcto.");
    }
};

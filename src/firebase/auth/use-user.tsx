
'use client';

import { createContext, useContext } from 'react';
import type { User } from 'firebase/auth';

// Define the structure for the user profile data from Firestore
export type UserProfile = {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    role: 'administrador' | 'empleado' | null;
    estado: 'activo' | 'inactivo' | 'pendiente' | null;
    createdAt: any;
};


export type UserContextValue = {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
};

export const UserContext = createContext<UserContextValue>({
    user: null,
    userProfile: null,
    loading: true, // Default to true while we check auth status
});

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within an AuthProvider');
    }
    return context;
};

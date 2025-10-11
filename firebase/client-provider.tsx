
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, firestore } from '@/firebase/firebase';
import { UserContext, type UserProfile } from '@/firebase/auth/use-user';
import { FirebaseErrorListener } from '@/firebase/firebase-error-listener';
import { FirestorePermissionError } from './errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { usePathname, useRouter } from 'next/navigation';

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                const userRef = doc(firestore, `users/${firebaseUser.uid}`);
                try {
                    const docSnap = await getDoc(userRef);

                    if (docSnap.exists()) {
                        setUserProfile(docSnap.data() as UserProfile);
                    } else {
                        // Assign 'empleado' role and 'pendiente' status by default to new users
                        const newUserProfileData = {
                            email: firebaseUser.email,
                            displayName: firebaseUser.displayName,
                            photoURL: firebaseUser.photoURL,
                            role: 'empleado', 
                            estado: 'pendiente', // Default status for new users
                            uid: firebaseUser.uid,
                            createdAt: serverTimestamp(),
                        };
                        
                        await setDoc(userRef, newUserProfileData);
                        setUserProfile(newUserProfileData as UserProfile);
                    }
                } catch (error) {
                    const permissionError = new FirestorePermissionError({
                        path: userRef.path,
                        operation: 'get',
                    });
                    errorEmitter.emit('permission-error', permissionError);
                    console.error("Error fetching or creating user profile:", permissionError);
                }

            } else {
                setUser(null);
                setUserProfile(null);
                // If the user is logged out and on a protected route, redirect to login
                if (pathname.startsWith('/dashboard')) {
                    router.push('/login');
                }
            }
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [pathname, router]);


    return (
        <UserContext.Provider value={{ user, userProfile, loading }}>
            <FirebaseErrorListener>
                {children}
            </FirebaseErrorListener>
        </UserContext.Provider>
    );
}


'use client';

import { useEffect, useState, useRef } from 'react';
import {
    doc,
    onSnapshot,
    type DocumentData,
    type DocumentReference,
} from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useUser } from '../auth/use-user';

export const useDoc = <T extends DocumentData>(path: string) => {
    const { loading: authLoading, user } = useUser();
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // Wait until Firebase auth state is determined.
        if (authLoading) {
            setLoading(true);
            return;
        }
        
        // If the user is not logged in, stop here.
        if (!user) {
            setData(null);
            setLoading(false);
            return;
        }
        
        setLoading(true);
        setError(null);

        let docRef: DocumentReference;
        try {
            docRef = doc(firestore, path);
        } catch (e: any) {
            setError(e);
            setLoading(false);
            return;
        }

        const unsubscribe = onSnapshot(
            docRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    setData({ id: snapshot.id, ...snapshot.data() } as T);
                } else {
                    setData(null);
                }
                setLoading(false);
            },
            async (err) => {
                 const permissionError = new FirestorePermissionError({
                    path: path,
                    operation: 'get',
                });
                errorEmitter.emit('permission-error', permissionError);
                setError(permissionError);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [path, authLoading, user]);

    return { data, loading, error };
};

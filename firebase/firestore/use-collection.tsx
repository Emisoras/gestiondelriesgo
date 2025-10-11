
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
    onSnapshot,
    query,
    collection,
    where,
    orderBy,
    limit,
    startAfter,
    endBefore,
    limitToLast,
    type DocumentData,
    type Query,
} from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useUser } from '../auth/use-user';

export type CollectionOptions = {
    where?: [string, '==', any] | [string, '!=', any] | [string, '<', any] | [string, '<=', any] | [string, '>', any] | [string, '>=', any] | [string, 'array-contains', any] | [string, 'in', any[]] | [string, 'not-in', any[]] | [string, 'array-contains-any', any[]];
    orderBy?: [string, 'asc' | 'desc'];
    limit?: number;
    startAfter?: DocumentData;
    endBefore?: DocumentData;
    limitToLast?: number;
};

export const useCollection = <T extends DocumentData>(
    path: string,
    options?: CollectionOptions
) => {
    const { loading: authLoading, user } = useUser();
    const [data, setData] = useState<T[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [refetchToggle, setRefetchToggle] = useState(false);

    const forceRefetch = useCallback(() => {
        setRefetchToggle(prev => !prev);
    }, []);

    useEffect(() => {
        // Wait until Firebase auth state is determined.
        if (authLoading) {
            setLoading(true);
            return;
        }

        // If the user is not logged in, we can stop here.
        // The rules will deny access anyway, so this prevents unnecessary errors.
        if (!user) {
            setData(null);
            setLoading(false);
            // We don't set an error here, as this is an expected state for a logged-out user.
            return;
        }
        
        setLoading(true);
        setError(null);

        let q: Query;
        try {
            q = collection(firestore, path);

            if (options?.where) {
                q = query(q, where(...options.where));
            }
            if (options?.orderBy) {
                q = query(q, orderBy(...options.orderBy));
            }
            if (options?.startAfter) {
                q = query(q, startAfter(options.startAfter));
            }
            if (options?.endBefore) {
                q = query(q, endBefore(options.endBefore));
            }
            if (options?.limit) {
                q = query(q, limit(options.limit));
            }
            if (options?.limitToLast) {
                q = query(q, limitToLast(options.limitToLast));
            }
        } catch (e: any) {
            setError(e);
            setLoading(false);
            console.error("Error creating Firestore query:", e);
            return;
        }

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const data = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as T[];
                setData(data);
                setLoading(false);
            },
            async (err) => {
                const permissionError = new FirestorePermissionError({
                    path: path,
                    operation: 'list',
                });
                errorEmitter.emit('permission-error', permissionError);
                setError(permissionError);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [path, JSON.stringify(options), refetchToggle, authLoading, user]);

    return { data, loading, error, forceRefetch };
};

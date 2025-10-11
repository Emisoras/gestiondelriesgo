
'use client';

import { useEffect } from 'react';
import { errorEmitter } from './error-emitter';

export function FirebaseErrorListener({
    children,
}: {
    children: React.ReactNode;
}) {
    useEffect(() => {
        const handlePermissionError = (error: Error) => {
            throw error;
        };

        errorEmitter.on('permission-error', handlePermissionError);

        return () => {
            errorEmitter.off('permission-error', handlePermissionError);
        };
    }, []);

    return <>{children}</>;
}


'use client';

import { useCollection } from './firestore/use-collection';
import { useDoc } from './firestore/use-doc';
import { useUser } from './auth/use-user';
import { FirebaseClientProvider } from './client-provider';

// Main hooks for data and auth
export {
  useCollection,
  useDoc,
  useUser,
  FirebaseClientProvider,
};

// Export underlying Firebase services for direct use if needed
export { auth, firestore } from './firebase';

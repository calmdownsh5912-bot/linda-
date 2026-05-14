import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  Timestamp,
  doc,
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Mistake } from '../types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const MISTAKES_COLLECTION = 'mistakes';

export async function saveMistake(mistake: Omit<Mistake, 'id' | 'createdAt' | 'userId'>) {
  if (!auth.currentUser) throw new Error('User not authenticated');
  
  try {
    const data = {
      ...mistake,
      userId: auth.currentUser.uid,
      createdAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, MISTAKES_COLLECTION), data);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, MISTAKES_COLLECTION);
  }
}

export async function getMistakes() {
  if (!auth.currentUser) throw new Error('User not authenticated');
  
  try {
    const q = query(
      collection(db, MISTAKES_COLLECTION),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    } as Mistake));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, MISTAKES_COLLECTION);
    return [];
  }
}

export async function deleteMistake(id: string) {
  try {
    await deleteDoc(doc(db, MISTAKES_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${MISTAKES_COLLECTION}/${id}`);
  }
}

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const signIn = () => signInWithPopup(auth, googleProvider);
export const logOut = () => signOut(auth);

export const updateProfileData = async (uid: string, data: any) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, data);
};

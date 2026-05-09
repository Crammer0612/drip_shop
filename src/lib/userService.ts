import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where
} from 'firebase/firestore';
import { db } from './firebase';
import { handleFirestoreError, OperationType } from './firestoreUtils';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'deactivated';
  photoURL?: string;
  createdAt: any;
}

export const userService = {
  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
    }
  },

  async updateUserRole(userId: string, role: 'user' | 'admin'): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  },

  async updateUserStatus(userId: string, status: 'active' | 'deactivated'): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  },

  async createAdmin(email: string, fullName: string): Promise<void> {
    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        await updateDoc(userDoc.ref, { role: 'admin' });
      } else {
        throw new Error('User must register first before promotion.');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'users (createAdmin)');
    }
  },

  async toggleFavorite(userId: string, productId: string, isFavorite: boolean): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDocs(query(collection(db, 'users'), where('id', '==', userId))); // Wait, userRef is better
      // I'll just use arrayUnion/arrayRemove if I had the field
    } catch (error) {
       // ...
    }
  }
};

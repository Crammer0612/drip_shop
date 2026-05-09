import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { handleFirestoreError, OperationType } from './firestoreUtils';

export interface Product {
  id?: string;
  name: string;
  category: 'tops' | 'bottoms' | 'outerwear' | 'accessories' | 'knitwear';
  era: string;
  price: number;
  image: string;
  description: string;
  status: 'in_stock' | 'sold' | 'draft';
  sku?: string;
  featured?: boolean;
  createdAt?: any;
}

export const productService = {
  // ... (keeping other methods same)
  async addProduct(product: Omit<Product, 'id' | 'createdAt'>) {
    try {
      const docRef = await addDoc(collection(db, 'products'), {
        ...product,
        featured: product.featured || false,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
    }
  },

  async updateProduct(id: string, updates: Partial<Product>) {
    try {
      const docRef = doc(db, 'products', id);
      await updateDoc(docRef, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
    }
  },

  async deleteProduct(id: string) {
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  },

  async getProducts() {
    try {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'products');
    }
  },

  async getProductsByCategory(category: string) {
    try {
      const q = query(
        collection(db, 'products'), 
        where('category', '==', category),
        where('status', '==', 'in_stock'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `products (category: ${category})`);
    }
  },

  async getFeaturedProducts(count: number = 4) {
    try {
      // First try to get specifically featured items
      const qFeatured = query(
        collection(db, 'products'),
        where('featured', '==', true),
        where('status', '==', 'in_stock'),
        limit(count)
      );
      const snapshotFeatured = await getDocs(qFeatured);
      
      if (snapshotFeatured.empty) {
        // Fallback to latest arrivals if no featured items marked
        const qLatest = query(
          collection(db, 'products'),
          where('status', '==', 'in_stock'),
          orderBy('createdAt', 'desc'),
          limit(count)
        );
        const snapshotLatest = await getDocs(qLatest);
        return snapshotLatest.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      }
      
      return snapshotFeatured.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'products (featured)');
    }
  }
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../lib/CartContext';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  ShoppingBag, 
  Settings, 
  Heart, 
  Clock, 
  ChevronRight,
  LogOut,
  Sparkles,
  MapPin,
  CreditCard,
  ShieldCheck,
  X,
  Check,
  Camera,
  Globe,
  Pencil,
  Loader2,
  Package,
  Plus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, logOut, updateProfileData } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { motion, AnimatePresence } from 'motion/react';

interface Order {
  id: string;
  items: any[];
  total: number;
  status: string;
  paymentMethod?: {
    type: string;
    details: string;
  };
  createdAt: any;
}

interface UserAddress {
  id: string;
  full_name: string;
  address_line: string;
  city: string;
  postal_code: string;
  country: string;
  isDefault: boolean;
}

interface UserPayment {
  id: string;
  card_type: string;
  last4: string;
  expiry: string;
  isDefault: boolean;
}

const AVATAR_STYLES = [
  { id: 'avataaars', name: 'Adventurer' },
  { id: 'bottts', name: 'Future' },
  { id: 'pixel-art', name: 'Retro' },
  { id: 'lorelei', name: 'Classic' },
  { id: 'notionists', name: 'Minimal' },
  { id: 'miniavs', name: 'Stylized' }
];

export function UserDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { cart } = useCart();
  
  const [isEditing, setIsEditing] = useState(false);
  const [activePanel, setActivePanel] = useState<'none' | 'payments' | 'addresses' | 'security' | 'rewards'>('none');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetchingOrders, setFetchingOrders] = useState(true);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [fetchingAddresses, setFetchingAddresses] = useState(false);
  const [payments, setPayments] = useState<UserPayment[]>([]);
  const [fetchingPayments, setFetchingPayments] = useState(false);
  const [newAddress, setNewAddress] = useState({ full_name: '', address_line: '', city: '', postal_code: '', country: 'UK' });
  const [newPayment, setNewPayment] = useState({ card_type: 'VISA', last4: '', expiry: '' });
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [editData, setEditData] = useState({
    full_name: '',
    bio: '',
    location: '',
    photoURL: ''
  });

  useEffect(() => {
    if (profile) {
      setEditData({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        photoURL: profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.email}`
      });
    }
  }, [profile]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      setFetchingOrders(true);
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Order[];
        setOrders(ordersData);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      } finally {
        setFetchingOrders(false);
      }
    };

    fetchOrders();
  }, [user]);

  useEffect(() => {
    const fetchSubcollections = async () => {
      if (!user) return;
      
      // Fetch Addresses
      setFetchingAddresses(true);
      try {
        const snapshot = await getDocs(collection(db, 'users', user.uid, 'addresses'));
        setAddresses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserAddress[]);
      } catch (err) { console.error(err); }
      setFetchingAddresses(false);

      // Fetch Payments
      setFetchingPayments(true);
      try {
        const snapshot = await getDocs(collection(db, 'users', user.uid, 'payments'));
        setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserPayment[]);
      } catch (err) { console.error(err); }
      setFetchingPayments(false);
    };

    fetchSubcollections();
  }, [user]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'users', user.uid, 'addresses'), { ...newAddress, isDefault: addresses.length === 0 });
      setNewAddress({ full_name: '', address_line: '', city: '', postal_code: '', country: 'UK' });
      setIsAddingAddress(false);
      // Refresh list
      const snapshot = await getDocs(collection(db, 'users', user.uid, 'addresses'));
      setAddresses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserAddress[]);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/addresses`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'users', user.uid, 'payments'), { ...newPayment, isDefault: payments.length === 0 });
      setNewPayment({ card_type: 'VISA', last4: '', expiry: '' });
      setIsAddingPayment(false);
      // Refresh list
      const snapshot = await getDocs(collection(db, 'users', user.uid, 'payments'));
      setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserPayment[]);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/payments`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      await updateProfileData(user.uid, {
        ...editData,
        updatedAt: new Date()
      });
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const cycleAvatar = () => {
    const randomStyle = AVATAR_STYLES[Math.floor(Math.random() * AVATAR_STYLES.length)];
    const randomSeed = Math.random().toString(36).substring(7);
    setEditData(prev => ({
      ...prev,
      photoURL: `https://api.dicebear.com/7.x/${randomStyle.id}/svg?seed=${randomSeed}`
    }));
  };

  return (
    <div className="py-8 space-y-10 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Profile Hero - More eBay styled header */}
      <section className="bg-surface-container-lowest rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-10 border border-outline-variant/10 shadow-sm relative overflow-hidden">
        <AnimatePresence mode="wait">
          {!isEditing ? (
            <motion.div 
              key="view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col md:flex-row items-center gap-10 w-full"
            >
              <div className="relative group">
                <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-700" />
                <img 
                  src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.email}`} 
                  alt={profile?.full_name} 
                  className="w-32 h-32 rounded-full border-[6px] border-surface shadow-2xl relative object-cover ring-2 ring-primary/10"
                />
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-lg border-4 border-surface">
                   <Sparkles className="w-5 h-5" />
                </div>
              </div>
              
              <div className="flex-grow text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-3">
                   <h1 className="font-garamond text-4xl font-bold text-on-surface italic">{profile?.full_name}</h1>
                   <span className="bg-secondary/10 text-secondary px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] italic self-center md:self-auto">Archivist Level 1</span>
                </div>
                <p className="text-on-surface-variant font-medium text-sm mb-2 flex items-center justify-center md:justify-start gap-2 opacity-80">
                  {profile?.email} 
                </p>
                {profile?.bio && (
                  <p className="max-w-md text-on-surface-variant/70 text-xs italic mb-4 font-medium leading-relaxed">
                    "{profile.bio}"
                  </p>
                )}
                {profile?.location && (
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 mb-4 justify-center md:justify-start">
                    <MapPin className="w-3 h-3" /> {profile.location}
                  </p>
                )}
                
                <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                  <DashboardChip icon={<Clock className="w-3 h-3" />} label="12 Items Viewed" />
                  <DashboardChip icon={<Heart className="w-3 h-3" />} label="0 Favorites" />
                  <DashboardChip icon={<Sparkles className="w-3 h-3" />} label="Free Returns Enabled" />
                </div>
              </div>

              <div className="flex flex-col gap-3 shrink-0">
                 <button 
                  onClick={() => setIsEditing(true)}
                  className="bg-primary text-on-primary px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                 >
                    <Pencil className="w-3 h-3" />
                    Manage Profile
                 </button>
                 <button 
                   onClick={() => logOut()}
                   className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant hover:text-error transition-colors p-2"
                 >
                   <LogOut className="w-4 h-4" />
                   Logout
                 </button>
              </div>
            </motion.div>
          ) : (
            <motion.form 
              key="edit"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              onSubmit={handleSave}
              className="w-full grid grid-cols-1 md:grid-cols-3 gap-10"
            >
      <div className="flex flex-col items-center gap-6">
        <div className="relative group cursor-pointer" onClick={cycleAvatar}>
          <img 
            src={editData.photoURL} 
            alt="Edit preview" 
            className="w-40 h-40 rounded-full border-[8px] border-surface shadow-2xl relative object-cover ring-4 ring-primary/5 group-hover:opacity-80 transition-opacity"
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Sparkles className="w-10 h-10 text-white drop-shadow-lg" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-lg border-4 border-surface animate-bounce">
             <Camera className="w-6 h-6" />
          </div>
        </div>
        
        <div className="w-full space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center">Curated Mojis</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { style: 'avataaars', seed: 'Felix' },
              { style: 'bottts', seed: 'Aneka' },
              { style: 'pixel-art', seed: 'Vintage' },
              { style: 'lorelei', seed: 'Style' },
              { style: 'miniavs', seed: 'Cool' },
              { style: 'notionists', seed: 'Minimal' },
              { style: 'big-smile', seed: 'Happy' },
              { style: 'avataaars', seed: 'Grace' }
            ].map((moji, idx) => {
              const url = `https://api.dicebear.com/7.x/${moji.style}/svg?seed=${moji.seed}`;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setEditData(prev => ({ ...prev, photoURL: url }))}
                  className={cn(
                    "w-10 h-10 rounded-full overflow-hidden border-2 transition-all hover:scale-110 active:scale-95",
                    editData.photoURL === url ? "border-primary shadow-lg scale-110" : "border-outline-variant/30"
                  )}
                >
                  <img src={url} alt="moji" className="w-full h-full object-cover" />
                </button>
              );
            })}
          </div>
          <button 
            type="button"
            onClick={cycleAvatar}
            className="w-full py-2 text-[8px] font-black uppercase tracking-widest text-primary hover:underline"
          >
            Surprise Me (Randomize)
          </button>
        </div>
      </div>

              <div className="md:col-span-2 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant pl-1">Full Name</label>
                    <input 
                      type="text"
                      required
                      value={editData.full_name}
                      onChange={(e) => setEditData({...editData, full_name: e.target.value})}
                      className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant pl-1">Location</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                      <input 
                        type="text"
                        value={editData.location}
                        onChange={(e) => setEditData({...editData, location: e.target.value})}
                        className="w-full bg-surface-container border border-outline-variant/30 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                        placeholder="e.g. London, UK"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant pl-1">Mini Bio</label>
                  <textarea 
                    value={editData.bio}
                    onChange={(e) => setEditData({...editData, bio: e.target.value})}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium h-24 resize-none"
                    placeholder="Tell us about your style archive..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-grow bg-primary text-on-primary py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 hover:bg-primary-container"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Save Archive Profile
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 bg-surface-container-high text-on-surface py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-surface-variant transition-all hover:scale-105 active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Sections */}
        <div className="lg:col-span-8 space-y-12">
          {/* Recent Orders - eBay Style */}
          <section>
            <div className="flex items-center justify-between mb-8 border-b border-outline-variant/10 pb-4">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-6 h-6 text-primary" />
                <h2 className="font-garamond text-3xl font-bold text-on-surface italic">Purchase History</h2>
              </div>
              {orders.length > 0 && (
                <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline underline-offset-8">View Detailed History</button>
              )}
            </div>
            
            {fetchingOrders ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary/30" />
              </div>
            ) : orders.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {orders.map(order => (
                  <OrderCard 
                    key={order.id} 
                    id={order.id.slice(0, 8).toUpperCase()} 
                    date={order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'Just now'} 
                    item={order.items[0]?.name + (order.items.length > 1 ? ` +${order.items.length - 1} more` : '')} 
                    price={order.total} 
                    status={order.status} 
                    paymentMethod={order.paymentMethod}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-surface-container-low rounded-3xl p-10 border border-outline-variant/20 flex flex-col items-center justify-center text-center py-20 grayscale opacity-60">
                 <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center text-outline-variant mb-6 shadow-inner">
                    <ShoppingBag className="w-8 h-8" />
                 </div>
                 <h3 className="font-garamond text-2xl font-bold text-on-surface mb-2 italic">You haven't bought anything yet</h3>
                 <p className="text-on-surface-variant max-w-xs text-sm font-medium mb-8 leading-relaxed">Your curated vintage collection starts here. Explore our latest arrivals to find your first piece.</p>
                 <button 
                    onClick={() => navigate('/catalog')}
                    className="bg-on-surface text-surface px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all active:scale-95"
                 >
                   Start Shopping
                 </button>
              </div>
            )}
          </section>

          {/* Watchlist */}
          <section>
            <div className="flex items-center justify-between mb-8 border-b border-outline-variant/10 pb-4">
              <div className="flex items-center gap-3">
                <Heart className="w-6 h-6 text-error" />
                <h2 className="font-garamond text-3xl font-bold text-on-surface italic">Your Watchlist</h2>
              </div>
              <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline underline-offset-8">Manage List</button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 opacity-40 grayscale">
              <FavoriteItem image="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=200&auto=format&fit=crop" name="Heavy Wool Pea Coat" era="1950s" />
              <FavoriteItem image="https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=200&auto=format&fit=crop" name="Indigo Workwear Jacket" era="1960s" />
            </div>
            <div className="mt-8 p-6 bg-surface-container-low rounded-2xl border border-dashed border-outline-variant/30 text-center">
               <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant italic">Add items to your watchlist by clicking the heart icon in the shop</p>
            </div>
          </section>
        </div>

        {/* Sidebar Actions */}
        <div className="lg:col-span-4 space-y-8">
          {/* Quick Actions */}
          <section className="bg-surface border border-outline-variant/20 rounded-[2.5rem] p-8 shadow-sm">
            <h2 className="font-garamond text-2xl font-bold text-on-surface mb-8 italic">Quick Access</h2>
              <div className="space-y-3">
                <QuickAction 
                  icon={<CreditCard className="w-4 h-4" />} 
                  label="Payment Methods" 
                  onClick={() => setActivePanel(activePanel === 'payments' ? 'none' : 'payments')}
                />
                <AnimatePresence>
                  {activePanel === 'payments' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-surface-container/50 rounded-xl px-4"
                    >
                      <div className="py-4 space-y-3">
                        {fetchingPayments ? (
                          <div className="flex justify-center p-4">
                            <Loader2 className="w-4 h-4 animate-spin text-primary/30" />
                          </div>
                        ) : payments.length > 0 ? (
                          payments.map(payment => (
                            <div key={payment.id} className="flex items-center justify-between p-3 bg-surface rounded-lg border border-outline-variant/20 group/item">
                              <div className="flex items-center gap-3">
                                <CreditCard className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-bold">{payment.card_type} •••• {payment.last4}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                {payment.isDefault && (
                                  <span className="text-[8px] font-black tracking-widest text-on-surface-variant/40">PRIMARY</span>
                                )}
                                <button 
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      const { deleteDoc, doc } = await import('firebase/firestore');
                                      await deleteDoc(doc(db, 'users', user!.uid, 'payments', payment.id));
                                      setPayments(prev => prev.filter(p => p.id !== payment.id));
                                    } catch (err) { console.error(err); }
                                  }}
                                  className="opacity-0 group-hover/item:opacity-100 transition-opacity text-on-surface-variant/40 hover:text-error"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : !isAddingPayment && (
                          <p className="text-[8px] text-on-surface-variant text-center italic py-2">No payment methods saved.</p>
                        )}

                        {isAddingPayment ? (
                          <form onSubmit={handleAddPayment} className="p-3 bg-surface rounded-lg border border-primary/20 space-y-3 animate-in fade-in duration-300">
                             <div className="grid grid-cols-2 gap-2">
                               <input 
                                 type="text" 
                                 placeholder="VISA" 
                                 className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-2 py-1.5 text-[10px] focus:outline-none"
                                 value={newPayment.card_type}
                                 onChange={(e) => setNewPayment({...newPayment, card_type: e.target.value})}
                                 required
                               />
                               <input 
                                 type="text" 
                                 placeholder="XXXX" 
                                 maxLength={4}
                                 className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-2 py-1.5 text-[10px] focus:outline-none font-mono"
                                 value={newPayment.last4}
                                 onChange={(e) => setNewPayment({...newPayment, last4: e.target.value})}
                                 required
                               />
                             </div>
                             <div className="flex gap-2">
                               <button type="submit" disabled={loading} className="flex-grow bg-primary text-on-primary py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest">
                                 {loading ? 'Adding...' : 'Save'}
                               </button>
                               <button type="button" onClick={() => setIsAddingPayment(false)} className="px-3 bg-surface-container text-on-surface-variant py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest">
                                 Cancel
                               </button>
                             </div>
                          </form>
                        ) : (
                          <button 
                            onClick={() => setIsAddingPayment(true)}
                            className="w-full py-2 border-2 border-dashed border-outline-variant/30 rounded-lg text-[8px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-container transition-colors flex items-center justify-center gap-2"
                          >
                            <Plus className="w-3 h-3" /> Add Payment Method
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <QuickAction 
                  icon={<MapPin className="w-4 h-4" />} 
                  label="Shipping Addresses" 
                  onClick={() => setActivePanel(activePanel === 'addresses' ? 'none' : 'addresses')}
                />
                <AnimatePresence>
                  {activePanel === 'addresses' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-surface-container/50 rounded-xl px-4"
                    >
                      <div className="py-4 space-y-3">
                        {fetchingAddresses ? (
                          <div className="flex justify-center p-4">
                            <Loader2 className="w-4 h-4 animate-spin text-primary/30" />
                          </div>
                        ) : addresses.length > 0 ? (
                          addresses.map(address => (
                            <div key={address.id} className="p-3 bg-surface rounded-lg border border-outline-variant/20 relative group/item">
                              <p className="text-[10px] font-bold mb-1">{address.full_name}</p>
                              <p className="text-[9px] text-on-surface-variant leading-relaxed">{address.address_line}, {address.city}<br/>{address.postal_code}, {address.country}</p>
                              <div className="absolute top-3 right-3 flex items-center gap-2">
                                {address.isDefault && (
                                  <span className="text-[7px] font-black tracking-widest text-primary/40">DEFAULT</span>
                                )}
                                <button 
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      const { deleteDoc, doc } = await import('firebase/firestore');
                                      await deleteDoc(doc(db, 'users', user!.uid, 'addresses', address.id));
                                      setAddresses(prev => prev.filter(a => a.id !== address.id));
                                    } catch (err) { console.error(err); }
                                  }}
                                  className="opacity-0 group-hover/item:opacity-100 transition-opacity text-on-surface-variant/40 hover:text-error"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : !isAddingAddress && (
                          <p className="text-[8px] text-on-surface-variant text-center italic py-2">No addresses saved.</p>
                        )}

                        {isAddingAddress ? (
                          <form onSubmit={handleAddAddress} className="p-3 bg-surface rounded-lg border border-primary/20 space-y-2 animate-in slide-in-from-top-2 duration-300">
                             <input 
                               type="text" 
                               placeholder="Full Name" 
                               className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-2 py-1.5 text-[10px] focus:outline-none"
                               value={newAddress.full_name}
                               onChange={(e) => setNewAddress({...newAddress, full_name: e.target.value})}
                               required
                             />
                             <input 
                               type="text" 
                               placeholder="Address Line" 
                               className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-2 py-1.5 text-[10px] focus:outline-none"
                               value={newAddress.address_line}
                               onChange={(e) => setNewAddress({...newAddress, address_line: e.target.value})}
                               required
                             />
                             <div className="grid grid-cols-2 gap-2">
                               <input 
                                 type="text" 
                                 placeholder="City" 
                                 className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-2 py-1.5 text-[10px] focus:outline-none"
                                 value={newAddress.city}
                                 onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                                 required
                               />
                               <input 
                                 type="text" 
                                 placeholder="Postcode" 
                                 className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-2 py-1.5 text-[10px] focus:outline-none"
                                 value={newAddress.postal_code}
                                 onChange={(e) => setNewAddress({...newAddress, postal_code: e.target.value})}
                                 required
                               />
                             </div>
                             <div className="flex gap-2 pt-1">
                               <button type="submit" disabled={loading} className="flex-grow bg-primary text-on-primary py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest">
                                 {loading ? 'Saving...' : 'Add Address'}
                               </button>
                               <button type="button" onClick={() => setIsAddingAddress(false)} className="px-3 bg-surface-container text-on-surface-variant py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest">
                                 Cancel
                               </button>
                             </div>
                          </form>
                        ) : (
                          <button 
                            onClick={() => setIsAddingAddress(true)}
                            className="w-full py-2 border-2 border-dashed border-outline-variant/30 rounded-lg text-[8px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-container transition-colors flex items-center justify-center gap-2"
                          >
                            <Plus className="w-3 h-3" /> Add New Address
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <QuickAction 
                  icon={<User className="w-4 h-4" />} 
                  label="Personal Information" 
                  onClick={() => {
                    setIsEditing(true);
                    setActivePanel('none');
                  }}
                />

                <QuickAction 
                  icon={<Settings className="w-4 h-4" />} 
                  label="Security & Password" 
                  onClick={() => setActivePanel(activePanel === 'security' ? 'none' : 'security')}
                />
                <AnimatePresence>
                  {activePanel === 'security' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-surface-container/50 rounded-xl px-4"
                    >
                      <div className="py-4 space-y-2">
                        <button 
                          onClick={async () => {
                            if (!user?.email) return;
                            try {
                              const { sendPasswordResetEmail } = await import('firebase/auth');
                              const { auth } = await import('../lib/firebase');
                              await sendPasswordResetEmail(auth, user.email);
                              alert('Password reset email sent to ' + user.email);
                            } catch (err) { console.error(err); }
                          }}
                          className="w-full text-left p-3 text-[10px] font-bold hover:text-primary transition-colors flex items-center justify-between"
                        >
                          Send Reset Email <ChevronRight className="w-3 h-3" />
                        </button>
                        <button className="w-full text-left p-3 text-[10px] font-bold hover:text-primary transition-colors flex items-center justify-between border-t border-outline-variant/10">
                          Two-Factor Auth <span className="text-[8px] bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">OFF</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <QuickAction 
                  icon={<Sparkles className="w-4 h-4" />} 
                  label="Loyalty Rewards" 
                  onClick={() => setActivePanel(activePanel === 'rewards' ? 'none' : 'rewards')}
                />
                <AnimatePresence>
                  {activePanel === 'rewards' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-surface-container/50 rounded-xl px-4"
                    >
                      <div className="py-4 space-y-3">
                        <div className="p-3 bg-surface rounded-lg border border-primary/20">
                           <p className="text-[10px] font-bold mb-1">Your Balance</p>
                           <p className="font-mono text-lg text-primary">{profile?.points || 0} pts</p>
                        </div>
                        <p className="text-[8px] text-on-surface-variant italic px-1">Unlock 10% discount at 500 points.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
          </section>

          {/* Membership Tier */}
          <section className="bg-on-surface text-surface rounded-[2.5rem] p-10 relative overflow-hidden group border border-outline-variant/10 shadow-2xl">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 blur-3xl rounded-full translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-1000" />
            <h2 className="font-garamond text-2xl font-bold mb-2 italic">{profile?.tier || 'Standard Member'}</h2>
            <p className="text-surface/60 text-[10px] font-black uppercase tracking-[0.2em] mb-10">Elite Collector Tier {profile?.tier === 'Archive Master' ? 'MAX' : profile?.tier === 'Gold' ? '2' : profile?.tier === 'Silver' ? '1' : '0'}</p>
            
            <div className="mb-10 space-y-2">
               <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
                  <span className="text-surface/40 italic">Next Tier Progression</span>
                  <span className="text-primary">{profile?.points || 0} / 100 Points</span>
               </div>
               <div className="h-1.5 bg-surface/10 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)] transition-all duration-1000" 
                   style={{ width: `${Math.min(((profile?.points || 0) / 100) * 100, 100)}%` }}
                 />
               </div>
            </div>
            
            <ul className="space-y-4 mb-10 text-[10px] font-bold uppercase tracking-widest text-surface/60">
               <li className="flex items-center gap-3"><ShieldCheck className="w-4 h-4 text-primary" /> Free Authentication</li>
               <li className="flex items-center gap-3"><ShieldCheck className="w-4 h-4 text-primary" /> Curated In-Feed Drops</li>
               <li className="flex items-center gap-3 opacity-40"><ShieldCheck className="w-4 h-4" /> Priority Shipping</li>
            </ul>

            <button className="w-full bg-surface text-on-surface py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl">
              Unlock Elite Benefits
            </button>
          </section>

          <div className="p-6 text-center border-t border-outline-variant/10">
             <p className="text-[8px] font-black uppercase tracking-[0.4em] text-on-surface-variant/30 italic">re-closet verified member database</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardChip({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-surface rounded-full border border-outline-variant/30 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
      {icon}
      {label}
    </div>
  );
}

interface OrderCardProps {
  id: string;
  date: string;
  item: string;
  price: number;
  status: string;
  paymentMethod?: {
    type: string;
    details: string;
  };
}

const OrderCard: React.FC<OrderCardProps> = ({ id, date, item, price, status, paymentMethod }) => {
  return (
    <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5 flex items-center justify-between group hover:border-primary/50 transition-all hover:shadow-md">
      <div className="flex items-center gap-5">
        <div className="w-12 h-12 bg-surface-container rounded-xl flex items-center justify-center text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary transition-colors">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant">{id} • {date}</p>
            {paymentMethod && (
              <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-surface-container-high rounded text-on-surface-variant/70 border border-outline-variant/10">
                {paymentMethod.type === 'card' ? 'CARD' : paymentMethod.type.toUpperCase()}
              </span>
            )}
          </div>
          <h3 className="font-garamond text-lg font-bold text-on-surface italic">{item}</h3>
        </div>
      </div>
      <div className="text-right">
        <p className="font-mono text-lg font-bold text-primary mb-1">${price.toFixed(2)}</p>
        <span className={cn(
          "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
          status === 'Delivered' ? "bg-green-100 text-green-700" : 
          status === 'Processing' ? "bg-blue-100 text-blue-700" :
          "bg-orange-100 text-orange-700"
        )}>
          {status}
        </span>
      </div>
    </div>
  );
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors text-left group"
    >
      <div className="flex items-center gap-3">
        <div className="text-on-surface-variant group-hover:text-primary transition-colors">
          {icon}
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant group-hover:text-on-surface transition-colors">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-on-surface-variant/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
    </button>
  );
}

function FavoriteItem({ image, name, era }: { image: string, name: string, era: string }) {
  return (
    <div className="bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden group hover:border-primary/50 transition-all">
      <div className="h-32 overflow-hidden">
        <img src={image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
      </div>
      <div className="p-4">
        <p className="text-[8px] font-black uppercase tracking-widest text-primary mb-1">{era} Piece</p>
        <h3 className="font-garamond text-base font-bold text-on-surface leading-tight italic">{name}</h3>
      </div>
    </div>
  );
}

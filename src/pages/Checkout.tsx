import React, { useState } from 'react';
import { ShoppingBag, ArrowRight, ShieldCheck, Leaf, CreditCard, Lock, Trash2, ChevronLeft, Loader2, CheckCircle2, Smartphone, Globe, Check } from 'lucide-react';
import { useCart } from '../lib/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export function Checkout() {
  const { cart, subtotal, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mtn' | 'airtel' | 'zamtel'>('card');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'initiating' | 'awaiting_ussd' | 'verifying' | 'success'>('idle');
  const [isSuccess, setIsSuccess] = useState(false);
  
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if ((paymentMethod !== 'card') && !phoneNumber) {
      alert('Please enter your mobile money number');
      return;
    }

    setIsSubmitting(true);
    
    // START PAYMENT GATEWAY SIMULATION for Mobile Money
    if (paymentMethod !== 'card') {
      try {
        setPaymentStatus('initiating');
        await new Promise(r => setTimeout(r, 2000)); // Simulate network handshake
        setPaymentStatus('awaiting_ussd');
        await new Promise(r => setTimeout(r, 4000)); // Simulate user entering PIN
        setPaymentStatus('verifying');
        await new Promise(r => setTimeout(r, 2000)); // Finalizing
      } catch (err) {
        setIsSubmitting(false);
        setPaymentStatus('idle');
        return;
      }
    }

    try {
      const orderData = {
        userId: user.uid,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          era: item.era
        })),
        subtotal,
        tax,
        total,
        status: 'Processing',
        paymentMethod: {
          type: paymentMethod,
          details: paymentMethod === 'card' ? 'Visa/Mastercard' : phoneNumber
        },
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'orders'), orderData);
      clearCart();
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'orders');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting || isSuccess) {
    return (
      <div className="fixed inset-0 z-50 bg-on-surface/90 backdrop-blur-md flex items-center justify-center p-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-surface p-12 rounded-[3.5rem] shadow-2xl border border-outline-variant/20 text-center max-w-md w-full relative overflow-hidden"
        >
          {isSuccess ? (
            <>
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                <Check className="w-12 h-12 text-primary" />
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-primary/20 rounded-full"
                />
              </div>
              <h2 className="font-garamond text-4xl font-bold text-on-surface mb-4 italic">Order Confirmed</h2>
              <p className="text-on-surface-variant leading-relaxed mb-8">
                Your piece of history is being prepared.<br/>Redirecting to your dashboard...
              </p>
              <div className="h-1 bg-surface-container rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 3 }}
                  className="h-full bg-primary"
                />
              </div>
            </>
          ) : (
            <div className="space-y-8">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-primary/10 border-t-primary rounded-full animate-spin mx-auto" />
                <div className="absolute inset-0 flex items-center justify-center">
                  {paymentStatus === 'initiating' && <Globe className="w-8 h-8 text-primary animate-pulse" />}
                  {(paymentStatus === 'awaiting_ussd' || paymentStatus === 'idle') && <Smartphone className="w-8 h-8 text-primary animate-bounce" />}
                  {paymentStatus === 'verifying' && <ShieldCheck className="w-8 h-8 text-primary" />}
                </div>
              </div>
              <div>
                <h2 className="font-garamond text-3xl font-bold text-on-surface mb-2 italic">
                  {paymentStatus === 'initiating' && 'Connecting to Gateway...'}
                  {paymentStatus === 'awaiting_ussd' && 'Check Your Phone'}
                  {paymentStatus === 'verifying' && 'Confirming Payment'}
                  {paymentStatus === 'idle' && 'Placing Order'}
                </h2>
                <p className="text-on-surface-variant text-sm">
                  {paymentStatus === 'initiating' && `Contacting ${paymentMethod.toUpperCase()} Zambia network...`}
                  {paymentStatus === 'awaiting_ussd' && `We've sent a USSD prompt to ${phoneNumber}. Please enter your PIN to authorize K${(total * 27.5).toFixed(2)}.`}
                  {paymentStatus === 'verifying' && 'Transaction received. Finalizing your order...'}
                  {paymentStatus === 'idle' && 'Securely processing your request...'}
                </p>
              </div>
              {paymentStatus === 'awaiting_ussd' && (
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                   <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Transaction Ref</p>
                   <p className="font-mono text-xs opacity-60">ARC-{Math.random().toString(36).substring(7).toUpperCase()}</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center animate-in fade-in duration-700">
        <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center text-outline mb-6">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="font-garamond text-3xl font-bold text-on-surface mb-2 italic">Your bag is empty</h2>
        <p className="text-on-surface-variant mb-8 font-medium">Add some vintage treasures to start your collection.</p>
        <button 
          onClick={() => navigate('/catalog')}
          className="bg-primary text-on-primary px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:scale-105 transition-all shadow-xl active:scale-95"
        >
          Explore Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="py-8 pb-32 animate-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px] mb-4 hover:translate-x-[-4px] transition-transform">
            <ChevronLeft className="w-4 h-4" /> Go Back
          </button>
          <h1 className="font-garamond text-4xl font-bold text-on-surface italic">Checkout</h1>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">
           <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-green-500" /> eBay Guaranteed</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-8 space-y-8">
          {/* Shipping Section */}
          <section className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/20 shadow-sm">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black italic text-lg shadow-inner">1</div>
                  <h2 className="text-2xl font-bold text-on-surface font-garamond italic">Shipping Details</h2>
                </div>
                <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Saved Addresses</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2 px-1">Full Name</label>
                <input type="text" className="w-full bg-surface-container p-4 rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary/20 outline-none font-medium transition-all" placeholder="Enter recipient name" />
              </div>
              <div className="sm:col-span-2">
                 <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2 px-1">Street Address</label>
                 <input type="text" className="w-full bg-surface-container p-4 rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary/20 outline-none font-medium transition-all" placeholder="House number and street name" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2 px-1">City</label>
                <input type="text" className="w-full bg-surface-container p-4 rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary/20 outline-none font-medium transition-all" placeholder="City" />
              </div>
              <div className="flex gap-4">
                <div className="w-1/2">
                   <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2 px-1">State</label>
                   <input type="text" className="w-full bg-surface-container p-4 rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary/20 outline-none font-medium transition-all" placeholder="State" />
                </div>
                <div className="w-1/2">
                   <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2 px-1">Zip Code</label>
                   <input type="text" className="w-full bg-surface-container p-4 rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary/20 outline-none font-medium transition-all" placeholder="12345" />
                </div>
              </div>
            </div>
          </section>

          {/* Payment Section */}
          <section className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/20 shadow-sm">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black italic text-lg shadow-inner">2</div>
                  <h2 className="text-2xl font-bold text-on-surface font-garamond italic">Secure Payment</h2>
                </div>
                <div className="flex gap-2">
                   <div className="w-10 h-6 bg-surface-container rounded border border-outline-variant/20 flex items-center justify-center grayscale opacity-50"><CreditCard className="w-4 h-4" /></div>
                   <div className="w-10 h-6 bg-surface-container rounded border border-outline-variant/20"></div>
                </div>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className={cn(
                  "flex flex-col p-4 rounded-2xl border-2 transition-all cursor-pointer group relative overflow-hidden",
                  paymentMethod === 'card' ? "border-primary bg-primary/5" : "border-outline-variant/20 hover:border-outline-variant"
                )}>
                  <input type="radio" name="payment" className="hidden" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                  <div className="flex items-center justify-between mb-3 relative z-10">
                    <div className="w-10 h-10 bg-surface-container rounded-xl flex items-center justify-center shadow-inner">
                      <CreditCard className="w-5 h-5 text-on-surface-variant" />
                    </div>
                    {paymentMethod === 'card' && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <span className="text-xs font-black uppercase tracking-tighter relative z-10">Debit / Credit Card</span>
                  <span className="text-[10px] text-on-surface-variant/60 font-medium relative z-10">Visa, Mastercard</span>
                  {paymentMethod === 'card' && <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-2xl -translate-y-4 translate-x-4"></div>}
                </label>

                <label className={cn(
                  "flex flex-col p-4 rounded-2xl border-2 transition-all cursor-pointer group relative overflow-hidden",
                  paymentMethod === 'mtn' ? "border-[#FFCC00] bg-[#FFCC00]/5" : "border-outline-variant/20 hover:border-outline-variant"
                )}>
                  <input type="radio" name="payment" className="hidden" checked={paymentMethod === 'mtn'} onChange={() => setPaymentMethod('mtn')} />
                  <div className="flex items-center justify-between mb-3 relative z-10">
                    <div className="w-10 h-10 bg-[#FFCC00] rounded-xl flex items-center justify-center text-black font-black text-xs italic shadow-md">
                      MTN
                    </div>
                    {paymentMethod === 'mtn' && <div className="w-2 h-2 rounded-full bg-[#FFCC00]" />}
                  </div>
                  <span className="text-xs font-black uppercase tracking-tighter relative z-10">MTN Mobile Money</span>
                  <span className="text-[10px] text-on-surface-variant/60 font-medium relative z-10">Zambia</span>
                </label>

                <label className={cn(
                  "flex flex-col p-4 rounded-2xl border-2 transition-all cursor-pointer group relative overflow-hidden",
                  paymentMethod === 'airtel' ? "border-[#FF0000] bg-[#FF0000]/5" : "border-outline-variant/20 hover:border-outline-variant"
                )}>
                  <input type="radio" name="payment" className="hidden" checked={paymentMethod === 'airtel'} onChange={() => setPaymentMethod('airtel')} />
                  <div className="flex items-center justify-between mb-3 relative z-10">
                    <div className="w-10 h-10 bg-[#FF0000] rounded-xl flex items-center justify-center text-white font-black text-[10px] uppercase shadow-md">
                      airtel
                    </div>
                    {paymentMethod === 'airtel' && <div className="w-2 h-2 rounded-full bg-[#FF0000]" />}
                  </div>
                  <span className="text-xs font-black uppercase tracking-tighter relative z-10">Airtel Money</span>
                  <span className="text-[10px] text-on-surface-variant/60 font-medium relative z-10">Zambia</span>
                </label>

                <label className={cn(
                  "flex flex-col p-4 rounded-2xl border-2 transition-all cursor-pointer group relative overflow-hidden",
                  paymentMethod === 'zamtel' ? "border-[#008C45] bg-[#008C45]/5" : "border-outline-variant/20 hover:border-outline-variant"
                )}>
                  <input type="radio" name="payment" className="hidden" checked={paymentMethod === 'zamtel'} onChange={() => setPaymentMethod('zamtel')} />
                  <div className="flex items-center justify-between mb-3 relative z-10">
                    <div className="w-10 h-10 bg-[#008C45] rounded-xl flex items-center justify-center text-white font-black text-[10px] uppercase shadow-md">
                      Zamtel
                    </div>
                    {paymentMethod === 'zamtel' && <div className="w-2 h-2 rounded-full bg-[#008C45]" />}
                  </div>
                  <span className="text-xs font-black uppercase tracking-tighter relative z-10">Zamtel Kwacha</span>
                  <span className="text-[10px] text-on-surface-variant/60 font-medium relative z-10">Zambia</span>
                </label>
              </div>

              {paymentMethod === 'card' ? (
                <div className="grid grid-cols-1 gap-5 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                   <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2 px-1">Card Number</label>
                      <input type="text" className="w-full bg-surface-container p-4 rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary/20 outline-none font-mono text-xl transition-all" placeholder="0000 0000 0000 0000" />
                   </div>
                   <div className="flex gap-5">
                      <div className="w-1/2">
                         <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2 px-1">Expiry</label>
                         <input type="text" className="w-full bg-surface-container p-4 rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary/20 outline-none font-mono text-lg transition-all" placeholder="MM/YY" />
                      </div>
                      <div className="w-1/2">
                         <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2 px-1">CVV</label>
                         <input type="password" className="w-full bg-surface-container p-4 rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary/20 outline-none font-mono text-lg transition-all" placeholder="***" />
                      </div>
                   </div>
                </div>
              ) : (
                <div className="bg-surface p-6 rounded-2xl border-2 border-outline-variant/10 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 shadow-inner">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant pl-1">Mobile Money Number</label>
                    <input 
                      type="tel" 
                      placeholder="09X XXX XXXX"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono font-black"
                    />
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                       <ArrowRight className="w-3 h-3 text-primary animate-pulse" />
                    </div>
                    <p className="text-[9px] text-on-surface-variant/70 italic leading-relaxed">
                      You will receive a USSD prompt on your phone to authorize the estimated transaction of <strong className="text-primary">K{(total * 27.5).toFixed(2)}</strong>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Items Section */}
          <section className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/20 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-2xl font-bold text-on-surface font-garamond italic">Your Finds ({cart.length})</h2>
               <button onClick={clearCart} className="text-[10px] font-black uppercase tracking-widest text-error/60 hover:text-error transition-colors flex items-center gap-2">
                 <Trash2 className="w-3 h-3" /> Clear Bag
               </button>
            </div>
            <div className="space-y-8">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-6 group hover:translate-x-2 transition-transform duration-300">
                  <div className="w-24 h-32 bg-surface-container rounded-2xl overflow-hidden flex-shrink-0 shadow-sm border border-outline-variant/10">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 py-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                           <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">{item.era}</span>
                           <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                           <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{item.category}</span>
                        </div>
                        <h4 className="text-xl font-bold font-garamond italic text-on-surface">{item.name}</h4>
                      </div>
                      <button onClick={() => item.id && removeFromCart(item.id)} className="p-2 text-on-surface-variant/40 hover:text-error transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                       <div className="flex items-center gap-3 bg-surface-container px-3 py-1.5 rounded-full border border-outline-variant/20">
                          <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Qty: {item.quantity}</span>
                       </div>
                       <p className="font-black text-xl text-primary font-mono">${item.price.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Order Summary */}
        <aside className="lg:col-span-4 sticky top-24 space-y-8">
          <div className="bg-on-surface text-surface p-8 rounded-3xl shadow-2xl relative overflow-hidden group border border-outline-variant/10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-1000" />
            <h2 className="text-2xl font-bold font-garamond italic mb-8 relative">Review Order</h2>
            <div className="space-y-4 pb-8 border-b border-surface/10 relative">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-surface/60 uppercase tracking-widest text-[10px] font-black">Subtotal</span>
                <span className="font-mono font-bold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className="text-surface/60 uppercase tracking-widest text-[10px] font-black">Shipping</span>
                <span className="text-secondary font-black uppercase tracking-tighter text-[10px]">Free Shipping</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className="text-surface/60 uppercase tracking-widest text-[10px] font-black">Total Tax</span>
                <span className="font-mono font-bold">${tax.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center py-8 relative">
              <span className="text-xl font-bold font-garamond italic">Total Due</span>
              <span className="text-3xl font-black text-primary font-mono">${total.toFixed(2)}</span>
            </div>
            <button 
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="w-full bg-primary text-on-primary py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl hover:shadow-primary/20 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Securing Archive...
                </>
              ) : (
                'Submit Order'
              )}
            </button>
            <div className="mt-8 flex items-center justify-center gap-3 text-[10px] text-surface/40 uppercase tracking-widest font-black">
               <Lock className="w-4 h-4" /> Encryption Active
               <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
            </div>
          </div>
          
          <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/20 shadow-sm flex items-start gap-4">
             <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary flex-shrink-0">
               <Leaf className="w-6 h-6" />
             </div>
             <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Eco Impact</p>
               <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                 By choosing vintage, you saved <strong className="text-on-surface">1,240 liters</strong> of water compared to buying new.
               </p>
             </div>
          </div>

          <div className="p-6 text-center">
             <p className="text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-[0.3em] leading-relaxed">
               All transactions are protected by end-to-end encryption. You are covered by the Re-Closet Satisfaction Guarantee.
             </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

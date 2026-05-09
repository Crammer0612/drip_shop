import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { ShieldCheck, Mail, Lock, User, ArrowRight, Github, Chrome, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

type AuthMode = 'login' | 'register' | 'forgot-password';

export function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.role === 'admin') {
            navigate('/admin');
          } else {
            navigate(from, { replace: true });
          }
        } else {
          navigate(from, { replace: true });
        }
      } else if (mode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Create user profile
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          id: userCredential.user.uid,
          full_name: fullName,
          email: email,
          role: 'user', // Default role
          status: 'active',
          createdAt: serverTimestamp(),
          photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
        });
        
        navigate('/', { replace: true });
      } else if (mode === 'forgot-password') {
        await sendPasswordResetEmail(auth, email);
        setSuccess('Password reset link sent to your email.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (!userDoc.exists()) {
        // First time social login -> Create profile as visitor
        await setDoc(doc(db, 'users', result.user.uid), {
          id: result.user.uid,
          full_name: result.user.displayName || result.user.email?.split('@')[0] || 'User',
          email: result.user.email,
          role: 'user',
          status: 'active',
          createdAt: serverTimestamp(),
          photoURL: result.user.photoURL
        });
      }
      
      const userData = (await getDoc(doc(db, 'users', result.user.uid))).data();
      if (userData?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-surface border border-outline-variant/30 rounded-3xl overflow-hidden shadow-2xl relative"
      >
        {/* Progress Bar */}
        {loading && <div className="absolute top-0 left-0 right-0 h-1 bg-primary/20 overflow-hidden">
          <div className="h-full bg-primary animate-progress origin-left" />
        </div>}

        <div className="p-8 pb-4">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary rotate-3 transform hover:rotate-0 transition-transform">
              <ShieldCheck className="w-8 h-8" />
            </div>
          </div>
          
          <h2 className="font-garamond text-3xl font-bold text-center text-on-surface mb-2 italic">
            {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Sign Up' : 'Reset Password'}
          </h2>
          <p className="text-on-surface-variant text-center text-sm font-medium uppercase tracking-widest mb-8">
            {mode === 'login' ? 'Log in to your account' : mode === 'register' ? 'Create your vintage account' : 'Enter your email to reset password'}
          </p>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-error/10 text-error p-4 rounded-xl flex items-start gap-3 mb-6 text-sm"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}

            {success && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-primary/10 text-primary p-4 rounded-xl flex items-start gap-3 mb-6 text-sm"
              >
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <p>{success}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleAuth} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/50" />
                  <input 
                    required 
                    type="text"
                    placeholder="e.g. John Doe"
                    className="w-full bg-surface-container p-4 pl-12 rounded-2xl border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary transition-all font-medium"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/50" />
                <input 
                  required 
                  type="email"
                  placeholder="name@email.com"
                  className="w-full bg-surface-container p-4 pl-12 rounded-2xl border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary transition-all font-medium"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            {mode !== 'forgot-password' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Password</label>
                  {mode === 'login' && (
                    <button 
                      type="button"
                      onClick={() => setMode('forgot-password')}
                      className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/50" />
                  <input 
                    required 
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-surface-container p-4 pl-12 rounded-2xl border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary transition-all font-medium"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            <button 
              disabled={loading}
              type="submit"
              className="w-full bg-primary text-on-primary py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  {mode === 'login' ? 'Log In' : mode === 'register' ? 'Sign Up' : 'Reset password'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {mode !== 'forgot-password' && (
            <>
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-outline-variant/30"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-surface px-4 text-on-surface-variant font-bold uppercase tracking-[0.3em]">Or Continue With</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <button 
                  onClick={handleSocialLogin}
                  className="flex items-center justify-center gap-3 bg-surface-container py-3 rounded-xl border border-outline-variant/30 hover:bg-surface-container-high transition-colors font-bold text-xs uppercase tracking-widest"
                >
                  <Chrome className="w-4 h-4" />
                  Google
                </button>
                <button className="flex items-center justify-center gap-3 bg-surface-container py-3 rounded-xl border border-outline-variant/30 hover:bg-surface-container-high transition-colors font-bold text-xs uppercase tracking-widest opacity-50 cursor-not-allowed">
                  <Github className="w-4 h-4" />
                  GitHub
                </button>
              </div>
            </>
          )}
        </div>

        <div className="p-6 bg-surface-container-low border-t border-outline-variant/30 text-center">
          <button 
            type="button"
            onClick={() => {
              setError(null);
              setSuccess(null);
              setMode(mode === 'login' ? 'register' : 'login');
            }}
            className="text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
          >
            {mode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

import { CheckCircle2 } from 'lucide-react';

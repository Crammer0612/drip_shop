import React from 'react';
import { Menu, ShoppingBag, Sparkles, Layers, Archive, User, LogOut, ShieldCheck, LayoutDashboard, Sun, Moon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from './lib/utils';
import { logOut } from './lib/firebase';
import { useAuth } from './contexts/AuthContext';
import { useCart } from './lib/CartContext';
import { useTheme } from './contexts/ThemeContext';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isCheckout = location.pathname === '/checkout';
  const isAuth = location.pathname === '/auth';

  return (
    <div className={cn("min-h-screen bg-background text-on-background", (isCheckout || isAuth) ? "pb-0" : "pb-24 md:pb-0")}>
      {!isAuth && (
        <header className="w-full top-0 sticky z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 transition-opacity hover:opacity-100">
          <div className="flex justify-between items-center px-4 md:px-16 h-16 w-full max-w-[1280px] mx-auto">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all duration-300">
                  <Archive className="w-5 h-5" />
                </div>
                <h1 className="font-garamond text-2xl font-bold text-primary uppercase tracking-widest hidden sm:block">RE-CLOSET</h1>
              </Link>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <DesktopNavItem to="/" label="Home" active={location.pathname === '/'} />
              <DesktopNavItem to="/catalog" label="Shop" active={location.pathname === '/catalog'} />
              {user && !isAdmin && (
                <DesktopNavItem to="/dashboard" label="My Account" active={location.pathname === '/dashboard'} />
              )}
              {isAdmin && (
                <>
                  <DesktopNavItem to="/admin" label="Dashboard" active={location.pathname === '/admin'} />
                  <DesktopNavItem to="/inventory" label="Inventory" active={location.pathname === '/inventory'} />
                </>
              )}
            </nav>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <Link 
                    to={isAdmin ? "/admin" : "/dashboard"}
                    className="w-8 h-8 rounded-full border-2 border-primary/20 p-0.5 overflow-hidden hover:scale-110 active:scale-95 transition-all shadow-sm"
                  >
                    <img src={profile?.photoURL || user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt="user" className="w-full h-full rounded-full object-cover" />
                  </Link>
                  <button 
                    onClick={() => logOut()}
                    className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-error transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              ) : (
                <Link 
                  to="/auth"
                  className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-md active:scale-95"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Login
                </Link>
              )}
              <button 
                onClick={toggleTheme}
                className="p-2 bg-surface-container rounded-full hover:bg-surface-container-high transition-colors text-primary active:scale-95"
                aria-label="Toggle Theme"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
              <Link to="/checkout" className="relative active:scale-95 transition-transform p-2 bg-surface-container rounded-full hover:bg-surface-container-high">
                <ShoppingBag className="w-5 h-5 text-primary" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-secondary text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full leading-none font-bold animate-in zoom-in duration-300">
                    {totalItems}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </header>
      )}

      <main className={cn("max-w-[1280px] mx-auto px-4 md:px-16", isAuth && "md:px-4")}>
        {children}
      </main>

      {!isCheckout && !isAuth && (
        <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-4 pt-2 bg-surface-container border-t border-outline-variant/30 shadow-lg z-50 rounded-t-2xl">
          <NavItem to="/" icon={<Sparkles />} label="Home" active={location.pathname === '/'} />
          <NavItem to="/catalog" icon={<Layers />} label="Shop" active={location.pathname === '/catalog'} />
          {isAdmin ? (
            <>
              <NavItem to="/admin" icon={<LayoutDashboard />} label="Dashboard" active={location.pathname === '/admin'} />
              <NavItem to="/inventory" icon={<Archive />} label="Inventory" active={location.pathname === '/inventory'} />
            </>
          ) : (
            <>
              <NavItem to={user ? "/dashboard" : "/auth"} icon={<User />} label={user ? "Account" : "Login"} active={location.pathname === '/dashboard' || location.pathname === '/auth'} />
            </>
          )}
        </nav>
      )}
    </div>
  );
}

function NavItem({ to, icon, label, active }: { to: string, icon: React.ReactNode, label: string, active: boolean }) {
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center justify-center px-4 py-1.5 rounded-xl transition-all duration-300",
        active ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant hover:text-primary active:scale-90"
      )}
    >
      {React.cloneElement(icon as React.ReactElement, { className: cn("w-5 h-5", active && "fill-current") })}
      <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">{label}</span>
    </Link>
  );
}

function DesktopNavItem({ to, label, active }: { to: string, label: string, active: boolean }) {
  return (
    <Link
      to={to}
      className={cn(
        "text-xs font-bold uppercase tracking-[0.2em] transition-all relative py-2 group",
        active ? "text-primary" : "text-on-surface-variant hover:text-primary"
      )}
    >
      {label}
      <span className={cn(
        "absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300",
        active ? "w-full" : "w-0 group-hover:w-full"
      )} />
    </Link>
  );
}

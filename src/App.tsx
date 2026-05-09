import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './Layout';
import { Home } from './pages/Home';
import { Inventory } from './pages/Inventory';
import { Catalog } from './pages/Catalog';
import { Checkout } from './pages/Checkout';
import { Auth } from './pages/Auth';
import { UserDashboard } from './pages/UserDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './lib/CartContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <CartProvider>
            <Layout>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                
                {/* Protected General Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/catalog" element={<Catalog />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/dashboard" element={<UserDashboard />} />
                </Route>

                {/* Protected Admin Routes */}
                <Route element={<ProtectedRoute requireAdmin={true} />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/inventory" element={<Inventory />} />
                </Route>
              </Routes>
            </Layout>
          </CartProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

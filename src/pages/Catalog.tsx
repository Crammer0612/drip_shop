import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Zap, Droplets, Leaf, ShoppingBag } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { productService, Product } from '../lib/productService';
import { useCart } from '../lib/CartContext';

export function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const categoryFilter = searchParams.get('category');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let data: Product[] | undefined;
        if (categoryFilter) {
          data = await productService.getProductsByCategory(categoryFilter);
        } else {
          data = await productService.getProducts();
        }
        if (data) setProducts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [categoryFilter]);

  const filteredProducts = products.filter(p => {
    if (activeTab === 'All') return true;
    if (activeTab === 'In Stock') return p.status === 'in_stock';
    if (activeTab === 'Sold') return p.status === 'sold';
    return true;
  });

  return (
    <div className="py-8 pb-32 animate-in fade-in duration-500">
       <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <h2 className="font-garamond text-4xl font-bold text-on-surface mb-2 italic">The Collection</h2>
          <p className="text-on-surface-variant max-w-xl">Browse our carefully selected vintage pieces and sustainable finds.</p>
        </div>
        <div className="flex-grow max-w-md relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
          <input
            type="text"
            className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-2xl focus:ring-2 focus:ring-primary/20 text-lg shadow-sm"
            placeholder="Search the shop..."
          />
        </div>
      </div>

       <div className="flex flex-wrap items-center justify-between gap-6 mb-10">
          <div className="flex bg-surface-container-low p-1.5 rounded-2xl border border-outline-variant/30">
            {['All', 'In Stock', 'Sold'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-8 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all",
                  activeTab === tab ? "bg-primary text-on-primary shadow-lg" : "text-on-surface-variant hover:text-primary"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          
          {categoryFilter && (
            <div className="flex items-center gap-4">
              <span className="bg-secondary-container text-on-secondary-container px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-sm">
                Category: {categoryFilter}
                <button 
                  onClick={() => setSearchParams({})}
                  className="hover:scale-110 transition-transform p-1 rounded-full hover:bg-on-secondary-container/10"
                >
                  <Plus className="w-4 h-4 rotate-45" />
                </button>
              </span>
            </div>
          )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {Array(8).fill(0).map((_, i) => (
             <div key={i} className="animate-pulse">
               <div className="aspect-[3/4] bg-surface-container rounded-3xl mb-4"></div>
               <div className="h-4 bg-surface-container rounded-full w-3/4 mb-2"></div>
               <div className="h-4 bg-surface-container rounded-full w-1/2"></div>
             </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-32 text-center">
           <p className="text-on-surface-variant font-medium italic text-lg mb-4">No pieces found matching your criteria.</p>
           <button onClick={() => { setActiveTab('All'); setSearchParams({}); }} className="text-primary font-bold uppercase tracking-widest text-xs hover:underline decoration-2 underline-offset-4">Reset all filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
          {filteredProducts.map((item) => (
            <div 
              key={item.id} 
              className="group cursor-pointer"
              onClick={() => navigate('/checkout')}
            >
              <div className="relative aspect-[3/4] bg-surface-container rounded-3xl overflow-hidden mb-4 shadow-sm group-hover:shadow-xl transition-all duration-500">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  referrerPolicy="no-referrer" 
                />
                {item.status === 'sold' && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="bg-white/90 text-black px-6 py-2 rounded-full font-black uppercase tracking-widest text-xs shadow-xl">Archive</span>
                  </div>
                )}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                   <div 
                     onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                     className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-primary shadow-lg hover:scale-110 active:scale-90 transition-all"
                   >
                      <ShoppingBag className="w-5 h-5" />
                   </div>
                   <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-primary shadow-lg hover:scale-110 active:scale-90 transition-all">
                      <Eye className="w-5 h-5" />
                   </div>
                </div>
              </div>
              <div className="px-2">
                <div className="flex items-center gap-2 mb-1">
                   <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">{item.era}</span>
                   <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                   <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{item.category}</span>
                </div>
                <h3 className="font-garamond text-xl text-on-surface leading-tight mb-1 group-hover:text-primary transition-colors">{item.name}</h3>
                <p className="font-bold text-lg text-primary">${item.price}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const CATALOG_ITEMS = []; // Removed static items

import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { Search, ShoppingBag, Menu, Heart, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { productService, Product } from '../lib/productService';
import { useCart } from '../lib/CartContext';

interface Category {
  id: string;
  name: string;
  image: string;
}

const CATEGORIES: Category[] = [
  { id: 'tops', name: 'Tops', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZ6K0N7L1yxBD_ZelOlwVDQakaji-KxbXcS_QoB9p2xvFUs0WDAinQGadBt1JhNcE5CeyMHdkOP2IWASQjfNSej042gVFr-RN2LwcEWY0_j9tHE1dT1gIXsF9oQ-vqFISp462WAPPOzFzkOS_DgJaOkWvzBxv2XN0YwMOOBV5QnIjbX4KgJ2xGSfN5qzd3Z5E4bWxbc-dFbo541cqH0oILRNM1_tg7OR_P0M4kzieDn8uaaX15FGa1c4I9WRBN2F-ohhe0sbhySA' },
  { id: 'bottoms', name: 'Bottoms', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA69Uxh1cPdIbtaP0lManiTGN1dqNBH8PqJSGu6fk5IMDLRX4-QbzDPBsgfM_NKxI0qWTg279DE_3RETGTP3_XkC9IvZovEen1JW5yM-Yc97GOEFt7jWSJcu-vhzUQY7Opmvn-nGt64OmGKXSmwsEColOb827DV-eU0SWtIjWNs-0Va2xhHhqApswQ6NSGN9CLoJ0kL9xJUK5O2zSfaccY9VQ4VmSfRE1ENG3_EeXjiskNp6WiiLxvGueUI0fjtIIN9l9uEdn47QQ' },
  { id: 'outerwear', name: 'Outerwear', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUqbjHM07FyP7LpHlVLWEOSDBPLxsr_zALQ28PLEI6PpAPJHEQEkz5b4ArACbk9vg-6wMcXi1-QwLQ0klp6N3AJ-n9Eis3aGn0cT5LYEZWhCejChQkEgiM1mfKedd1KQV-U8BuRXHBxDaXt-UaCmgOcsswtOlFxGBcaQQhE4S4-8oy1ZkIqR49_nkM27cKNko3nTDAEA6lOruNYBA8TcltFkhQcCzsXmekkC4y0HbpFt9sE_uV4rBMMSTZ7e3qt3EsxGa--JkNSQ' },
  { id: 'accessories', name: 'Accessories', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMKOwhtisuyk628Os7EkIEZw4AZuU9VmpEweLX5zuNOroXytgZFfbpX3ZmMk5m-7RGD8xRNin50y8gohY3iCD3Qwh3iuXPS9XdueaqY8g1Y1BRKDlY6LPI64F4fClN4jFpQ1jQvqooawIYcr2O2e7YCq3O5zqw6PbcMpDSlWDgBlLrfTy3reUblYz3J-FtKLcsKtNbocgFglM_aYBn7nRKLgNn7Y-1-8C-wBbNglp54f6-7C4SZvneI8sbFoHIrxYpP-ziucBf0A' },
  { id: 'knitwear', name: 'Knitwear', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCkpfzUJMp2r89HRyt8SMj321lH73FdE7ITY-ZVgi1t4kLQWRyOFDQ4eNNWUf-v0paI-s6GDt6vbT3vILLzOPIZ81fcuTAcKZ4k6Vr8nUXXaWoE-mjz9d2d9Tp8c2rUBXiWDiaCpq83IfGjGy5WdNE6haBerUEJ_mfWQeSwM8ArC3e34Y9tHHFf-1NrWuUeemjcKYI9JSVKzooWfBRnm7FcNwkqzWV6Xy_nFD_SQnrWB2oMa8LOFyBjmxkzW9n-0fjfPkQM_63TZA' },
];

export function Home() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      const data = await productService.getFeaturedProducts(4);
      if (data) setFeaturedProducts(data);
      setLoading(false);
    };
    fetchFeatured();
  }, []);

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/catalog?category=${categoryId}`);
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* Search Bar */}
      <section className="mt-8">
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-outline" />
          </div>
          <input
            type="text"
            className="w-full h-14 pl-12 pr-4 bg-surface-container-low border-none rounded-xl font-sans text-lg text-on-surface-variant focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
            placeholder="Search curated vintage & eco-finds..."
          />
        </div>
      </section>

      {/* Categories */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-garamond text-2xl font-bold text-on-surface italic">Shop by Category</h2>
          <button onClick={() => navigate('/catalog')} className="text-xs font-black uppercase tracking-widest text-primary hover:underline">View all</button>
        </div>
        <div className="flex overflow-x-auto gap-4 hide-scrollbar pb-4 -mx-gutter px-gutter md:mx-0 md:px-0">
          {CATEGORIES.map((cat) => (
            <div 
              key={cat.id} 
              onClick={() => handleCategoryClick(cat.id)}
              className="flex-none group cursor-pointer text-center"
            >
              <div className="w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden bg-surface-container-high mb-2 transition-transform group-hover:scale-105 border border-outline-variant/10 shadow-sm">
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest">{cat.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Items */}
      {featuredProducts.length > 0 && (
        <section className="mt-10">
          <div className="mb-8">
            <h2 className="font-garamond text-2xl font-bold text-on-surface italic">Curated Spotlight</h2>
            <p className="text-sm text-on-surface-variant font-medium">Hand-picked highlights from our current collection.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div 
              className="md:col-span-8 bg-surface-container-low rounded-3xl overflow-hidden group cursor-pointer shadow-sm border border-outline-variant/10"
              onClick={() => navigate('/catalog')}
            >
              <div className="relative h-[400px] md:h-[500px]">
                <img
                  src={featuredProducts[0].image}
                  alt={featuredProducts[0].name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white">
                  <div className="flex gap-2 mb-3">
                    <span className="bg-primary text-on-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest italic flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Featured Piece
                    </span>
                    <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{featuredProducts[0].era}</span>
                  </div>
                  <h3 className="font-garamond text-3xl md:text-5xl mb-2 italic font-bold">{featuredProducts[0].name}</h3>
                  <p className="text-lg text-white/90 max-w-lg mb-6 line-clamp-2">{featuredProducts[0].description}</p>
                  <button 
                    onClick={(e) => { e.stopPropagation(); addToCart(featuredProducts[0]); }}
                    className="bg-white text-primary px-10 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                  >
                    Add to Bag — ${featuredProducts[0].price}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-4 flex flex-col gap-6">
               {featuredProducts.slice(1, 3).map((item) => (
                 <div 
                   key={item.id}
                   onClick={() => navigate('/catalog')}
                   className="flex-1 bg-surface-container-low rounded-3xl p-6 group cursor-pointer flex flex-col justify-between hover:bg-surface-variant transition-all shadow-sm border border-outline-variant/10"
                 >
                    <div>
                      <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden mb-4">
                        <img
                          src={item.image}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          alt={item.name}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                         <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">{item.era}</span>
                         <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                         <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{item.category}</span>
                      </div>
                      <h4 className="font-garamond text-xl text-on-surface mb-1 font-bold italic line-clamp-1 group-hover:text-primary transition-colors">{item.name}</h4>
                    </div>
                    <p className="font-black text-lg text-primary mt-2">${item.price}</p>
                 </div>
               ))}
               {featuredProducts.length < 3 && (
                 <div className="flex-1 rounded-3xl border-2 border-dashed border-outline-variant/30 flex items-center justify-center p-8 text-center bg-surface-container-lowest/50">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest italic opacity-60">Admin: Add more featured pieces in inventory</p>
                 </div>
               )}
            </div>
          </div>
        </section>
      )}

      {/* New Drops */}
      <section className="mt-10 mb-24">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-garamond text-2xl font-bold text-on-surface italic">Latest Arrivals</h2>
          <div className="flex gap-2">
            <button onClick={() => navigate('/catalog')} className="text-xs font-black uppercase tracking-widest text-primary border-b-2 border-primary hover:opacity-80 transition-opacity">View all</button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
          {loading ? (
             Array(4).fill(0).map((_, i) => (
               <div key={i} className="animate-pulse">
                 <div className="aspect-[3/4] bg-surface-container rounded-2xl mb-3"></div>
                 <div className="h-4 bg-surface-container rounded w-3/4 mb-2"></div>
                 <div className="h-4 bg-surface-container rounded w-1/2"></div>
               </div>
             ))
          ) : featuredProducts.length > 0 ? (
            featuredProducts.map((product) => (
              <div key={product.id} className="group cursor-pointer">
                <div className="relative aspect-[3/4] bg-surface-container rounded-2xl overflow-hidden mb-3">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                      className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-all active:scale-90 shadow-sm"
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-primary active:scale-90 transition-all shadow-sm">
                      <Heart className="w-4 h-4" />
                    </div>
                  </div>
                </div>
                <div className="px-1">
                  <div className="flex items-center gap-2 mb-1 text-[10px] uppercase tracking-wider font-semibold text-secondary">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    <p>{product.category} • {product.era}</p>
                  </div>
                  <h5 className="text-lg text-on-surface mb-0.5 leading-snug">{product.name}</h5>
                  <p className="font-semibold text-primary">${product.price}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-10 text-center text-on-surface-variant italic">
              No drops yet. Check back soon or visit our catalog.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Leaf, X, Upload, FileText, ImageIcon, HardDrive, CheckCircle2, AlertCircle, Loader2, Lock, ShieldCheck, ShoppingBag, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { productService, Product } from '../lib/productService';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

interface FileUploadState {
  id: string;
  name: string;
  size: string;
  type: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
}

export function Inventory() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileUploadState[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Product, 'id' | 'createdAt'>>({
    name: '',
    category: 'tops',
    era: '',
    price: 0,
    image: '',
    description: '',
    status: 'in_stock',
    featured: false
  });

  useEffect(() => {
    if (user && isAdmin) {
      fetchProducts();
    }
  }, [user, isAdmin]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await productService.getProducts();
      if (data) setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFilesChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const chosenFiles = Array.from(e.target.files);
      const newFiles: FileUploadState[] = chosenFiles.map((file: File) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: file.type || 'application/octet-stream',
        status: 'pending',
        progress: 0
      }));

      setFiles(prev => [...prev, ...newFiles]);
      processFiles(newFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const newFiles: FileUploadState[] = droppedFiles.map((file: File) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: file.type || 'application/octet-stream',
      status: 'pending',
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFiles]);
    processFiles(newFiles);
  }, []);

  const processFiles = async (filesToProcess: FileUploadState[]) => {
    for (const file of filesToProcess) {
      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'uploading' } : f));
      
      // Simulate upload progress
      for (let p = 0; p <= 100; p += 20) {
        await new Promise(r => setTimeout(r, 200));
        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, progress: p } : f));
      }

      // Logic check: if it looks like an image, we'll auto-generate a sample product
      try {
        const isImage = file.type.startsWith('image/');
        const newProduct: Omit<Product, 'id' | 'createdAt'> = {
          name: file.name.split('.')[0].replace(/[-_]/g, ' '),
          category: 'tops',
          era: 'Modern Vintage',
          price: Math.floor(Math.random() * 100) + 20,
          image: isImage ? 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=200&auto=format&fit=crop' : '',
          description: `Automatically imported from ${file.name}. This unique piece belongs to our circular economy collection.`,
          status: 'in_stock'
        };

        if (isImage || file.name.endsWith('.csv') || file.name.endsWith('.json')) {
           await productService.addProduct(newProduct);
           setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'completed', progress: 100 } : f));
        } else {
          setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'error', progress: 0 } : f));
        }
      } catch (err) {
        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'error' } : f));
      }
    }
    fetchProducts();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await productService.updateProduct(editingId, formData);
      } else {
        await productService.addProduct(formData);
      }
      closeModal();
      fetchProducts();
    } catch (err) {
      alert("System Error. Please verify connection.");
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id || null);
    setFormData({
      name: product.name,
      category: product.category,
      era: product.era,
      price: product.price,
      image: product.image,
      description: product.description,
      status: product.status,
      featured: product.featured || false
    });
    setIsBatchMode(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFiles([]);
    setFormData({
      name: '',
      category: 'tops',
      era: '',
      price: 0,
      image: '',
      description: '',
      status: 'in_stock',
      featured: false
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Permanently remove this garment from the database?")) {
      await productService.deleteProduct(id);
      fetchProducts();
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-on-surface-variant">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="font-garamond italic text-xl">Securing Archive Connection...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center text-primary mb-8 shadow-inner">
          <Lock className="w-10 h-10" />
        </div>
        <h2 className="font-garamond text-4xl font-medium text-on-surface mb-4 italic">Unauthorized Vault Access</h2>
        <p className="text-on-surface-variant max-w-md mb-10 leading-relaxed text-lg">
          The inventory management system is restricted to <strong className="text-primary">Authenticated Administrators</strong>. Please sign in to manage the catalog, adjust pricing, and process imports.
        </p>
        <Link 
          to="/auth"
          className="flex items-center gap-3 bg-primary text-on-primary px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl"
        >
          <ShieldCheck className="w-6 h-6" />
          Request Access
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8 pb-32 animate-in fade-in duration-500">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 text-on-surface">
        <div>
          <h2 className="font-garamond text-3xl font-medium text-primary mb-2">Inventory Management</h2>
          <p className="text-lg text-on-surface-variant max-w-xl">
            View and manage your product catalog. Use the <strong className="text-primary">Batch Upload</strong> for multiple items or add them manually.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => { setIsBatchMode(true); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 bg-secondary-container text-on-secondary-container px-6 py-4 rounded-xl font-semibold active:scale-95 transition-all shadow-sm hover:opacity-90"
          >
            <Upload className="w-5 h-5" />
            Batch Upload
          </button>
          <button 
            onClick={() => { setIsBatchMode(false); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 bg-primary text-on-primary px-6 py-4 rounded-xl font-semibold active:scale-95 transition-all shadow-md hover:opacity-90"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10 text-on-surface">
        {[
          { label: 'Total Pieces', val: products.length.toString(), color: 'text-primary' },
          { label: 'In Stock', val: products.filter(p => p.status === 'in_stock').length.toString(), color: 'text-secondary' },
          { label: 'Sold Total', val: products.filter(p => p.status === 'sold').length.toString(), color: 'text-tertiary' },
          { label: 'System Health', val: 'Online', color: 'text-on-surface', isIcon: true },
        ].map((stat, i) => (
          <div key={i} className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/20 shadow-sm">
            <p className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-widest">{stat.label}</p>
            <div className="flex items-center gap-2">
              <h3 className={cn("text-2xl font-medium", stat.color)}>{stat.val}</h3>
              {stat.isIcon && <HardDrive className="w-4 h-4 text-secondary fill-secondary/20" />}
            </div>
          </div>
        ))}
      </section>

      {/* Main content table area - unchanged structure but dynamic data */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden border border-outline-variant/10">
        <div className="p-5 border-b border-outline-variant/20 flex flex-col sm:flex-row gap-4 justify-between items-center bg-surface-container-low">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              placeholder="Filter by name or era..."
            />
          </div>
          <div className="flex gap-2">
             <span className="text-xs font-bold text-on-surface-variant flex items-center gap-2 px-3 bg-surface-container-high rounded-full">
               <Loader2 className="w-3 h-3 animate-spin"/> Live Sync: Active
             </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest/50">
                <th className="px-6 py-4 text-left text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Product Details</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Price</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {loading ? (
                <tr><td colSpan={4} className="py-16 text-center text-on-surface-variant italic">Syncing with server...</td></tr>
              ) : products.length === 0 ? (
                <tr>
                   <td colSpan={4} className="py-20 text-center">
                     <div className="flex flex-col items-center gap-2 opacity-40">
                        <ShoppingBag className="w-12 h-12 mb-2"/>
                        <p className="text-lg font-garamond italic">Your archives are empty</p>
                        <p className="text-xs font-bold uppercase tracking-widest">Use batch import to fill your catalog</p>
                     </div>
                   </td>
                </tr>
              ) : products.map((item) => (
                <tr key={item.id} className="hover:bg-primary/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-surface-variant overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-base font-medium text-on-surface">{item.name}</p>
                          {item.featured && <Sparkles className="w-3.5 h-3.5 text-secondary shadow-sm" />}
                        </div>
                        <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">{item.category} • {item.era}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter",
                      item.status === 'in_stock' ? "bg-secondary-container text-on-secondary-container" :
                      item.status === 'sold' ? "bg-surface-variant text-on-surface-variant" :
                      "bg-tertiary-container text-on-tertiary-container"
                    )}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-base font-bold text-primary font-mono">${item.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(item)}
                        className="p-2.5 hover:bg-surface-container-high rounded-xl transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => item.id && handleDelete(item.id)}
                        className="p-2.5 hover:bg-error-container hover:text-on-error-container rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Master Modal for both Manual and Batch */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className={cn(
            "bg-surface-container-high w-full rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-outline-variant/30 flex flex-col",
            isBatchMode ? "max-w-4xl h-[80vh]" : "max-w-xl"
          )}>
            <div className="flex items-center justify-between p-6 bg-surface-container-highest border-b border-outline-variant/30">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {isBatchMode ? <Upload className="w-5 h-5"/> : <Plus className="w-5 h-5"/>}
                 </div>
                 <div>
                    <h3 className="font-garamond text-2xl text-on-surface leading-none mb-1">
                      {isBatchMode ? "Batch Upload" : editingId ? "Edit Product" : "Add Product"}
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                      {isBatchMode ? "Upload multiple files" : "Enter product information"}
                    </p>
                 </div>
              </div>
              <button 
                onClick={closeModal} 
                className="p-3 hover:bg-error-container hover:text-on-error rounded-full transition-all active:scale-90"
              >
                <X className="w-5 h-5"/>
              </button>
            </div>

            {isBatchMode ? (
              <div className="flex-grow flex flex-col p-8 gap-6 overflow-hidden">
                <input 
                  type="file" 
                  multiple 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFilesChosen}
                  accept="image/*,.csv,.json"
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "flex-none border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center gap-4 transition-all duration-300 cursor-pointer",
                    isDragging 
                      ? "border-primary bg-primary/5 scale-[0.99] shadow-inner" 
                      : "border-outline-variant hover:border-primary/50 hover:bg-surface-container-low"
                  )}
                >
                  <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant relative overflow-hidden">
                    <Upload className={cn("w-10 h-10 transition-transform duration-500", isDragging ? "-translate-y-2 scale-110 text-primary" : "")} />
                    {isDragging && <div className="absolute inset-0 bg-primary/10 animate-pulse" />}
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-garamond text-on-surface mb-1">Drop collection here or <span className="text-primary font-bold underline">browse files</span></p>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Connect to your local workstation archives</p>
                  </div>
                </div>

                {/* File Management List (The "PC Explorer" Look) */}
                <div className="flex-grow bg-surface-container-low rounded-2xl border border-outline-variant/30 flex flex-col overflow-hidden shadow-sm">
                  <div className="grid grid-cols-12 gap-4 p-4 bg-surface-container-highest/50 border-b border-outline-variant/30 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    <div className="col-span-5">Name</div>
                    <div className="col-span-2">Size</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-3 text-right">Status</div>
                  </div>
                  <div className="flex-grow overflow-y-auto p-2 space-y-1">
                    {files.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
                        <FileText className="w-12 h-12 mb-3" />
                        <p className="font-garamond italic text-lg">Queue is empty</p>
                      </div>
                    ) : (
                      files.map(file => (
                        <div key={file.id} className="grid grid-cols-12 gap-4 p-3 rounded-xl hover:bg-surface-container-high transition-colors items-center group">
                          <div className="col-span-5 flex items-center gap-3">
                            {file.type.startsWith('image') ? <ImageIcon className="w-5 h-5 text-secondary"/> : <FileText className="w-5 h-5 text-primary"/>}
                            <span className="text-sm font-medium truncate text-on-surface">{file.name}</span>
                          </div>
                          <div className="col-span-2 text-xs font-mono text-on-surface-variant">{file.size}</div>
                          <div className="col-span-2 text-xs font-bold text-on-surface-variant uppercase truncate">{file.type.split('/')[1] || 'binary'}</div>
                          <div className="col-span-3 flex justify-end">
                            {file.status === 'uploading' ? (
                              <div className="w-full flex items-center gap-3">
                                <div className="flex-grow h-1.5 bg-surface-variant rounded-full overflow-hidden">
                                  <div className="h-full bg-primary transition-all duration-300" style={{ width: `${file.progress}%` }} />
                                </div>
                                <Loader2 className="w-3 h-3 animate-spin text-primary" />
                              </div>
                            ) : file.status === 'completed' ? (
                              <CheckCircle2 className="w-5 h-5 text-secondary animate-in zoom-in duration-300" />
                            ) : file.status === 'error' ? (
                              <div className="flex items-center gap-1 text-error text-[10px] font-bold uppercase">
                                <AlertCircle className="w-4 h-4" /> Fail
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest">Waiting...</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-4 bg-surface-container-highest border-t border-outline-variant/30 flex justify-between items-center">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                      {files.filter(f => f.status === 'completed').length} of {files.length} garments indexed
                    </p>
                    {files.length > 0 && files.every(f => f.status === 'completed' || f.status === 'error') && (
                      <button 
                        onClick={closeModal}
                        className="bg-primary text-on-primary px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-md"
                      >
                         Sync Catalog
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Product Name</label>
                    <input 
                      required 
                      className="w-full bg-surface-container-low p-4 rounded-xl border-none ring-2 ring-outline-variant/30 focus:ring-primary/50 transition-all font-medium text-lg" 
                      placeholder="e.g. Vintage Leather Jacket"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Category</label>
                    <select 
                      className="w-full bg-surface-container-low p-4 rounded-xl border-none ring-2 ring-outline-variant/30 focus:ring-primary/50 font-medium"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value as any})}
                    >
                      <option value="tops">Tops</option>
                      <option value="bottoms">Bottoms</option>
                      <option value="outerwear">Outerwear</option>
                      <option value="accessories">Accessories</option>
                      <option value="knitwear">Knitwear</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Era</label>
                    <input 
                      required 
                      className="w-full bg-surface-container-low p-4 rounded-xl border-none ring-2 ring-outline-variant/30 focus:ring-primary/50 font-medium" 
                      placeholder="e.g. 1970s"
                      value={formData.era}
                      onChange={e => setFormData({...formData, era: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Price ($)</label>
                    <input 
                      required 
                      type="number"
                      step="0.01"
                      className="w-full bg-surface-container-low p-4 rounded-xl border-none ring-2 ring-outline-variant/30 focus:ring-primary/50 font-mono text-xl" 
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Stock Status</label>
                    <select 
                      className="w-full bg-surface-container-low p-4 rounded-xl border-none ring-2 ring-outline-variant/30 focus:ring-primary/50 font-medium"
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value as any})}
                    >
                      <option value="in_stock">In Stock</option>
                      <option value="sold">Sold</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Image URL</label>
                    <input 
                      required 
                      className="w-full bg-surface-container-low p-4 rounded-xl border-none ring-2 ring-outline-variant/30 focus:ring-primary/50 font-medium" 
                      placeholder="https://images.unsplash.com/..."
                      value={formData.image}
                      onChange={e => setFormData({...formData, image: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="flex items-center gap-3 cursor-pointer p-4 bg-surface-container rounded-xl border border-outline-variant/30 hover:border-primary/50 transition-colors">
                       <input 
                         type="checkbox"
                         className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary shadow-sm"
                         checked={formData.featured}
                         onChange={e => setFormData({...formData, featured: e.target.checked})}
                       />
                       <div>
                         <p className="text-sm font-bold text-on-surface uppercase tracking-widest">Feature on Home Page</p>
                         <p className="text-[10px] text-on-surface-variant uppercase font-medium">Highlight this piece at the top of the store</p>
                       </div>
                    </label>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Description</label>
                    <textarea 
                      className="w-full bg-surface-container-low p-4 rounded-xl border-none ring-2 ring-outline-variant/30 focus:ring-primary/50 min-h-[120px] font-medium" 
                      placeholder="Tell the story of this piece..."
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-primary text-on-primary py-5 rounded-2xl font-black uppercase tracking-widest hover:opacity-90 hover:shadow-lg active:scale-[0.98] transition-all"
                >
                  {editingId ? "Save Changes" : "Add Product"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


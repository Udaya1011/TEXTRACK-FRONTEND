import { useState, useEffect, useCallback } from 'react';
import { getProducts, addProduction, getProductions, deleteProduction, updateProduction, getBaseURL } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Loader2, Factory, X, Trash2, Calendar, ChevronLeft, ChevronRight, Package, ArrowLeft, Edit2 } from 'lucide-react';

const AddQuantityModal = ({ product, onClose, onAdded, editEntry = null }) => {
  const [designName, setDesignName] = useState(editEntry?.designName || '');
  const [colorName, setColorName] = useState(editEntry?.colorName || '');
  const [amount, setAmount] = useState(editEntry?.price || '');
  
  const [sizes, setSizes] = useState(() => {
    if (editEntry?.sizes) return editEntry.sizes;
    const initialSizes = {};
    const cat = product?.category || '';
    const activeSizes = cat && cat.toUpperCase() === 'MENS' 
      ? ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'] 
      : ['S', 'M', 'L', 'XL'];
    activeSizes.forEach(s => {
      initialSizes[s] = 0;
    });
    return initialSizes;
  });

  const [date, setDate] = useState(editEntry?.date ? new Date(editEntry.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(editEntry?.notes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSizeChange = (size, val) => {
    setSizes(prev => ({ ...prev, [size]: Number(val) || 0 }));
  };

  const quantity = Object.values(sizes).reduce((a, b) => a + b, 0);
  const totalValue = quantity * (Number(amount) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!product) return;
    if (quantity <= 0) {
      setError('Please enter quantity for at least one size.');
      return;
    }
    setError(''); setLoading(true);
    try {
      const payload = { 
        productId: product._id, 
        designName, 
        colorName, 
        price: amount,
        totalValue,
        sizes,
        quantity, 
        date, 
        notes 
      };

      console.log('SUBMITTING PRODUCTION:', payload);
      if (editEntry) {
        console.log('UPDATING ID:', editEntry._id);
        const { data } = await updateProduction(editEntry._id, payload);
        onAdded(data);
      } else {
        const { data } = await addProduction(payload);
        onAdded(data);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save production record');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-dark-800 rounded-2xl border border-dark-400 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-dark-500">
          <h2 className="font-bold text-white text-lg">{editEntry ? 'Edit Production' : 'New Production Record'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-dark-600 text-gray-400"><X size={18} /></button>
        </div>
        
        {/* Selected Product Banner */}
        <div className="bg-dark-900 border-b border-dark-600 p-4 flex items-center gap-4">
          {product.image ? (
            <img src={`${getBaseURL()}${product.image}`} alt={product.category} className="w-16 h-16 rounded-xl object-cover border border-dark-500" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-dark-700 flex items-center justify-center"><Package size={24} className="text-gray-500"/></div>
          )}
          <div>
            <h3 className="font-bold text-white uppercase tracking-wider text-base">{product.category}</h3>
            <p className="text-xs text-gray-400 mt-1">Base Price: <span className="text-white font-medium">₹{product.pricePerPiece}</span></p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Design Name</label>
              <input type="text" placeholder="e.g. Printed XL" value={designName} onChange={e => setDesignName(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Color Name</label>
              <input type="text" placeholder="e.g. Royal Blue" value={colorName} onChange={e => setColorName(e.target.value)} className="input-field" />
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'].map(size => (
              <div key={size}>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium text-center uppercase">{size}</label>
                <input type="number" min="0" value={sizes[size] ?? 0} onChange={e => handleSizeChange(size, e.target.value)} className="input-field text-center font-bold px-1" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 py-2 bg-dark-900/50 rounded-xl p-3 border border-dark-600">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Quantity (Total)</label>
              <div className="text-2xl font-black text-silver">{quantity} <span className="text-xs text-gray-500 uppercase font-medium">pcs</span></div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Amount (Per Pc)</label>
              <input type="number" required min="0" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} className="input-field text-lg font-bold text-white !py-1" />
            </div>
          </div>

          <div className="bg-silver/5 border border-silver/20 rounded-xl p-4 flex items-center justify-between">
             <div className="text-xs text-gray-400 font-medium uppercase tracking-widest">Total Value</div>
             <div className="text-2xl font-black text-silver">₹ {totalValue.toLocaleString('en-IN')}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Notes (optional)</label>
              <input type="text" placeholder="Remarks..." value={notes} onChange={e => setNotes(e.target.value)} className="input-field" />
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base font-bold">
              {loading ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : <><Plus size={18} /> {editEntry ? 'Update Record' : 'Confirm Production'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


export default function ProductionPage() {
  const { isAdmin } = useAuth();
  const [view, setView] = useState(isAdmin ? 'add' : 'history'); // Default to history for non-admins
  
  // Products State
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editEntry, setEditEntry] = useState(null);

  // History State
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [filterDate, setFilterDate] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const { data } = await getProducts({ search, limit: 50 });
      setProducts(data.products);
    } catch {}
    setLoadingProducts(false);
  }, [search]);

  const fetchEntries = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const params = { page, limit: 15 };
      if (filterDate) params.date = filterDate;
      const { data } = await getProductions(params);
      setEntries(data.entries);
      setTotal(data.total);
      setPages(data.pages);
    } catch {}
    setLoadingHistory(false);
  }, [page, filterDate]);

  useEffect(() => {
    if (view === 'add') {
      const timer = setTimeout(fetchProducts, 300);
      return () => clearTimeout(timer);
    } else {
      fetchEntries();
    }
  }, [view, fetchProducts, fetchEntries]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this entry? Stock will be reduced.')) return;
    await deleteProduction(id);
    fetchEntries();
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Modal Trigger */}
      {selectedProduct && (
        <AddQuantityModal 
          product={selectedProduct} 
          editEntry={editEntry}
          onClose={() => { setSelectedProduct(null); setEditEntry(null); }} 
          onAdded={() => { 
            fetchProducts(); 
            fetchEntries();
            setSelectedProduct(null); 
            setEditEntry(null);
          }} 
        />
      )}

      {/* Header Tabs - Sticky */}
      <div className="sticky top-0 z-30 pt-1 pb-3 bg-dark-900/90 backdrop-blur-md -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex bg-dark-800 p-1 rounded-xl w-fit border border-dark-500 shadow-xl shadow-black/20">
          {isAdmin && (
            <button onClick={() => setView('add')} 
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${view === 'add' ? 'bg-silver text-dark-900 shadow-md' : 'text-gray-400 hover:text-white'}`}>
              Add Stock
            </button>
          )}
          <button onClick={() => setView('history')} 
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${view === 'history' ? 'bg-silver text-dark-900 shadow-md' : 'text-gray-400 hover:text-white'}`}>
            History Logs
          </button>
        </div>
      </div>

      {view === 'add' ? (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-header">Select Category to Add Stock</h1>
              <p className="text-xs text-gray-500">Click a category to update its production numbers.</p>
            </div>
          </div>

          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="text" placeholder="Search categories..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" />
          </div>

          {loadingProducts ? (
            <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin text-silver" /></div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-gray-600">
              <Package size={40} className="mx-auto mb-3 opacity-30" />
              <p>No products found to add stock</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {products.map(p => (
                <button key={p._id} onClick={() => { setEditEntry(null); setSelectedProduct(p); }} 
                  className="card-glow p-3 flex flex-col gap-2 rounded-2xl hover:scale-105 active:scale-95 transition-all outline-none border border-dark-500 text-left cursor-pointer group hover:border-silver/50">
                  <div className="aspect-square rounded-xl overflow-hidden bg-dark-600 w-full relative">
                    {p.image ? (
                      <img src={`${getBaseURL()}${p.image}`} alt={p.category} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Package size={24} className="text-gray-500" /></div>
                    )}
                    <div className="absolute inset-0 bg-silver/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Plus size={28} className="text-white drop-shadow-md" />
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center mt-1">
                    <span className="text-xs font-bold text-white uppercase tracking-widest text-center truncate w-full">{p.category}</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">Stock: <span className="text-silver font-bold">{p.stock}</span></span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="page-header">Production History</h1>
              <p className="text-xs text-gray-500">{total} total entries logged</p>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-500" />
              <input type="date" value={filterDate} onChange={e => { setFilterDate(e.target.value); setPage(1); }} className="input-field text-sm py-2 w-auto" />
              {filterDate && <button onClick={() => { setFilterDate(''); setPage(1); }} className="btn-secondary py-2 px-3 text-sm flex items-center gap-1"><X size={14} /> Clear</button>}
            </div>
          </div>

          {loadingHistory ? (
            <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-silver" /></div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16 text-gray-600">
              <Factory size={40} className="mx-auto mb-3 opacity-30" />
              <p>No production entries found</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {entries.map(e => (
                <div key={e._id} className="card-glow overflow-hidden flex flex-col sm:flex-row border border-dark-500">
                  <div className="flex p-4 gap-4 flex-1">
                    {e.product?.image ? (
                      <img src={`${getBaseURL()}${e.product.image}`} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-dark-400" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-dark-600 flex items-center justify-center flex-shrink-0">
                        <Factory size={24} className="text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] bg-dark-600 px-2 py-0.5 rounded-full text-gray-400 font-bold uppercase tracking-tighter">
                          {new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                        <h4 className="font-black text-white uppercase tracking-widest text-sm truncate">{e.product?.category || 'Unknown'}</h4>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {e.designName && (
                          <div className="text-xs">
                            <span className="text-gray-500 font-medium">Design:</span> <span className="text-gray-300">{e.designName}</span>
                          </div>
                        )}
                        {e.colorName && (
                          <div className="text-xs">
                            <span className="text-gray-500 font-medium">Color:</span> <span className="text-silver">{e.colorName}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 mt-2">
                        {e.sizes && Object.entries(e.sizes).map(([size, qty]) => qty > 0 && (
                          <div key={size} className="bg-dark-900 border border-dark-600 px-2 py-0.5 rounded text-[10px] font-bold">
                            <span className="text-gray-500 mr-1">{size}:</span>
                            <span className="text-white">{qty}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-dark-900/50 p-4 flex flex-row sm:flex-col justify-between items-center sm:items-end gap-2 border-t sm:border-t-0 sm:border-l border-dark-500 min-w-[140px]">
                    <div className="text-right">
                      <div className="text-[10px] text-gray-500 uppercase font-bold">Quantity</div>
                      <div className="text-lg font-black text-white">{e.quantity} <span className="text-[10px] text-gray-500">PCS</span></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right flex-1">
                        <div className="text-[10px] text-gray-500 uppercase font-bold">Total Value</div>
                        <div className="text-lg font-black text-silver">₹{e.totalValue ? e.totalValue.toLocaleString() : (e.quantity * (e.price || 0)).toLocaleString()}</div>
                      </div>
                      {isAdmin && (
                        <div className="flex flex-col gap-2 border-l border-dark-600 pl-3 ml-1">
                          <button onClick={() => { setEditEntry(e); setSelectedProduct(e.product); }} className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-all">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(e._id)} className="p-1.5 rounded-lg text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-all">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary p-2"><ChevronLeft size={16} /></button>
              <span className="text-sm text-gray-400">Page {page} of {pages}</span>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="btn-secondary p-2"><ChevronRight size={16} /></button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

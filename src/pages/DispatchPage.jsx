import { useState, useEffect, useCallback } from 'react';
import { getProducts, addStockOut, getStockOuts, deleteStockOut } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { Search, Loader2, TrendingDown, X, Trash2, Calendar, ChevronLeft, ChevronRight, Package, ArrowLeft, Minus } from 'lucide-react';

const AddDispatchModal = ({ product, onClose, onAdded }) => {
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!product) return;
    setError(''); setLoading(true);
    try {
      const { data } = await addStockOut({ productId: product._id, quantity, date, notes });
      onAdded(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to dispatch');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-dark-800 rounded-2xl border border-dark-400 w-full max-w-sm max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-dark-500">
          <h2 className="font-bold text-white text-lg">Dispatch Stock</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-dark-600 text-gray-400"><X size={18} /></button>
        </div>
        
        {/* Selected Product Banner */}
        <div className="bg-dark-900 border-b border-dark-600 p-4 flex items-center gap-3">
          {product.image ? (
            <img src={`http://localhost:5050${product.image}`} alt={product.category} className="w-12 h-12 rounded-lg object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-dark-700 flex items-center justify-center"><Package size={20} className="text-gray-500"/></div>
          )}
          <div>
            <h3 className="font-bold text-white uppercase tracking-wider text-sm">{product.category}</h3>
            <p className="text-xs text-gray-400">Current Stock: <span className="text-silver font-bold">{product.stock} pcs</span></p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">{error}</div>}

          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Quantity to Dispatch *</label>
            <input type="number" required min="1" max={product.stock} placeholder={`Max: ${product.stock}`} value={quantity} onChange={e => setQuantity(e.target.value)} className="input-field text-lg font-bold text-red-400" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Notes (Customer details, remarks) *</label>
            <input type="text" placeholder="Dispatched to..." required value={notes} onChange={e => setNotes(e.target.value)} className="input-field" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-danger w-full flex items-center justify-center gap-2 py-3 bg-red-500/20 text-red-500 border border-red-500/40 hover:bg-red-500/30">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : <><Minus size={16} /> Confirm Dispatch</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


export default function DispatchPage() {
  const { isAdmin } = useAuth();
  const [view, setView] = useState('add'); // 'add' or 'history'
  
  // Products State
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

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
      const { data } = await getStockOuts(params);
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
    if (!window.confirm('Delete this dispatch? Stock will be restored.')) return;
    await deleteStockOut(id);
    fetchEntries();
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Modal Trigger */}
      {selectedProduct && (
        <AddDispatchModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onAdded={() => { 
            fetchProducts(); 
            setSelectedProduct(null); 
            setView('history'); 
          }} 
        />
      )}

      {/* Header Tabs */}
      <div className="flex bg-dark-800 p-1 rounded-xl w-fit border border-dark-500">
        <button onClick={() => setView('add')} 
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${view === 'add' ? 'bg-silver text-dark-900 shadow-md' : 'text-gray-400 hover:text-white'}`}>
          Dispatch List
        </button>
        <button onClick={() => setView('history')} 
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${view === 'history' ? 'bg-silver text-dark-900 shadow-md' : 'text-gray-400 hover:text-white'}`}>
          Outward History
        </button>
      </div>

      {view === 'add' ? (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-header">Select Category to Dispatch</h1>
              <p className="text-xs text-gray-500">Click a category to dispatch items out of stock.</p>
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
              <p>No categorites found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {products.map(p => (
                <button key={p._id} onClick={() => setSelectedProduct(p)} 
                  className="card-glow p-3 flex flex-col gap-2 rounded-2xl hover:scale-105 active:scale-95 transition-all outline-none border border-dark-500 text-left cursor-pointer group hover:border-red-500/50">
                  <div className="aspect-square rounded-xl overflow-hidden bg-dark-600 w-full relative">
                    {p.image ? (
                      <img src={`http://localhost:5050${p.image}`} alt={p.category} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Package size={24} className="text-gray-500" /></div>
                    )}
                    <div className="absolute inset-0 bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Minus size={28} className="text-white drop-shadow-md" />
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
              <h1 className="page-header">Dispatch History</h1>
              <p className="text-xs text-gray-500">{total} total shipments completed</p>
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
              <TrendingDown size={40} className="mx-auto mb-3 opacity-30" />
              <p>No dispatches recorded</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map(e => (
                <div key={e._id} className="card-glow p-4 flex items-center gap-4">
                  {e.product?.image ? (
                    <img src={`http://localhost:5050${e.product.image}`} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-dark-600 flex items-center justify-center flex-shrink-0">
                      <TrendingDown size={18} className="text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white uppercase tracking-widest text-sm truncate">{e.product?.category || 'Unknown Category'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {e.dispatchedBy && ` · by ${e.dispatchedBy.name}`}
                    </p>
                    {e.notes && <p className="text-xs text-gray-600 mt-0.5 truncate">{e.notes}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="badge-red">-{e.quantity} pcs</span>
                    {isAdmin && (
                      <button onClick={() => handleDelete(e._id)} className="p-1 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors mt-1">
                        <Trash2 size={13} />
                      </button>
                    )}
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

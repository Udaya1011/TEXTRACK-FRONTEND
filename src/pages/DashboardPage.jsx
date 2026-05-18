import { useState, useEffect } from 'react';
import { getProductionStats, getStockOutStats, getProducts, getCategories, getBaseURL } from '../api/api';
import { Package, IndianRupee, AlertTriangle, RefreshCw, Shirt, FolderOpen, X, Search, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ icon: Icon, label, value, sub, glow, onClick }) => (
  <div onClick={onClick} className="stat-card animate-slide-up cursor-pointer hover:border-silver/45 transition-all active:scale-[0.98] relative overflow-hidden group" style={{ '--glow-color': glow }}>
    <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 blur-xl group-hover:opacity-10 transition-opacity"
      style={{ background: glow }} />
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500 font-medium group-hover:text-gray-400 transition-colors">{label}</span>
      <div className="p-2 rounded-lg transition-transform group-hover:scale-110" style={{ background: `${glow}22` }}>
        <Icon size={16} style={{ color: glow }} />
      </div>
    </div>
    <p className="text-2xl font-extrabold text-white mt-1">{value}</p>
    {sub && <p className="text-[10px] text-gray-500 truncate mt-0.5 group-hover:text-gray-400 transition-colors">{sub}</p>}
  </div>
);

const DashboardModal = ({ type, products, categories, onClose }) => {
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState(new Set());

  if (!type) return null;

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  let title = '';
  let sub = '';
  let headers = [];
  let rows = [];

  if (type === 'stock') {
    title = 'Total Stock Breakdown';
    sub = 'Detailed view of available pieces per color variant & size.';
    headers = ['Product Name', 'Category', 'Color', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', 'Total Stock'];
    
    const tempRows = [];
    products.forEach(p => {
      if (p.variants && p.variants.length > 0) {
        p.variants.forEach(v => {
          tempRows.push({
            id: `${p._id}-${v.color}`,
            name: p.name,
            category: p.category,
            color: v.color,
            sizes: v.sizes || { S: 0, M: 0, L: 0, XL: 0, '2XL': 0, '3XL': 0, '4XL': 0 },
            stock: v.stock || 0
          });
        });
      } else {
        tempRows.push({
          id: p._id,
          name: p.name,
          category: p.category,
          color: '-',
          sizes: p.sizes || { S: 0, M: 0, L: 0, XL: 0, '2XL': 0, '3XL': 0, '4XL': 0 },
          stock: p.stock || 0
        });
      }
    });

    rows = tempRows.filter(r => 
      r.name.toLowerCase().includes(search.toLowerCase()) || 
      r.category.toLowerCase().includes(search.toLowerCase()) ||
      r.color.toLowerCase().includes(search.toLowerCase())
    );
  } else if (type === 'designs') {
    title = 'Active Designs Inventory';
    sub = 'Complete directory of registered product designs and specifications.';
    headers = ['Image', 'Design Name', 'Style Name', 'Category', 'Price Per Piece'];
    
    rows = products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.category.toLowerCase().includes(search.toLowerCase()) || 
      (p.styleName && p.styleName.toLowerCase().includes(search.toLowerCase()))
    ).map(p => ({
      id: p._id,
      image: p.image,
      name: p.name,
      styleName: p.styleName || '-',
      category: p.category,
      price: `₹${p.pricePerPiece?.toLocaleString('en-IN') || 0}`
    }));
  } else if (type === 'categories') {
    title = 'Product Categories Overview';
    sub = 'All registered categories and associated product design counts.';
    headers = ['Category Name', 'Total Designs Count'];

    rows = categories.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase())
    ).map(c => {
      const count = products.filter(p => p.category === c.name).length;
      return {
        id: c._id,
        name: c.name,
        count: `${count} designs`
      };
    });
  } else if (type === 'valuation') {
    title = 'Stock Valuation Breakdown';
    sub = 'Calculated net asset worth based on unit pricing and stock levels.';
    headers = ['Design Name', 'Category', 'Price/Pc', 'Total Stock', 'Net Worth (₹)'];

    rows = products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.category.toLowerCase().includes(search.toLowerCase())
    ).map(p => {
      const stock = p.stock || 0;
      const price = p.pricePerPiece || 0;
      const totalVal = stock * price;
      return {
        id: p._id,
        name: p.name,
        category: p.category,
        price: `₹${price.toLocaleString('en-IN')}`,
        stock: `${stock.toLocaleString()} pcs`,
        value: `₹${totalVal.toLocaleString('en-IN')}`
      };
    });
  }

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md animate-fade-in">
      <div 
        onClick={e => e.stopPropagation()} 
        className="w-full max-w-4xl max-h-[85vh] bg-dark-900 border border-dark-600 rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-slide-up"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-dark-600 flex items-center justify-between bg-dark-850">
          <div>
            <h3 className="text-lg font-black text-white">{title}</h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{sub}</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl bg-dark-600 text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Search Bar */}
        <div className="p-4 bg-dark-900 border-b border-dark-600/50 flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search details..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-10 text-sm py-2" 
            />
          </div>
          {search && (
            <button 
              onClick={() => setSearch('')} 
              className="btn-secondary px-3 py-2 text-sm"
            >
              Clear
            </button>
          )}
        </div>

        {/* Modal Content Table */}
        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
          {rows.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-sm font-semibold">No matching records found</p>
            </div>
          ) : (
            <>
              {/* Desktop View Table */}
              <div className="hidden md:block border border-dark-600 rounded-xl overflow-hidden bg-dark-950/20">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-dark-800/80 border-b border-dark-600 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      {headers.map(h => (
                        <th key={h} className="py-3 px-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-600/50 text-sm text-gray-300 font-medium">
                    {type === 'stock' && rows.map((r) => (
                      <tr key={r.id} className="hover:bg-dark-600/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-white">{r.name}</td>
                        <td className="py-3 px-4 text-xs text-gray-500 uppercase">{r.category}</td>
                        <td className="py-3 px-4">
                          {r.color !== '-' ? (
                            <span className="text-[10px] bg-silver/10 border border-silver/20 text-silver px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                              {r.color}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="py-3 px-4">{r.sizes.S || 0}</td>
                        <td className="py-3 px-4">{r.sizes.M || 0}</td>
                        <td className="py-3 px-4">{r.sizes.L || 0}</td>
                        <td className="py-3 px-4">{r.sizes.XL || 0}</td>
                        <td className="py-3 px-4">{r.sizes['2XL'] || 0}</td>
                        <td className="py-3 px-4">{r.sizes['3XL'] || 0}</td>
                        <td className="py-3 px-4">{r.sizes['4XL'] || 0}</td>
                        <td className="py-3 px-4 font-black text-silver">{r.stock} pcs</td>
                      </tr>
                    ))}

                    {type === 'designs' && rows.map((r) => (
                      <tr key={r.id} className="hover:bg-dark-600/30 transition-colors">
                        <td className="py-3 px-4">
                          {r.image ? (
                            <img src={`${getBaseURL()}${r.image}`} alt="" className="w-9 h-9 rounded-lg object-cover border border-dark-600" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-dark-700 flex items-center justify-center text-[10px] text-gray-600 font-bold border border-dark-600">NO IMG</div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold text-white">{r.name}</td>
                        <td className="py-3 px-4 text-xs text-gray-500">{r.styleName}</td>
                        <td className="py-3 px-4 text-xs text-gray-500 uppercase">{r.category}</td>
                        <td className="py-3 px-4 font-black text-silver">{r.price}</td>
                      </tr>
                    ))}

                    {type === 'categories' && rows.map((r) => (
                      <tr key={r.id} className="hover:bg-dark-600/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-white">{r.name}</td>
                        <td className="py-3 px-4 font-black text-silver">{r.count}</td>
                      </tr>
                    ))}

                    {type === 'valuation' && rows.map((r) => (
                      <tr key={r.id} className="hover:bg-dark-600/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-white">{r.name}</td>
                        <td className="py-3 px-4 text-xs text-gray-500 uppercase">{r.category}</td>
                        <td className="py-3 px-4 text-gray-400">{r.price}</td>
                        <td className="py-3 px-4 text-gray-400">{r.stock}</td>
                        <td className="py-3 px-4 font-black text-silver">{r.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View Accordion List */}
              <div className="md:hidden space-y-3">
                {rows.map((r) => {
                  const isExpanded = expandedIds.has(r.id);
                  return (
                    <div key={r.id} className="border border-dark-600 rounded-xl bg-dark-900/30 overflow-hidden transition-colors">
                      {/* Accordion Trigger Row */}
                      <div 
                        onClick={() => toggleExpand(r.id)}
                        className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-dark-600/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {type === 'designs' && (
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-dark-800 shrink-0 border border-dark-600">
                              {r.image ? (
                                <img src={`${getBaseURL()}${r.image}`} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[9px] text-gray-600 font-bold">NO IMG</div>
                              )}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-white text-sm truncate">{r.name}</p>
                            {type === 'designs' && <p className="text-[10px] text-gray-500 truncate mt-0.5">{r.styleName}</p>}
                            {type === 'stock' && (
                              <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                                <span className="uppercase">{r.category}</span>
                                <span>·</span>
                                <span>{r.color}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Top-Right Badge based on Modal Type */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-black text-silver">
                            {type === 'stock' && `${r.stock} pcs`}
                            {type === 'designs' && r.price}
                            {type === 'categories' && r.count}
                            {type === 'valuation' && r.value}
                          </span>
                          <span className={`text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                            <ChevronRight size={14} />
                          </span>
                        </div>
                      </div>

                      {/* Accordion Expandable Content Panel */}
                      {isExpanded && (
                        <div className="p-4 bg-dark-900 border-t border-dark-600/50 space-y-3 text-xs animate-slide-down">
                          
                          {/* Stock Breakdown */}
                          {type === 'stock' && (
                            <>
                              <div className="flex justify-between py-1 border-b border-dark-600/30">
                                <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px]">Category</span>
                                <span className="font-semibold text-white uppercase">{r.category}</span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-dark-600/30">
                                <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px]">Color Variant</span>
                                <span className="text-[10px] bg-silver/10 border border-silver/20 text-silver px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                  {r.color}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px] block mb-2">Size Breakdown</span>
                                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 text-center">
                                  <div className="bg-dark-850 p-2 rounded-lg border border-dark-600">
                                    <span className="text-[9px] text-gray-500 font-bold block">S</span>
                                    <span className="font-extrabold text-white mt-0.5 block">{r.sizes.S || 0}</span>
                                  </div>
                                  <div className="bg-dark-850 p-2 rounded-lg border border-dark-600">
                                    <span className="text-[9px] text-gray-500 font-bold block">M</span>
                                    <span className="font-extrabold text-white mt-0.5 block">{r.sizes.M || 0}</span>
                                  </div>
                                  <div className="bg-dark-850 p-2 rounded-lg border border-dark-600">
                                    <span className="text-[9px] text-gray-500 font-bold block">L</span>
                                    <span className="font-extrabold text-white mt-0.5 block">{r.sizes.L || 0}</span>
                                  </div>
                                  <div className="bg-dark-850 p-2 rounded-lg border border-dark-600">
                                    <span className="text-[9px] text-gray-500 font-bold block">XL</span>
                                    <span className="font-extrabold text-white mt-0.5 block">{r.sizes.XL || 0}</span>
                                  </div>
                                  <div className="bg-dark-850 p-2 rounded-lg border border-dark-600">
                                    <span className="text-[9px] text-gray-500 font-bold block">2XL</span>
                                    <span className="font-extrabold text-white mt-0.5 block">{r.sizes['2XL'] || 0}</span>
                                  </div>
                                  <div className="bg-dark-850 p-2 rounded-lg border border-dark-600">
                                    <span className="text-[9px] text-gray-500 font-bold block">3XL</span>
                                    <span className="font-extrabold text-white mt-0.5 block">{r.sizes['3XL'] || 0}</span>
                                  </div>
                                  <div className="bg-dark-850 p-2 rounded-lg border border-dark-600">
                                    <span className="text-[9px] text-gray-500 font-bold block">4XL</span>
                                    <span className="font-extrabold text-white mt-0.5 block">{r.sizes['4XL'] || 0}</span>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}

                          {/* Designs Details */}
                          {type === 'designs' && (
                            <>
                              <div className="flex justify-between py-1 border-b border-dark-600/30">
                                <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px]">Style Name</span>
                                <span className="font-semibold text-white">{r.styleName}</span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-dark-600/30">
                                <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px]">Category</span>
                                <span className="font-semibold text-white uppercase">{r.category}</span>
                              </div>
                              <div className="flex justify-between py-1">
                                <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px]">Price Per Piece</span>
                                <span className="font-bold text-silver">{r.price}</span>
                              </div>
                            </>
                          )}

                          {/* Categories Details */}
                          {type === 'categories' && (
                            <div className="flex justify-between py-1">
                              <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px]">Total Designs</span>
                              <span className="font-bold text-silver">{r.count}</span>
                            </div>
                          )}

                          {/* Valuation Details */}
                          {type === 'valuation' && (
                            <>
                              <div className="flex justify-between py-1 border-b border-dark-600/30">
                                <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px]">Category</span>
                                <span className="font-semibold text-white uppercase">{r.category}</span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-dark-600/30">
                                <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px]">Price per Piece</span>
                                <span className="font-semibold text-white">{r.price}</span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-dark-600/30">
                                <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px]">Total Available Stock</span>
                                <span className="font-semibold text-white">{r.stock}</span>
                              </div>
                              <div className="flex justify-between py-1">
                                <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px]">Net Asset Valuation</span>
                                <span className="font-bold text-silver">{r.value}</span>
                              </div>
                            </>
                          )}

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-dark-600/50 bg-dark-850/50 flex justify-end text-xs text-gray-600 font-bold">
          Showing {rows.length} records
        </div>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const { isAdmin } = useAuth();
  const [prodStats, setProdStats] = useState({});
  const [outStats, setOutStats] = useState({});
  const [totalStock, setTotalStock] = useState(0);
  const [totalStockValue, setTotalStockValue] = useState(0);
  const [totalDesigns, setTotalDesigns] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  // Raw states for popups
  const [rawProducts, setRawProducts] = useState([]);
  const [rawCategories, setRawCategories] = useState([]);
  const [activeModal, setActiveModal] = useState(null); // 'stock' | 'designs' | 'categories' | 'valuation' | null

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pStats, oStats, prods, cats] = await Promise.all([
        getProductionStats({}),
        getStockOutStats({}),
        getProducts({ limit: 1000 }),
        getCategories(),
      ]);
      setProdStats(pStats.data);
      setOutStats(oStats.data);
      
      const ps = prods.data.products || [];
      setRawProducts(ps);
      setRawCategories(cats.data || []);

      setTotalStock(ps.reduce((s, p) => s + (p.stock || 0), 0));
      setTotalStockValue(ps.reduce((s, p) => s + ((p.stock || 0) * (p.pricePerPiece || 0)), 0));
      setTotalDesigns(prods.data.total || ps.length);
      setTotalCategories(cats.data?.length || 0);
      setLowStock(ps.filter(p => (p.stock || 0) <= (p.lowStockThreshold || 50)));
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-end">
        <button onClick={fetchAll} className="p-2 rounded-xl bg-dark-600 text-gray-400 hover:text-silver transition-colors">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stat cards */}
      <div className={`grid gap-4 ${isAdmin ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 lg:grid-cols-4'}`}>
        <StatCard onClick={() => setActiveModal('stock')} icon={Package} label="Total Stock" value={loading ? '...' : totalStock.toLocaleString()} sub="pieces available" glow="#cbd5e1" />
        <StatCard onClick={() => setActiveModal('designs')} icon={Shirt} label="Total Designs" value={loading ? '...' : totalDesigns.toLocaleString()} sub="unique products" glow="#cbd5e1" />
        <StatCard onClick={() => setActiveModal('categories')} icon={FolderOpen} label="Total Categories" value={loading ? '...' : totalCategories.toLocaleString()} sub="categories" glow="#cbd5e1" />
        <StatCard onClick={() => setActiveModal('valuation')} icon={IndianRupee} label="Stock Valuation" value={loading ? '...' : `₹${totalStockValue.toLocaleString('en-IN')}`} sub="inventory value" glow="#cbd5e1" />
      </div>

      {/* Low stock alerts */}
      {lowStock.length > 0 && (
        <div className="card p-4 border-red-500/30 bg-red-500/5 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-red-400" />
            <span className="text-sm font-bold text-red-400">Low Stock Alerts ({lowStock.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.slice(0, 8).map(p => (
              <span key={p._id} className="badge-red">{p.name} · {p.stock} pcs</span>
            ))}
            {lowStock.length > 8 && <span className="badge-red">+{lowStock.length - 8} more</span>}
          </div>
        </div>
      )}

      {/* Detail Popups */}
      {activeModal && (
        <DashboardModal 
          type={activeModal} 
          products={rawProducts} 
          categories={rawCategories} 
          onClose={() => setActiveModal(null)} 
        />
      )}
    </div>
  );
}

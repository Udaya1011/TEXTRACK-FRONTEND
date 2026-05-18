import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategories, createCategory, deleteCategory, getProducts, getBaseURL, getProductImage } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Tag, Loader2, X, Package, Download, CheckSquare } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function CategoryPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [newCat, setNewCat] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await getCategories();
      setCategories(data);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  useEffect(() => {
    if (selectedCategory) {
      setLoadingProducts(true);
      getProducts({ category: selectedCategory.name, limit: 100 })
        .then(res => {
          setCategoryProducts(res.data.products || []);
        })
        .catch(console.error)
        .finally(() => setLoadingProducts(false));
    }
  }, [selectedCategory]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCat.trim()) return;
    setError('');
    try {
      await createCategory({ name: newCat });
      setNewCat('');
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add category');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    await deleteCategory(id);
    fetchCategories();
  };

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  // Reset selection when modal opens/closes
  useEffect(() => {
    if (!selectedCategory) {
      setSelectionMode(false);
      setSelectedProducts([]);
    }
  }, [selectedCategory]);

  const toggleSelect = (id) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const getLogoBase64 = async () => {
    try {
      const response = await fetch('/logo.jpg');
      if (!response.ok) throw new Error("Fetch failed");
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error("Error loading logo as base64:", err);
      throw err;
    }
  };

  const executeDownload = async (includeAmount) => {
    let itemsToDownload = categoryProducts;
    if (selectionMode && selectedProducts.length > 0) {
      itemsToDownload = categoryProducts.filter(p => selectedProducts.includes(p._id));
    }

    if (itemsToDownload.length === 0) return alert('No products to download');

    const doc = new jsPDF();

    // 1. TEXTRACK Brand label on the left margin
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(110, 110, 110);
    doc.text("T E X T R A C K", 14, 12);

    // 2. PRODUCT STATUS Title below it
    doc.setFontSize(15);
    doc.setTextColor(24, 24, 27);
    doc.text("PRODUCT STATUS", 14, 19);

    // 3. DATE and TOTAL DESIGNS on the far right (stacked)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(24, 24, 27);
    doc.text(`DATE: ${new Date().toLocaleDateString('en-IN')}`, 196, 12, { align: "right" });
    doc.text(`TOTAL DESIGNS: ${itemsToDownload.length}`, 196, 19, { align: "right" });

    // 4. Subtitle / Metadata details (clean, left-aligned)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(120, 120, 120);
    doc.text(`Category: ${selectedCategory.name.toUpperCase()}  |  Inventory Report`, 14, 25);

    // 5. Delicate divider accent line
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(14, 32, 196, 32);

    const activeSizes = ["S", "M", "L", "XL", "2XL", "3XL", "4XL"];

    const tableColumn = ["S.No", "Product Name", "Color", ...activeSizes, "Total Qty"];
    if (includeAmount) tableColumn.push("Amount (Rs)");

    const tableRows = [];

    let overallQuantity = 0;
    let overallAmount = 0;
    let serialNo = 1;

    itemsToDownload.forEach(p => {
      if (p.variants && p.variants.length > 0) {
        p.variants.forEach((v, vi) => {
          const vAmount = (v.stock || 0) * (p.pricePerPiece || 0);
          overallQuantity += (v.stock || 0);
          overallAmount += vAmount;

          const sizesData = activeSizes.map(sz => v.sizes?.[sz] || 0);
          const row = [
            vi === 0 ? serialNo : '',
            vi === 0 ? `${p.name} (${p.category})` : '',
            v.color || '-',
            ...sizesData,
            v.stock || 0
          ];
          if (includeAmount) row.push(vAmount.toLocaleString('en-IN'));
          tableRows.push(row);
        });
        serialNo++;
      } else {
        // Fallback for old products without variants array
        const itemAmount = (p.stock || 0) * (p.pricePerPiece || 0);
        overallQuantity += (p.stock || 0);
        overallAmount += itemAmount;

        const sizesData = activeSizes.map(sz => p.sizes?.[sz] || 0);
        const row = [
          serialNo++,
          `${p.name} (${p.category})`,
          p.color || '-',
          ...sizesData,
          p.stock || 0
        ];
        if (includeAmount) row.push(itemAmount.toLocaleString('en-IN'));
        tableRows.push(row);
      }
    });

    // Chunking tableRows into chunks of 20
    const CHUNK_SIZE = 20;

    for (let chunkIndex = 0; chunkIndex < tableRows.length; chunkIndex += CHUNK_SIZE) {
      const isFirstChunk = chunkIndex === 0;
      const isLastChunk = chunkIndex + CHUNK_SIZE >= tableRows.length;

      const chunkData = tableRows.slice(chunkIndex, chunkIndex + CHUNK_SIZE);

      if (isLastChunk) {
        const emptyCells = activeSizes.map(() => '');
        const totalRow = [
          '', 'GRAND TOTAL', ...emptyCells,
          overallQuantity.toString()
        ];
        if (includeAmount) totalRow.push(`Rs. ${overallAmount.toLocaleString('en-IN')}`);
        chunkData.push(totalRow);
      }

      const columnStyles = {
        0: { halign: 'center', fontStyle: 'bold', cellWidth: 12 },
        1: { halign: 'left', fontStyle: 'bold' },
        2: { halign: 'left' }
      };
      for (let i = 0; i < activeSizes.length; i++) {
        columnStyles[3 + i] = { halign: 'center' };
      }
      columnStyles[3 + activeSizes.length] = { halign: 'center', fontStyle: 'bold' };
      if (includeAmount) {
        columnStyles[3 + activeSizes.length + 1] = { halign: 'right', fontStyle: 'bold' };
      }

      autoTable(doc, {
        head: [tableColumn],
        body: chunkData,
        startY: isFirstChunk ? 38 : 20,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 3,
          lineColor: [225, 225, 225],
          lineWidth: 0.1,
          font: "helvetica"
        },
        headStyles: {
          fillColor: [33, 37, 41],
          textColor: [255, 255, 255],
          halign: 'center',
          fontStyle: 'bold',
          fontSize: 8.5
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        },
        columnStyles: columnStyles,
        didParseCell: function (data) {
          if (isLastChunk && data.row.index === chunkData.length - 1) {
            data.cell.styles.fillColor = [235, 236, 240];
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = [24, 24, 27];
          }
        }
      });

      if (!isLastChunk) {
        doc.addPage();
      }
    }

    // Add branded footer to all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Subtle line above footer
      doc.setDrawColor(220);
      doc.setLineWidth(0.2);
      doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

      // Centered footer brand text
      doc.text("TexTrack - Udaya", pageWidth / 2, pageHeight - 7, { align: "center" });

      // Right-aligned page numbers
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 7, { align: "right" });
    }

    doc.save(`${selectedCategory.name}_Inventory.pdf`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ... keeping previous return content exactly the same up to Modal ... */}


      {isAdmin && (
        <form onSubmit={handleAdd} className="card p-5 flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">New Category Name</label>
            <input type="text" placeholder="e.g. T-Shirt, Pant, Polo" value={newCat}
              onChange={e => setNewCat(e.target.value)} className="input-field" required />
          </div>
          <button type="submit" className="btn-primary flex items-center justify-center w-11 h-11 shrink-0 p-0 rounded-xl" title="Add Category">
            <Plus size={20} />
          </button>
        </form>
      )}
      {error && <div className="text-red-400 text-sm">{error}</div>}

      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Existing Categories</h2>
          <span className="text-[10px] bg-dark-600 text-white px-2.5 py-0.5 rounded-full font-black border border-dark-500">
            {categories.length}
          </span>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-silver" /></div>
        ) : categories.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No categories found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {categories.map((c, index) => (
              <div
                key={c._id}
                className="border border-dark-400 hover:border-white rounded-2xl p-6 relative overflow-hidden group animate-fade-in cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex flex-col justify-between"
                onClick={() => setSelectedCategory(c)}
              >
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-dark-800 border border-dark-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                      <Tag size={20} className="text-gray-400 group-hover:text-white transition-colors duration-300" />
                    </div>
                    <div>
                      <span className="text-lg font-black text-white transition-colors duration-300 block">{c.name}</span>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Active Category</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 relative z-10">
                    <span className="text-[10px] font-black text-gray-400 font-mono bg-dark-800 border border-dark-600 px-2 py-0.5 rounded-lg shadow-sm">
                      #{String(index + 1).padStart(2, '0')}
                    </span>
                    {isAdmin && c.totalDesigns === 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(c._id); }}
                        className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-dark-600 rounded-xl"
                        title="Delete Category"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center border-t border-dark-600/40 pt-4 relative z-10">
                  <div>
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Designs</span>
                    <span className="text-base font-black text-white mt-1 block">{c.totalDesigns || 0}</span>
                  </div>
                  <div className="border-x border-dark-600/30">
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Stock</span>
                    <span className="text-base font-black text-white mt-1 block">{(c.totalQuantities || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Valuation</span>
                    <span className="text-base font-black text-white mt-1 block">₹{(c.totalWorth || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Products Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-dark-800 rounded-2xl border border-dark-400 w-full max-w-4xl h-[90vh] sm:h-[80vh] overflow-hidden flex flex-col animate-slide-up shadow-2xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-dark-500 bg-dark-900/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-silver/10 flex items-center justify-center">
                  <Tag size={16} className="text-silver" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-base leading-none">{selectedCategory.name}</h2>
                  <p className="text-[10px] text-gray-400 font-bold tracking-wider uppercase mt-1">{selectedCategory.totalDesigns} Designs</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {categoryProducts.length > 0 && (
                  <>
                    <button onClick={() => setSelectionMode(!selectionMode)} className={`p-2 rounded-xl transition-colors ${selectionMode ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-dark-600 text-gray-300 hover:bg-dark-500 border border-dark-500'}`} title={selectionMode ? 'Cancel Selection' : 'Select Products'}>
                      <CheckSquare size={16} />
                    </button>
                    <button onClick={() => setShowDownloadModal(true)} className="p-2 rounded-xl bg-silver text-dark-900 hover:bg-silver-light transition-colors" title={selectionMode && selectedProducts.length > 0 ? `Download (${selectedProducts.length})` : 'Download All'}>
                      <Download size={16} />
                    </button>
                  </>
                )}
                <button onClick={() => setSelectedCategory(null)} className="p-2 rounded-xl hover:bg-dark-600 text-gray-400 transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body: Products List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {loadingProducts ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-silver" size={24} /></div>
              ) : categoryProducts.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <Package size={32} className="mx-auto mb-2 opacity-30" />
                  <p>No products in this category.</p>
                </div>
              ) : (
                categoryProducts.map(p => {
                  const isSelected = selectedProducts.includes(p._id);
                  return (
                    <div key={p._id}
                      onClick={() => selectionMode ? toggleSelect(p._id) : navigate(`/products?search=${encodeURIComponent(p.name)}`)}
                      className={`flex items-center gap-4 p-3 rounded-xl border transition-all group cursor-pointer ${isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-dark-600 bg-dark-900/30 hover:bg-dark-600 hover:border-silver/30'}`}>

                      {selectionMode && (
                        <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-dark-500 bg-dark-700'}`}>
                          {isSelected && <CheckSquare size={12} />}
                        </div>
                      )}

                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-dark-800 shrink-0 border border-dark-500">
                        {p.image ? (
                          <img src={getProductImage(p.image)} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Package size={16} className="text-gray-600" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate group-hover:text-silver transition-colors">{p.name}</h4>
                        <div className="flex gap-3 mt-1">
                          <span className="text-[10px] text-gray-400 font-medium">Stock: <span className="text-white font-bold">{p.stock}</span></span>
                          <span className="text-[10px] text-gray-400 font-medium">Price: <span className="text-silver font-bold">₹{p.pricePerPiece}</span></span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-dark-500 bg-dark-900/30">
              <button onClick={() => navigate(`/products?category=${encodeURIComponent(selectedCategory.name)}`)} className="btn-primary w-full py-2.5">
                View All in Products Page
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

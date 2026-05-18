import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getBaseURL, getProductImage, getCategories } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, X, Loader2, AlertTriangle, Upload, Edit2, Trash2, Package, IndianRupee, Download, CheckSquare, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

const loadImageAsBase64 = async (url) => {
  if (!url) return null;
  if (url.startsWith('data:')) return url;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Fetch failed");
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("Error loading image as base64:", err);
    return null;
  }
};


const ProductCard = ({ product, onView, selectionMode, isSelected, onToggleSelect }) => {
  const imgUrl = getProductImage(product.image);

  return (
    <div 
      onClick={() => selectionMode ? onToggleSelect(product._id) : onView(product)}
      className={`card-glow flex flex-col overflow-hidden animate-fade-in border cursor-pointer hover:border-silver/40 transition-colors relative
        ${isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-dark-500 bg-dark-900/30'}`}>
      
      {selectionMode && (
        <div className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors
          ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-dark-400 bg-dark-800/80 backdrop-blur-sm'}`}>
          {isSelected && <CheckSquare size={14} />}
        </div>
      )}
      
      <div className="flex flex-row p-3 gap-4 items-center relative">
        <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-dark-600 relative border border-dark-500">
          {imgUrl ? (
            <img src={imgUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
              <Package size={20} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">{product.category}</span>
          <span className="text-base font-black text-white truncate leading-tight">{product.name}</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500 font-medium">Stock:</span>
            <span className="text-sm font-black text-silver">{product.stock} <span className="text-[10px] text-gray-500 uppercase">pcs</span></span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0 border-l border-dark-600 pl-4 items-end">
          <div className="text-xs font-bold text-gray-400">&#8377;{product.pricePerPiece} <span className="text-[10px] font-normal">/pc</span></div>
          <div className="text-sm font-black text-silver-light">&#8377;{(product.stock * product.pricePerPiece).toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-gray-400 font-bold bg-dark-600 px-2 py-0.5 rounded flex items-center mt-1">{product.variants?.length || 0} Colors</div>
        </div>
      </div>
    </div>
  );
};

const ViewProductModal = ({ product, onClose, isAdmin, onDelete, onEdit }) => {
  const imgUrl = getProductImage(product.image);
  const [varSelectMode, setVarSelectMode] = useState(false);
  const [selectedVars, setSelectedVars] = useState([]);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const toggleVar = (i) => {
    setSelectedVars(prev => prev.includes(i) ? prev.filter(v => v !== i) : [...prev, i]);
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

  const loadImageAsBase64 = async (url) => {
    if (!url) return null;
    if (url.startsWith('data:')) return url;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Fetch failed");
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error("Error loading image as base64:", err);
      return null;
    }
  };

  const executeDownload = async (includeAmount) => {
    const variants = product.variants || [];
    const toDownload = (varSelectMode && selectedVars.length > 0)
      ? variants.filter((_, i) => selectedVars.includes(i))
      : variants;

    if (toDownload.length === 0) return alert('No variants to download');

    // Load product image as base64 first
    let imageBase64 = null;
    if (product.image) {
      const imgUrl = getProductImage(product.image);
      imageBase64 = await loadImageAsBase64(imgUrl);
    }

    const doc = new jsPDF();

    // 1. LEFT COLUMN: TEXTRACK Brand label and PRODUCT STATUS
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(110, 110, 110);
    doc.text("T E X T R A C K", 14, 12);

    doc.setFontSize(14);
    doc.setTextColor(24, 24, 27);
    doc.text("PRODUCT STATUS", 14, 19);

    // 2. CENTER COLUMN: Product Image, with Name & Category under it
    if (imageBase64) {
      try {
        doc.addImage(imageBase64, 'JPEG', 95, 4, 18, 18);
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.2);
        doc.roundedRect(95, 4, 18, 18, 1.5, 1.5, 'D');
      } catch (err) {
        console.error("Failed to add image to PDF:", err);
      }
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    const labelText = `${product.name.toUpperCase()} - ${product.category.toUpperCase()}`;
    doc.text(labelText, 104, 26, { align: "center" });

    // 3. RIGHT COLUMN: DATE, STYLE/SKU, and SQUARE QR CODE
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    const styleValue = product.styleName || product.name || product._id;
    doc.text(`STYLE: ${styleValue.toUpperCase()}`, 176, 23, { align: "right" });

    // Draw the scannable Square QR Code (JPEG format to prevent PDF corruption)
    let linkBase = window.location.origin;
    if (linkBase.includes('localhost') || linkBase.includes('127.0.0.1')) {
      linkBase = 'https://textrack.onrender.com';
    }
    const appUrl = `${linkBase}${window.location.pathname}#/download?id=${product._id}`;
    
    try {
      const qrBase64 = await QRCode.toDataURL(appUrl, { type: 'image/jpeg', margin: 1, errorCorrectionLevel: 'M', width: 180 });
      doc.addImage(qrBase64, 'JPEG', 180, 11, 16, 16);
      doc.link(180, 11, 16, 16, { url: appUrl }); // Make clickable in PDF viewers
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.15);
      doc.rect(179.5, 10.5, 17, 17, 'D'); // Neat border
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(110, 110, 110);
      doc.text("SCAN TO VIEW", 188, 29, { align: "center" });
    } catch (err) {
      console.error("Failed to add QR code to PDF:", err);
    }

    // 4. Delicate divider accent line
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(14, 32, 196, 32);

    const activeSizes = ["S", "M", "L", "XL", "2XL", "3XL", "4XL"];

    const tableColumn = ["Color", ...activeSizes, "Total Qty"];
    if (includeAmount) tableColumn.push("Amount (Rs)");
    
    const tableRows = [];
    let totalQty = 0, totalAmt = 0;

    toDownload.forEach(v => {
      const amt = (v.stock || 0) * (product.pricePerPiece || 0);
      totalQty += (v.stock || 0);
      totalAmt += amt;
      
      const sizesData = activeSizes.map(sz => v.sizes?.[sz] || 0);
      const row = [
        v.color || '-',
        ...sizesData,
        v.stock || 0
      ];
      if (includeAmount) row.push(amt.toLocaleString('en-IN'));
      tableRows.push(row);
    });

    // Chunking tableRows into chunks of 20
    const CHUNK_SIZE = 20;

    for (let chunkIndex = 0; chunkIndex < tableRows.length; chunkIndex += CHUNK_SIZE) {
      const isFirstChunk = chunkIndex === 0;
      const isLastChunk = chunkIndex + CHUNK_SIZE >= tableRows.length;
      
      const chunkData = tableRows.slice(chunkIndex, chunkIndex + CHUNK_SIZE);
      
      if (isLastChunk) {
        const emptyCells = activeSizes.map(() => '');
        const totalRow = ['GRAND TOTAL', ...emptyCells, totalQty.toString()];
        if (includeAmount) totalRow.push(`Rs. ${totalAmt.toLocaleString('en-IN')}`);
        chunkData.push(totalRow);
      }

      const columnStyles = {
        0: { halign: 'left', fontStyle: 'bold' }
      };
      for (let i = 1; i <= activeSizes.length; i++) {
        columnStyles[i] = { halign: 'center' };
      }
      columnStyles[activeSizes.length + 1] = { halign: 'center', fontStyle: 'bold' };
      if (includeAmount) {
        columnStyles[activeSizes.length + 2] = { halign: 'right', fontStyle: 'bold' };
      }

      autoTable(doc, {
        head: [tableColumn],
        body: chunkData,
        startY: isFirstChunk ? 38 : 20,
        theme: 'grid',
        styles: { 
          fontSize: 8.5, 
          cellPadding: 3.5, 
          lineColor: [225, 225, 225], 
          lineWidth: 0.1,
          font: "helvetica"
        },
        headStyles: { 
          fillColor: [33, 37, 41], 
          textColor: [255, 255, 255], 
          halign: 'center', 
          fontStyle: 'bold',
          fontSize: 9
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        },
        columnStyles: columnStyles,
        didParseCell: (data) => {
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

    // Add branded footer and elegant double border to all pages
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

      // Elegant double border
      doc.setDrawColor(33, 37, 41); // Charcoal outer border
      doc.setLineWidth(0.5);
      doc.rect(4, 4, pageWidth - 8, pageHeight - 8, 'D');

      doc.setDrawColor(220, 220, 220); // Light gray thin inner border
      doc.setLineWidth(0.1);
      doc.rect(4.8, 4.8, pageWidth - 9.6, pageHeight - 9.6, 'D');
    }

    doc.save(`${product.name}_Report.pdf`);
  };

  const executePrintLabels = async () => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth(); // 210
      const pageHeight = doc.internal.pageSize.getHeight(); // 297

      // A4 grid settings
      const marginX = 10;
      const marginY = 10;
      const cols = 4;
      const rows = 7;
      
      const stickerWidth = (pageWidth - (marginX * 2)) / cols; // ~47.5mm
      const stickerHeight = (pageHeight - (marginY * 2)) / rows; // ~39.5mm
      
      // Calculate scannable web app URL
      let linkBase = window.location.origin;
      if (linkBase.includes('localhost') || linkBase.includes('127.0.0.1')) {
        linkBase = 'https://textrack.onrender.com';
      }
      const appUrl = `${linkBase}${window.location.pathname}#/download?id=${product._id}`;
      
      // Generate QR base64 locally (JPEG)
      const qrBase64 = await QRCode.toDataURL(appUrl, {
        type: 'image/jpeg',
        margin: 1,
        errorCorrectionLevel: 'M',
        width: 150
      });

      const maxStickers = cols * rows; // 28 stickers per page

      for (let i = 0; i < maxStickers; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        
        const startX = marginX + (col * stickerWidth);
        const startY = marginY + (row * stickerHeight);
        
        // Subtle dotted sticker boundary box
        doc.setDrawColor(210, 210, 210);
        doc.setLineWidth(0.1);
        doc.rect(startX, startY, stickerWidth, stickerHeight, 'D');

        // Draw Square QR Code
        const qrSize = 22; // mm
        const qrX = startX + (stickerWidth - qrSize) / 2;
        const qrY = startY + 2;
        doc.addImage(qrBase64, 'JPEG', qrX, qrY, qrSize, qrSize);
        
        // Print Product Title under QR
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.setTextColor(24, 24, 27);
        const truncate = (str, len) => str.length > len ? str.substring(0, len-2) + '..' : str;
        const labelText = truncate(product.name.toUpperCase(), 20);
        
        doc.text(labelText, startX + stickerWidth/2, qrY + qrSize + 4, { align: "center" });
        
        // Print Style/SKU ID
        doc.setFontSize(5.5);
        doc.setTextColor(80, 80, 80);
        const styleText = product.styleName ? product.styleName.toUpperCase() : product._id.slice(-6).toUpperCase();
        doc.text(`STYLE: ${styleText}`, startX + stickerWidth/2, qrY + qrSize + 7.5, { align: "center" });

        // Print Price boldly
        doc.setFont("helvetica", "bold");
        doc.setTextColor(10, 10, 10);
        doc.text(`Rs. ${product.pricePerPiece}`, startX + stickerWidth/2, qrY + qrSize + 10.5, { align: "center" });
      }

      doc.save(`${product.name}_QR_Stickers.pdf`);
    } catch (err) {
      console.error("Failed to generate QR stickers:", err);
      alert("Failed to generate labels.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm">
      <div className="bg-dark-800 rounded-2xl border border-dark-400 w-full sm:w-[85vw] md:w-[80vw] max-w-4xl h-[90vh] sm:h-[80vh] flex flex-col animate-slide-up shadow-2xl overflow-hidden">
        
        {/* Header ΓÇö sticky, never scrolls */}
        <div className="flex flex-col border-b border-dark-500 bg-dark-900 shrink-0 z-10">
          {/* Top bar: buttons + close */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => { setVarSelectMode(!varSelectMode); setSelectedVars([]); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  varSelectMode ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-dark-600 text-gray-300 hover:bg-dark-500 border border-dark-500'
                }`}>
                {varSelectMode ? 'Cancel' : 'Select'}
              </button>
              <button onClick={() => setShowDownloadModal(true)} className="p-1.5 rounded-lg bg-silver text-dark-900 hover:bg-silver-light transition-colors" title={varSelectMode && selectedVars.length > 0 ? `Download (${selectedVars.length})` : 'Download'}>
                <Download size={16} />
              </button>
              <button onClick={executePrintLabels} className="p-1.5 rounded-lg bg-dark-600 text-gray-300 hover:bg-dark-500 border border-dark-500 transition-colors" title="Print QR Stickers">
                <Printer size={16} />
              </button>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-dark-600 text-gray-400 transition-colors"><X size={20} /></button>
          </div>

          {/* Product info */}
          <div className="flex flex-col sm:flex-row gap-4 p-4 items-start sm:items-center">
            {/* Image + Name row */}
            <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto flex-1">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-dark-600 border border-dark-500 shrink-0 shadow-lg">
                {imgUrl ? (
                  <img src={imgUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500"><Package size={20} /></div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block">{product.category}</span>
                <h2 className="text-base sm:text-lg font-black text-white leading-tight break-words">{product.name}</h2>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-3 gap-2 w-full sm:w-auto shrink-0 mt-1 sm:mt-0">
              <div className="bg-dark-800/80 px-2.5 py-1.5 rounded-xl border border-dark-600 text-center min-w-[70px]">
                <span className="text-[9px] text-gray-500 font-bold uppercase block tracking-wider">Price</span>
                <span className="text-xs font-black text-white mt-0.5 block">Γé╣{product.pricePerPiece}</span>
              </div>
              <div className="bg-dark-800/80 px-2.5 py-1.5 rounded-xl border border-dark-600 text-center min-w-[60px]">
                <span className="text-[9px] text-gray-500 font-bold uppercase block tracking-wider">Qty</span>
                <span className="text-xs font-black text-white mt-0.5 block">{product.stock}</span>
              </div>
              <div className="bg-dark-800/80 px-2.5 py-1.5 rounded-xl border border-dark-600 text-center min-w-[80px]">
                <span className="text-[9px] text-gray-500 font-bold uppercase block tracking-wider">Amount</span>
                <span className="text-xs font-black text-white mt-0.5 block">Γé╣{(product.stock * product.pricePerPiece).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Variants List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <h3 className="text-xs text-gray-400 uppercase tracking-widest font-bold">Available Color Variants ({product.variants?.length || 0})</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {product.variants?.map((variant, i) => (
              <div
                key={i}
                onClick={() => varSelectMode && toggleVar(i)}
                className={`rounded-xl p-4 border flex flex-col justify-between transition-colors
                  ${varSelectMode ? 'cursor-pointer' : ''}
                  ${varSelectMode && selectedVars.includes(i) ? 'border-blue-500 bg-blue-500/10' : 'bg-dark-900/50 border-dark-600 hover:border-silver/20'}`}>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    {varSelectMode && (
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0
                        ${selectedVars.includes(i) ? 'bg-blue-500 border-blue-500 text-white' : 'border-dark-400 bg-dark-800'}`}>
                        {selectedVars.includes(i) && <CheckSquare size={11} />}
                      </div>
                    )}
                    <div className="w-6 h-6 rounded-full bg-dark-600 border border-dark-400 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-black text-gray-300">{i + 1}</span>
                    </div>
                    <span className="text-base font-bold text-silver">{variant.color}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 bg-dark-600 px-2 py-1 rounded-md">Qty: {variant.stock}</span>
                    <span className="text-xs font-bold text-silver bg-silver/10 px-2 py-1 rounded-md border border-silver/20">Γé╣{(variant.stock * product.pricePerPiece).toLocaleString('en-IN')}</span>
                  </div>
                </div>
                
                <div className={`grid ${product.category && product.category.toUpperCase() === 'MENS' ? 'grid-cols-4 sm:grid-cols-7' : 'grid-cols-4'} gap-2 mb-3`}>
                  {(product.category && product.category.toUpperCase() === 'MENS' 
                    ? ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'] 
                    : ['S', 'M', 'L', 'XL']).map(size => (
                    <div key={size} className="flex flex-col items-center bg-dark-800 rounded-lg py-2 border border-dark-500">
                      <span className="text-[10px] text-gray-500 font-bold mb-1">{size}</span>
                      <span className="text-sm text-white font-black">{variant.sizes?.[size] || 0}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-2 border-t border-dark-700">
                  <button
                    onClick={(e) => { e.stopPropagation(); onClose(); onEdit(product); }}
                    className="flex-1 flex items-center justify-center py-1.5 rounded-lg text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-colors">
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onClose(); onDelete(product._id); }}
                    className="flex-1 flex items-center justify-center py-1.5 rounded-lg text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-dark-800 rounded-2xl border border-dark-600 p-6 w-full max-w-sm shadow-2xl animate-fade-in">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><Download size={20} /> Export Report</h3>
            <p className="text-gray-400 text-sm mb-6">Do you want to include the <span className="text-silver font-bold">Amount (Value)</span> data in this download?</p>
            <div className="flex gap-3">
              <button onClick={() => { executeDownload(true); setShowDownloadModal(false); }} className="btn-primary flex-1 py-2.5 font-bold">Yes, Include</button>
              <button onClick={() => { executeDownload(false); setShowDownloadModal(false); }} className="btn-secondary flex-1 py-2.5 font-bold border-dark-600 hover:text-white hover:border-gray-500">No, Exclude</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EditProductModal = ({ product, onClose, onAdded }) => {
  const [categories, setCategories] = useState([]);
  
  const getCategorySizes = () => {
    return ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
  };

  const [form, setForm] = useState({
    name: product?.name || '',
    category: product?.category || '',
    pricePerPiece: product?.pricePerPiece || '',
    variants: product?.variants ? JSON.parse(JSON.stringify(product.variants)) : []
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(product?.image ? `${getBaseURL()}${product.image}` : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getCategories().then(res => setCategories(res.data)).catch(console.error);
  }, []);

  const handleImage = (e) => {
    const f = e.target.files[0];
    if (f) { setImage(f); setPreview(URL.createObjectURL(f)); }
  };

  const handleVariantSizeChange = (index, size, val) => {
    const newVariants = [...form.variants];
    newVariants[index].sizes[size] = parseInt(val) || 0;
    setForm({ ...form, variants: newVariants });
  };

  const handleVariantColorChange = (index, val) => {
    const newVariants = [...form.variants];
    newVariants[index].color = val;
    setForm({ ...form, variants: newVariants });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.category) {
      setError('Please fill all required fields'); return;
    }
    setError(''); setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('category', form.category);
      fd.append('pricePerPiece', form.pricePerPiece);
      fd.append('variants', JSON.stringify(form.variants));
      if (image) fd.append('image', image);
      
      const { data } = await updateProduct(product._id, fd);
      onAdded(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-dark-800 rounded-2xl border border-dark-400 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-dark-500 sticky top-0 bg-dark-800 z-10">
          <h2 className="font-bold text-white text-lg">Edit Product</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-dark-600 text-gray-400"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">{error}</div>}

          {/* Image upload */}
          <label className="block cursor-pointer">
            <div className={`h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors
              ${preview ? 'border-silver/40' : 'border-dark-400 hover:border-silver/30'}`}>
              {preview ? (
                <img src={preview} alt="preview" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <><Upload size={24} className="text-gray-500" /><span className="text-xs text-gray-500">Change Image (optional)</span></>
              )}
            </div>
            <input type="file" accept="image/*" hidden onChange={handleImage} />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Product Name *</label>
              <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Category *</label>
              <select 
                required 
                value={form.category} 
                onChange={e => {
                  const newCat = e.target.value;
                  const activeSizes = getCategorySizes(newCat);
                  const updatedVariants = form.variants.map(v => {
                    const newSizes = {};
                    activeSizes.forEach(s => {
                      newSizes[s] = v.sizes[s] !== undefined ? v.sizes[s] : 0;
                    });
                    return { ...v, sizes: newSizes };
                  });
                  setForm({ ...form, category: newCat, variants: updatedVariants });
                }} 
                className="input-field cursor-pointer"
              >
                <option value="">Select Category</option>
                {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-xs text-gray-400 mb-1 font-medium">Update Variants</label>
            {form.variants.map((v, i) => (
              <div key={i} className="card p-4 border border-dark-600 space-y-3">
                <div>
                  <label className="block text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-widest">Color Name</label>
                  <input type="text" value={v.color} onChange={e => handleVariantColorChange(i, e.target.value)} className="input-field" required />
                </div>
                <div className={`grid ${getCategorySizes(form.category).length > 4 ? 'grid-cols-4 sm:grid-cols-7' : 'grid-cols-4'} gap-3`}>
                  {getCategorySizes(form.category).map(size => (
                    <div key={size}>
                      <label className="block text-center text-[10px] text-gray-500 font-bold mb-1">{size}</label>
                      <input type="number" min="0" value={v.sizes?.[size] ?? 0}
                        onChange={e => handleVariantSizeChange(i, size, e.target.value)}
                        className="input-field text-center px-1" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Price Per Piece (Γé╣) - Optional</label>
            <input type="number" min="0" value={form.pricePerPiece} onChange={e => setForm({ ...form, pricePerPiece: e.target.value })} className="input-field" />
          </div>

          <div className="flex gap-3 pt-4 sticky bottom-0 bg-dark-800 pb-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function ProductsPage() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);
  
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showMainDownloadModal, setShowMainDownloadModal] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');
  
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getCategories().then(res => setCategories(res.data)).catch(console.error);

    // Dynamic proactive cache-busting to immediately purge old PWA Service Worker assets
    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => {
          if (key !== 'textrack-cache-v3') {
            console.log("Purging old service worker cache:", key);
            caches.delete(key);
          }
        });
      }).catch(err => console.error("Cache purge failed:", err));
    }
  }, []);
  
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getProducts({ search, page, limit: 24, category: categoryFilter });
      setProducts(data.products);
      setTotal(data.total);
      setPages(data.pages);
    } catch {}
    setLoading(false);
  }, [search, page, categoryFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Dynamically pop detailed view modal when scanning a QR code URL from a mobile camera / Google Lens
  useEffect(() => {
    const scanId = searchParams.get('scan');
    if (scanId) {
      console.log("URL scan parameter detected:", scanId);
      
      const fetchAndOpen = async () => {
        try {
          const { data } = await getProduct(scanId);
          if (data) {
            setViewProduct(data);
          }
        } catch (err) {
          console.error("Failed to fetch product from URL scan query:", err);
        } finally {
          // Clear the parameter from the URL
          setSearchParams({});
        }
      };
      fetchAndOpen();
    }
  }, [searchParams, setSearchParams]);

  const autoDownloadProductPdf = async (product) => {
    try {
      const variants = product.variants || [];
      if (variants.length === 0) return;

      // Load product image as base64 first
      let imageBase64 = null;
      if (product.image) {
        const imgUrl = getProductImage(product.image);
        imageBase64 = await loadImageAsBase64(imgUrl);
      }

      const doc = new jsPDF();

      // 1. LEFT COLUMN: TEXTRACK Brand label and PRODUCT STATUS
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(110, 110, 110);
      doc.text("T E X T R A C K", 14, 12);

      doc.setFontSize(14);
      doc.setTextColor(24, 24, 27);
      doc.text("PRODUCT STATUS (SCANNED)", 14, 19);

      // 2. CENTER COLUMN: Product Image, with Name & Category under it
      if (imageBase64) {
        try {
          doc.addImage(imageBase64, 'JPEG', 95, 4, 18, 18);
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.2);
          doc.roundedRect(95, 4, 18, 18, 1.5, 1.5, 'D');
        } catch (err) {
          console.error("Failed to add image to PDF:", err);
        }
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(80, 80, 80);
      const labelText = `${product.name.toUpperCase()} - ${product.category.toUpperCase()}`;
      doc.text(labelText, 104, 26, { align: "center" });

      // 3. RIGHT COLUMN: DATE and STYLE/SKU
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      const styleValue = product.styleName || product.name || product._id;
      doc.text(`STYLE: ${styleValue.toUpperCase()}`, 176, 23, { align: "right" });

      // Draw the scannable Square QR Code (JPEG format to prevent PDF corruption)
      let linkBase = window.location.origin;
      if (linkBase.includes('localhost') || linkBase.includes('127.0.0.1')) {
        linkBase = 'https://textrack.onrender.com';
      }
      const appUrl = `${linkBase}${window.location.pathname}#/download?id=${product._id}`;
      
      try {
        const qrBase64 = await QRCode.toDataURL(appUrl, { type: 'image/jpeg', margin: 1, errorCorrectionLevel: 'M', width: 180 });
        doc.addImage(qrBase64, 'JPEG', 180, 11, 16, 16);
        doc.link(180, 11, 16, 16, { url: appUrl }); // Make clickable in PDF viewers
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.15);
        doc.rect(179.5, 10.5, 17, 17, 'D'); // Neat border
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.setTextColor(110, 110, 110);
        doc.text("SCAN TO VIEW", 188, 29, { align: "center" });
      } catch (err) {
        console.error("Failed to add QR code to auto PDF:", err);
      }

      // 4. Delicate divider accent line
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(14, 32, 196, 32);

      const activeSizes = ["S", "M", "L", "XL", "2XL", "3XL", "4XL"];
      const tableColumn = ["Color", ...activeSizes, "Total Qty", "Amount (Rs)"];
      
      const tableRows = [];
      let totalQty = 0, totalAmt = 0;

      variants.forEach(v => {
        const amt = (v.stock || 0) * (product.pricePerPiece || 0);
        totalQty += (v.stock || 0);
        totalAmt += amt;
        
        const sizesData = activeSizes.map(sz => v.sizes?.[sz] || 0);
        tableRows.push([
          v.color || '-',
          ...sizesData,
          v.stock || 0,
          amt.toLocaleString('en-IN')
        ]);
      });

      // Chunking tableRows into chunks of 20
      const CHUNK_SIZE = 20;

      for (let chunkIndex = 0; chunkIndex < tableRows.length; chunkIndex += CHUNK_SIZE) {
        const isFirstChunk = chunkIndex === 0;
        const isLastChunk = chunkIndex + CHUNK_SIZE >= tableRows.length;
        
        const chunkData = tableRows.slice(chunkIndex, chunkIndex + CHUNK_SIZE);
        
        if (isLastChunk) {
          const emptyCells = activeSizes.map(() => '');
          const totalRow = ['GRAND TOTAL', ...emptyCells, totalQty.toString(), `Rs. ${totalAmt.toLocaleString('en-IN')}`];
          chunkData.push(totalRow);
        }

        const columnStyles = {
          0: { halign: 'left', fontStyle: 'bold' }
        };
        for (let i = 1; i <= activeSizes.length; i++) {
          columnStyles[i] = { halign: 'center' };
        }
        columnStyles[activeSizes.length + 1] = { halign: 'center', fontStyle: 'bold' };
        columnStyles[activeSizes.length + 2] = { halign: 'right', fontStyle: 'bold' };

        autoTable(doc, {
          head: [tableColumn],
          body: chunkData,
          startY: isFirstChunk ? 38 : 20,
          theme: 'grid',
          styles: { 
            fontSize: 8.5, 
            cellPadding: 3.5, 
            lineColor: [225, 225, 225], 
            lineWidth: 0.1,
            font: "helvetica"
          },
          headStyles: { 
            fillColor: [33, 37, 41], 
            textColor: [255, 255, 255], 
            halign: 'center', 
            fontStyle: 'bold',
            fontSize: 9
          },
          alternateRowStyles: {
            fillColor: [250, 250, 250]
          },
          columnStyles: columnStyles,
          didParseCell: (data) => {
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

      // Add branded footer and elegant double border to all pages
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

        // Elegant double border
        doc.setDrawColor(33, 37, 41); // Charcoal outer border
        doc.setLineWidth(0.5);
        doc.rect(4, 4, pageWidth - 8, pageHeight - 8, 'D');

        doc.setDrawColor(220, 220, 220); // Light gray thin inner border
        doc.setLineWidth(0.1);
        doc.rect(4.8, 4.8, pageWidth - 9.6, pageHeight - 9.6, 'D');
      }

      doc.save(`${product.name}_Report_${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error("Auto PDF download failed:", err);
    }
  };

  // Intercept exact QR Code scans (MongoDB _id format: 24-character hex or QR Code URL)
  useEffect(() => {
    let trimmedInput = searchInput.trim();
    
    // If it is a full QR code URL scanned into the input box
    if (trimmedInput.includes('?scan=')) {
      const parts = trimmedInput.split('?scan=');
      if (parts.length > 1) {
        trimmedInput = parts[1].split('&')[0]; // Extract just the ID
      }
    }
    
    if (/^[0-9a-fA-F]{24}$/.test(trimmedInput)) {
      console.log("QR Code scan detected! Matched exact 24-char ObjectId:", trimmedInput);
      
      // 1. Try to find the product locally in the current list
      const localMatch = products.find(p => p._id === trimmedInput);
      if (localMatch) {
        console.log("Product found locally! Opening view modal...");
        setViewProduct(localMatch);
        setSearchInput('');
        setSearch('');
      } else {
        // 2. Fetch the single product directly from backend using its ID
        const fetchAndOpen = async () => {
          try {
            const { data } = await getProduct(trimmedInput);
            if (data) {
              console.log("Product fetched from database! Opening view modal...");
              setViewProduct(data);
            }
          } catch (err) {
            console.error("Failed to query product from scanned QR ID:", err);
          } finally {
            setSearchInput('');
            setSearch('');
          }
        };
        fetchAndOpen();
      }
    }
  }, [searchInput, products]);

  // Automatic modal pop when a barcode scan matches a product name, styleName or ID exactly (linear barcodes)
  useEffect(() => {
    if (products.length === 1 && search) {
      const matchedProduct = products[0];
      const normalizedSearch = search.trim().toLowerCase();
      
      const isExactMatch = 
        matchedProduct.name.trim().toLowerCase() === normalizedSearch ||
        matchedProduct.styleName?.trim().toLowerCase() === normalizedSearch ||
        matchedProduct._id.trim().toLowerCase() === normalizedSearch;
        
      if (isExactMatch) {
        console.log("Barcode scan matched! Opening view modal for:", matchedProduct.name);
        setViewProduct(matchedProduct);
        // Clear search to prevent loop
        setSearch('');
        setSearchInput('');
      }
    }
  }, [products, search]);

  const handleForceView = async () => {
    const queryStr = searchInput.trim();
    if (!queryStr) return alert("Please type or scan a product code first!");

    setLoading(true);
    try {
      // 1. If it is a MongoDB ObjectId
      if (/^[0-9a-fA-F]{24}$/.test(queryStr)) {
        const { data } = await getProduct(queryStr);
        if (data) {
          setViewProduct(data);
          setSearchInput('');
          setSearch('');
          return;
        }
      }

      // 2. Otherwise search by styleName / name exactly
      const { data } = await getProducts({ search: queryStr, limit: 1 });
      if (data && data.products && data.products.length > 0) {
        setViewProduct(data.products[0]);
        setSearchInput('');
        setSearch('');
      } else {
        alert(`Could not find any product matching "${queryStr}". Please verify the scanned code.`);
      }
    } catch (err) {
      console.error("Force view failed:", err);
      alert("Failed to fetch scanned product details. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    await deleteProduct(id);
    if (viewProduct?._id === id) setViewProduct(null);
    fetchProducts();
  };

  const toggleSelect = (id) => {
    setSelectedProducts(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const executeMainDownload = async (includeAmount) => {
    let itemsToDownload = products;
    if (selectionMode && selectedProducts.length > 0) {
      itemsToDownload = products.filter(p => selectedProducts.includes(p._id));
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
    doc.text("Garment Production and Inventory Overview", 14, 25);

    // 5. Delicate divider accent line
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(14, 32, 196, 32);

    const tableColumn = ["S.No", "Product Name", "Color", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "Total Qty"];
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
          
          const sizesData = ["S", "M", "L", "XL", "2XL", "3XL", "4XL"].map(sz => v.sizes?.[sz] || 0);
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
        const itemAmount = (p.stock || 0) * (p.pricePerPiece || 0);
        overallQuantity += (p.stock || 0);
        overallAmount += itemAmount;
        
        const sizesData = ["S", "M", "L", "XL", "2XL", "3XL", "4XL"].map(sz => p.sizes?.[sz] || 0);
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
        const totalRow = [
          '', 'GRAND TOTAL', '', '', '', '', '', '', '', '',
          overallQuantity.toString()
        ];
        if (includeAmount) totalRow.push(`Rs. ${overallAmount.toLocaleString('en-IN')}`);
        chunkData.push(totalRow);
      }
      
      const dynamicColumnStyles = {
        0: { halign: 'center' },
        1: { fontStyle: 'bold' },
        10: { halign: 'center', fontStyle: 'bold' }
      };
      if (includeAmount) {
        dynamicColumnStyles[11] = { halign: 'right', fontStyle: 'bold' };
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
        columnStyles: {
          0: { halign: 'center', fontStyle: 'bold', cellWidth: 12 },
          1: { halign: 'left', fontStyle: 'bold' },
          2: { halign: 'left' },
          3: { halign: 'center' },
          4: { halign: 'center' },
          5: { halign: 'center' },
          6: { halign: 'center' },
          7: { halign: 'center' },
          8: { halign: 'center' },
          9: { halign: 'center' },
          10: { halign: 'center', fontStyle: 'bold' },
          ...(includeAmount ? { 11: { halign: 'right', fontStyle: 'bold' } } : {})
        },
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

    // Add branded footer and elegant double border to all pages
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

      // Elegant double border
      doc.setDrawColor(33, 37, 41); // Charcoal outer border
      doc.setLineWidth(0.5);
      doc.rect(4, 4, pageWidth - 8, pageHeight - 8, 'D');

      doc.setDrawColor(220, 220, 220); // Light gray thin inner border
      doc.setLineWidth(0.1);
      doc.rect(4.8, 4.8, pageWidth - 9.6, pageHeight - 9.6, 'D');
    }

    doc.save(`Inventory_Report_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {viewProduct && (
        <ViewProductModal 
          product={viewProduct} 
          onClose={() => setViewProduct(null)} 
          isAdmin={isAdmin}
          onDelete={handleDelete}
          onEdit={(p) => {
            setViewProduct(null);
            setEditProduct(p);
          }}
        />
      )}
      
      {editProduct && (
        <EditProductModal 
          product={editProduct} 
          onClose={() => setEditProduct(null)} 
          onAdded={() => fetchProducts()} 
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap sticky top-0 bg-dark-900/95 backdrop-blur-xl py-3 z-10 border-b border-dark-600 -mx-4 px-4 lg:-mx-6 lg:px-6">
        <div className="flex items-center gap-2">
          {categoryFilter && (
            <span className="text-silver bg-silver/10 px-2.5 py-1 rounded-xl text-xs font-semibold border border-silver/20">
              Filter: {categoryFilter}
            </span>
          )}
          <span className="text-xs text-gray-500 font-medium">
            {total.toLocaleString()} products
          </span>
        </div>
        <div className="flex items-center gap-3">
          {products.length > 0 && (
            <div className="flex items-center gap-2 mr-2">
              <button onClick={() => {
                  setSelectionMode(!selectionMode);
                  if (selectionMode) setSelectedProducts([]);
                }} 
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${selectionMode ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-dark-600 text-gray-300 hover:bg-dark-500 border border-dark-500'}`}>
                <CheckSquare size={14} className="shrink-0" />
                <span>{selectionMode ? 'Cancel' : 'Select'}</span>
              </button>
              <button onClick={() => setShowMainDownloadModal(true)} className="p-2 rounded-xl bg-silver text-dark-900 hover:bg-silver-light transition-colors shadow-lg shadow-silver/10" title={selectionMode && selectedProducts.length > 0 ? `Download (${selectedProducts.length})` : 'Download All'}>
                <Download size={18} />
              </button>
            </div>
          )}
          {categoryFilter && (
            <button onClick={() => setSearchParams({})} className="text-xs text-gray-400 hover:text-white bg-dark-600 px-3 py-2 rounded-xl">
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Search & Category Filter Dropdown */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search designs..." 
              value={searchInput}
              onChange={(e) => {
                const val = e.target.value;
                setSearchInput(val);
                setSearch(val);
                setPage(1);
              }} 
              className="input-field pl-10 text-sm" 
            />
          </div>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }} className="btn-secondary px-3">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="w-full sm:w-48 shrink-0">
          <select 
            value={categoryFilter || ''} 
            onChange={(e) => {
              const val = e.target.value;
              if (val) {
                setSearchParams({ category: val });
              } else {
                setSearchParams({});
              }
              setPage(1);
            }}
            className="input-field text-sm font-semibold py-2 px-3 text-silver bg-dark-800 border-dark-500 cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c._id} value={c.name} className="bg-dark-900 text-white font-medium">
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin text-silver" /></div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <Package size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No products found</p>
          {searchInput && (
            <div className="mt-6 flex justify-center animate-slide-up">
              <button 
                type="button"
                onClick={handleForceView}
                className="py-2.5 px-5 bg-gradient-to-r from-silver/20 to-silver-light/20 hover:from-silver/30 hover:to-silver-light/30 border border-silver/30 rounded-xl text-xs font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 group active:scale-[0.98] cursor-pointer shadow-lg hover:shadow-silver/5"
              >
                <Search size={14} className="text-silver animate-pulse" />
                View Scanned Product Details
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
            <ProductCard 
              key={p._id} 
              product={p} 
              onView={setViewProduct} 
              selectionMode={selectionMode}
              isSelected={selectedProducts.includes(p._id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 flex-wrap">
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all
                ${page === p ? 'bg-silver text-dark-900' : 'bg-dark-600 text-gray-400 hover:text-white'}`}>
              {p}
            </button>
          ))}
        </div>
      )}
      {showMainDownloadModal && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-dark-800 rounded-2xl border border-dark-600 p-6 w-full max-w-sm shadow-2xl animate-fade-in">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><Download size={20} /> Export Report</h3>
            <p className="text-gray-400 text-sm mb-6">Do you want to include the <span className="text-silver font-bold">Amount (Value)</span> data in this download?</p>
            <div className="flex gap-3">
              <button onClick={() => { executeMainDownload(true); setShowMainDownloadModal(false); }} className="btn-primary flex-1 py-2.5 font-bold">Yes, Include</button>
              <button onClick={() => { executeMainDownload(false); setShowMainDownloadModal(false); }} className="btn-secondary flex-1 py-2.5 font-bold border-dark-600 hover:text-white hover:border-gray-500">No, Exclude</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

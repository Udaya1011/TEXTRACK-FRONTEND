import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProduct, getProductImage } from '../api/api';
import { Loader2, Package, AlertTriangle, FileText } from 'lucide-react';
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

export default function PublicDownloadPage() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) {
      setError("Invalid or Missing Barcode Link.");
      setLoading(false);
      return;
    }
    
    // Fetch product details based on the scanned QR code ID
    getProduct(id)
      .then(res => {
        setProduct(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Document not found or removed from system.");
        setLoading(false);
      });
  }, [id]);

  const executeDownload = async () => {
    if (!product) return;
    setDownloading(true);
    try {
      const variants = product.variants || [];
      if (variants.length === 0) {
        alert("No variants available for this product.");
        setDownloading(false);
        return;
      }

      let imageBase64 = null;
      if (product.image) {
        const imgUrl = getProductImage(product.image);
        imageBase64 = await loadImageAsBase64(imgUrl);
      }

      const doc = new jsPDF();

      // HEADER
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(110, 110, 110);
      doc.text("T E X T R A C K", 14, 12);
      doc.setFontSize(14);
      doc.setTextColor(24, 24, 27);
      doc.text("PRODUCT STATUS", 14, 19);

      // IMAGE
      if (imageBase64) {
        try {
          doc.addImage(imageBase64, 'JPEG', 95, 4, 18, 18);
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.2);
          doc.roundedRect(95, 4, 18, 18, 1.5, 1.5, 'D');
        } catch (err) {}
      }

      // TITLE
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(80, 80, 80);
      doc.text(`${product.name.toUpperCase()} - ${(product.category || "").toUpperCase()}`, 104, 26, { align: "center" });

      // RIGHT ALIGN DETAILS
      const styleValue = product.styleName || product.name || product._id;
      doc.text(`STYLE: ${styleValue.toUpperCase()}`, 176, 23, { align: "right" });

      // QR CODE
      let linkBase = window.location.origin;
      if (linkBase.includes('localhost') || linkBase.includes('127.0.0.1')) {
        linkBase = 'https://textrack.onrender.com';
      }
      const appUrl = `${linkBase}${window.location.pathname}#/download?id=${product._id}`;
      
      try {
        const qrBase64 = await QRCode.toDataURL(appUrl, { type: 'image/jpeg', margin: 1, errorCorrectionLevel: 'M', width: 180 });
        doc.addImage(qrBase64, 'JPEG', 180, 11, 16, 16);
        doc.link(180, 11, 16, 16, { url: appUrl });
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.15);
        doc.rect(179.5, 10.5, 17, 17, 'D');
        doc.setFontSize(6.5);
        doc.text("SCAN TO VIEW", 188, 29, { align: "center" });
      } catch (err) {}

      // DIVIDER
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(14, 32, 196, 32);

      // TABLE
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

      const CHUNK_SIZE = 20;
      for (let chunkIndex = 0; chunkIndex < tableRows.length; chunkIndex += CHUNK_SIZE) {
        const isFirstChunk = chunkIndex === 0;
        const isLastChunk = chunkIndex + CHUNK_SIZE >= tableRows.length;
        const chunkData = tableRows.slice(chunkIndex, chunkIndex + CHUNK_SIZE);
        
        if (isLastChunk) {
          const emptyCells = activeSizes.map(() => '');
          chunkData.push(['GRAND TOTAL', ...emptyCells, totalQty.toString(), `Rs. ${totalAmt.toLocaleString('en-IN')}`]);
        }

        const columnStyles = { 0: { halign: 'left', fontStyle: 'bold' } };
        for (let i = 1; i <= activeSizes.length; i++) columnStyles[i] = { halign: 'center' };
        columnStyles[activeSizes.length + 1] = { halign: 'center', fontStyle: 'bold' };
        columnStyles[activeSizes.length + 2] = { halign: 'right', fontStyle: 'bold' };

        autoTable(doc, {
          head: [tableColumn],
          body: chunkData,
          startY: isFirstChunk ? 38 : 20,
          theme: 'grid',
          styles: { fontSize: 8.5, cellPadding: 3.5, lineColor: [225, 225, 225], lineWidth: 0.1, textColor: [24, 24, 27] },
          headStyles: { fillColor: [248, 249, 250], textColor: [24, 24, 27], fontStyle: 'bold', lineWidth: 0.1 },
          columnStyles: columnStyles,
          didParseCell: (data) => {
            if (isLastChunk && data.row.index === chunkData.length - 1) {
              data.cell.styles.fillColor = [235, 236, 240];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        });

        if (!isLastChunk) doc.addPage();
      }

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setDrawColor(220);
        doc.setLineWidth(0.2);
        doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
        doc.text("TexTrack - Udaya", pageWidth / 2, pageHeight - 7, { align: "center" });
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 7, { align: "right" });
        doc.setDrawColor(33, 37, 41);
        doc.setLineWidth(0.5);
        doc.rect(4, 4, pageWidth - 8, pageHeight - 8, 'D');
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.1);
        doc.rect(4.8, 4.8, pageWidth - 9.6, pageHeight - 9.6, 'D');
      }

      doc.save(`${product.name}_Report.pdf`);
    } catch (err) {
      console.error(err);
      alert("Failed to generate PDF");
    }
    setDownloading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080b12] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#080b12] flex flex-col items-center justify-center p-4">
        <div className="bg-dark-900 border border-dark-700 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <AlertTriangle className="text-red-500 w-16 h-16 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  const imgUrl = product.image ? getProductImage(product.image) : null;

  return (
    <div className="min-h-screen bg-[#080b12] flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#080b12] to-[#080b12]">
      <div className="bg-dark-900/80 backdrop-blur-xl border border-dark-700/50 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-fade-in-up">
        
        <div className="w-24 h-24 mx-auto bg-dark-800 rounded-2xl p-1 mb-6 border border-dark-600 shadow-xl overflow-hidden">
          {imgUrl ? (
            <img src={imgUrl} alt={product.name} className="w-full h-full object-cover rounded-xl" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600 bg-dark-700 rounded-xl">
              <Package size={32} />
            </div>
          )}
        </div>

        <h3 className="text-[10px] text-blue-400 font-black tracking-widest uppercase mb-1">
          {product.category || "DOCUMENT"}
        </h3>
        <h1 className="text-2xl font-black text-white mb-2 leading-tight">
          {product.name}
        </h1>
        <p className="text-sm text-gray-400 font-medium mb-8">
          Style: {product.styleName || product._id.slice(-6).toUpperCase()}
        </p>

        <button 
          onClick={executeDownload}
          disabled={downloading}
          className="w-full bg-silver hover:bg-silver-light text-dark-900 font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:pointer-events-none"
        >
          {downloading ? (
            <Loader2 className="animate-spin w-5 h-5" />
          ) : (
            <FileText className="w-5 h-5" />
          )}
          {downloading ? "GENERATING PDF..." : "DOWNLOAD DOCUMENT"}
        </button>

        <div className="mt-8 text-[10px] text-gray-600 font-bold uppercase tracking-widest">
          Powered by TexTrack
        </div>
      </div>
    </div>
  );
}

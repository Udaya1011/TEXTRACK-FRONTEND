import { useState, useEffect } from 'react';
import { getCategories, createProduct } from '../api/api';
import { Upload, Plus, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AddProductPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  
  // Base details that apply to all variants
  const [baseForm, setBaseForm] = useState({ name: '', category: '', price: '' });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  
  const getCategorySizes = () => {
    return ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
  };

  // List of color variants
  const [variants, setVariants] = useState([
    { id: 1, color: '', sizes: { S: 0, M: 0, L: 0, XL: 0 } }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successCount, setSuccessCount] = useState(0);

  useEffect(() => {
    getCategories().then(res => {
      setCategories(res.data);
      if (res.data.length > 0) {
        const defaultCat = res.data[0].name;
        setBaseForm(f => ({ ...f, category: defaultCat }));
        
        // Initialize with correct sizes based on first category
        const initialSizes = {};
        getCategorySizes(defaultCat).forEach(s => {
          initialSizes[s] = 0;
        });
        setVariants([{ id: 1, color: '', sizes: initialSizes }]);
      }
    }).catch(() => {});
  }, []);

  const handleImage = (e) => {
    const f = e.target.files[0];
    if (f) { 
      setImage(f); 
      setPreview(URL.createObjectURL(f)); 
    }
  };

  const handleSizeChange = (index, size, value) => {
    const newVariants = [...variants];
    newVariants[index].sizes[size] = Number(value) || 0;
    setVariants(newVariants);
  };

  const addVariant = () => {
    const activeSizes = getCategorySizes(baseForm.category);
    const initialSizes = {};
    activeSizes.forEach(s => {
      initialSizes[s] = 0;
    });
    setVariants([...variants, { id: Date.now(), color: '', sizes: initialSizes }]);
  };

  const removeVariant = (index) => {
    if (variants.length === 1) return;
    const newVariants = [...variants];
    newVariants.splice(index, 1);
    setVariants(newVariants);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return setError('Please upload a product image.');
    if (!baseForm.category) return setError('Please select a category. Add a category first if none exist.');
    
    // Validation
    for (let i = 0; i < variants.length; i++) {
      if (!variants[i].color.trim()) return setError(`Please enter a color name for Color ${i + 1}`);
    }
    
    setError(''); 
    setLoading(true);
    setSuccessCount(0);
    
    try {
      const fd = new FormData();
      fd.append('name', baseForm.name);
      fd.append('category', baseForm.category);
      fd.append('pricePerPiece', baseForm.price);
      fd.append('variants', JSON.stringify(variants));
      if (image) fd.append('image', image);

      await createProduct(fd);
      navigate('/products'); // Go to products show page
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add one or more product variants');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">{error}</div>}
        
        {/* Base Details Section */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">1. Base Details</h2>
          
          <div className="border border-dark-400 hover:border-gray-500 transition-colors duration-300 rounded-2xl p-6 bg-dark-900/10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Single Image Upload */}
            <div className="md:col-span-1">
              <label className="block cursor-pointer h-52 md:h-full">
                <div className={`h-full rounded-2xl border border-dashed flex flex-col items-center justify-center gap-3 transition-all duration-300
                  ${preview ? 'border-dark-400 hover:border-white' : 'border-dark-400 hover:border-white bg-dark-950/20 hover:bg-dark-800/10'}`}>
                  {preview ? (
                    <img src={preview} alt="preview" className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-xl bg-dark-800 border border-dark-600 flex items-center justify-center">
                        <ImageIcon size={22} className="text-gray-400" />
                      </div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Upload Product Image *</span>
                    </>
                  )}
                </div>
                <input type="file" accept="image/*" hidden onChange={handleImage} />
              </label>
            </div>

            <div className="md:col-span-2 flex flex-col justify-center space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1.5 font-bold uppercase tracking-wider">Product Name *</label>
                  <input type="text" required placeholder="e.g. Polo Stripe" value={baseForm.name} onChange={e => setBaseForm({ ...baseForm, name: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1.5 font-bold uppercase tracking-wider">Category *</label>
                  <select 
                    required 
                    value={baseForm.category} 
                    onChange={e => {
                      const newCat = e.target.value;
                      setBaseForm({ ...baseForm, category: newCat });
                      
                      // Dynamically reset/align variant sizes when category changes
                      const activeSizes = getCategorySizes(newCat);
                      setVariants(prev => prev.map(v => {
                        const newSizes = {};
                        activeSizes.forEach(s => {
                          newSizes[s] = v.sizes[s] !== undefined ? v.sizes[s] : 0;
                        });
                        return { ...v, sizes: newSizes };
                      }));
                    }} 
                    className="input-field cursor-pointer"
                  >
                    <option value="" disabled className="bg-dark-900 text-white">Select Category</option>
                    {categories.map(c => <option key={c._id} value={c.name} className="bg-dark-900 text-white font-medium">{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-1.5 font-bold uppercase tracking-wider">Price (Per Pc) - Optional</label>
                <div className="relative w-full sm:max-w-xs">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">₹</span>
                  <input type="number" min="0" placeholder="0" value={baseForm.price} onChange={e => setBaseForm({ ...baseForm, price: e.target.value })} className="input-field pl-8 text-lg font-black text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Variants Section */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">2. Color Variants</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {variants.map((variant, index) => (
              <div key={variant.id} className="border border-dark-400 hover:border-white rounded-2xl p-6 relative group animate-fade-in transition-all duration-300 bg-dark-900/10 flex flex-col justify-between">
                <div className="space-y-5">
                  <div className="pr-8">
                    <label className="block text-[10px] text-gray-500 mb-1.5 font-bold uppercase tracking-wider">Color Name *</label>
                    <input type="text" required placeholder="e.g. Navy Blue, Red, White" value={variant.color} onChange={e => {
                      const newVariants = [...variants];
                      newVariants[index].color = e.target.value;
                      setVariants(newVariants);
                    }} className="input-field" />
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-500 mb-2 font-bold uppercase tracking-wider">Quantities by Size *</label>
                    <div className={`grid ${getCategorySizes(baseForm.category).length > 4 ? 'grid-cols-4 sm:grid-cols-7' : 'grid-cols-4'} gap-2 bg-dark-950/40 p-2.5 rounded-xl border border-dark-600`}>
                      {getCategorySizes(baseForm.category).map(size => (
                        <div key={size}>
                          <label className="block text-center text-[10px] text-gray-500 mb-1 font-bold">{size}</label>
                          <input 
                            type="number" 
                            min="0" 
                            value={variant.sizes[size] ?? 0} 
                            onChange={e => handleSizeChange(index, size, e.target.value)} 
                            className="w-full bg-dark-800 border border-dark-400 rounded-lg py-2 px-1 text-center text-gray-100 placeholder-gray-500 focus:outline-none focus:border-white transition-all font-black text-xs sm:text-sm" 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button type="button" onClick={addVariant} className="btn-secondary w-full py-4 flex items-center justify-center gap-2 border-dashed border hover:border-gray-500 rounded-2xl font-bold transition-all">
            <Plus size={16} /> Add Another Color Variant
          </button>
        </div>

        {/* Submit */}
        <div className="pt-6 border-t border-dark-600 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">
            Adding <span className="text-white font-black">{variants.length}</span> color variants for <span className="text-white font-black">{baseForm.name || 'New Product'}</span>
          </div>
          <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2 px-8 py-3 text-sm w-full sm:w-auto">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Save All Variants'}
          </button>
        </div>
      </form>
    </div>
  );
}

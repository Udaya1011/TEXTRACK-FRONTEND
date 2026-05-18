import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../api/api';
import { Shirt, Eye, EyeOff, Loader2, Lock, Phone, Download, X, Share2, PlusSquare, MoreVertical } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ mobile: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    const standaloneCheck = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setIsStandalone(standaloneCheck);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setDeferredPrompt(null);
      setIsInstallable(false);
    } else {
      setShowInstallGuide(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await loginUser(form);
      login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-silver/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-silver-dark/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.jpg" alt="TexTrack Logo" className="inline-block w-20 h-20 rounded-2xl border border-silver/30 mb-4 object-cover shadow-lg" />
          <h1 className="text-3xl font-extrabold text-white">Tex<span className="text-silver">Track</span></h1>
          <p className="text-gray-500 mt-1 text-sm">Garment Production Management</p>
        </div>

        {/* Card */}
        <div className="card p-6 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-5">Sign In</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-4 animate-slide-up">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Mobile Number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="tel"
                  placeholder="9XXXXXXXXX"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field pl-10 pr-10"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-600 mt-5">
            Contact admin to get your credentials
          </p>

          {!isStandalone && (
            <div className="mt-4 pt-4 border-t border-dark-600 animate-slide-up">
              <button 
                type="button" 
                onClick={handleInstallClick} 
                className="w-full py-2.5 px-4 bg-gradient-to-r from-silver/20 to-silver-light/20 hover:from-silver/30 hover:to-silver-light/30 border border-silver/30 rounded-xl text-xs font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 group active:scale-[0.98] cursor-pointer shadow-lg hover:shadow-silver/5"
              >
                <Download size={14} className="text-silver animate-bounce group-hover:scale-110" />
                Install TexTrack App
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-700 mt-4">
          © 2026 TexTrack. All rights reserved.
        </p>
      </div>

      {/* Beautiful Install Instruction Modal */}
      {showInstallGuide && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-dark-800 rounded-2xl border border-dark-600 p-6 w-full max-w-sm shadow-2xl animate-scale-up relative">
            <button 
              type="button" 
              onClick={() => setShowInstallGuide(false)} 
              className="absolute top-4 right-4 text-gray-500 hover:text-white p-1 hover:bg-dark-600 rounded-lg transition-all"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-silver/10 border border-silver/20 mb-3">
                <Download size={24} className="text-silver animate-bounce" />
              </div>
              <h3 className="text-lg font-bold text-white">Install TexTrack</h3>
              <p className="text-xs text-gray-400 mt-1">Get the native app experience on your device</p>
            </div>

            {/* Check if iOS */}
            {/iPad|iPhone|iPod/.test(navigator.userAgent) ? (
              <div className="space-y-4 text-sm text-gray-300">
                <div className="flex gap-3 items-start bg-dark-900/40 p-3 rounded-xl border border-dark-600">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-silver/20 text-silver font-bold text-xs shrink-0 mt-0.5 font-sans">1</span>
                  <p className="leading-relaxed text-xs">Tap the <strong className="text-white">Share</strong> button <Share2 size={15} className="inline-block text-silver mx-1 align-text-bottom" /> at the bottom (Safari) or top (Chrome) of your screen.</p>
                </div>
                <div className="flex gap-3 items-start bg-dark-900/40 p-3 rounded-xl border border-dark-600">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-silver/20 text-silver font-bold text-xs shrink-0 mt-0.5 font-sans">2</span>
                  <p className="leading-relaxed text-xs">Scroll down the menu and select <strong className="text-white">Add to Home Screen</strong> <PlusSquare size={15} className="inline-block text-silver mx-1 align-text-bottom" />.</p>
                </div>
                <div className="flex gap-3 items-start bg-dark-900/40 p-3 rounded-xl border border-dark-600">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-silver/20 text-silver font-bold text-xs shrink-0 mt-0.5 font-sans">3</span>
                  <p className="leading-relaxed text-xs">Tap <strong className="text-white">Add</strong> in the top-right corner to complete!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-sm text-gray-300">
                <div className="flex gap-3 items-start bg-dark-900/40 p-3 rounded-xl border border-dark-600">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-silver/20 text-silver font-bold text-xs shrink-0 mt-0.5 font-sans">1</span>
                  <p className="leading-relaxed text-xs">Tap the <strong className="text-white">Menu</strong> button <MoreVertical size={15} className="inline-block text-silver mx-1 align-text-bottom" /> (three dots) in your browser's top-right corner.</p>
                </div>
                <div className="flex gap-3 items-start bg-dark-900/40 p-3 rounded-xl border border-dark-600">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-silver/20 text-silver font-bold text-xs shrink-0 mt-0.5 font-sans">2</span>
                  <p className="leading-relaxed text-xs">Select <strong className="text-white">Install app</strong> or <strong className="text-white">Add to Home Screen</strong>.</p>
                </div>
                <div className="flex gap-3 items-start bg-dark-900/40 p-3 rounded-xl border border-dark-600">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-silver/20 text-silver font-bold text-xs shrink-0 mt-0.5 font-sans">3</span>
                  <p className="leading-relaxed text-xs">Follow the on-screen prompts to confirm installation!</p>
                </div>
              </div>
            )}

            <button 
              type="button" 
              onClick={() => setShowInstallGuide(false)} 
              className="btn-primary w-full py-2.5 font-bold mt-6 text-sm"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Shirt, Factory, TrendingDown,
  User, Users, Menu, X, LogOut, ChevronRight, Plus, Bell, Package
} from 'lucide-react';

// Bottom nav items
const bottomNav = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/category', label: 'Category', icon: Shirt },
  { path: '/add-product', label: 'Add', icon: Plus },
  { path: '/products', label: 'Product', icon: Package },
  { path: '/profile', label: 'Profile', icon: User },
];

// Sidebar items
const sidebarNav = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/category', label: 'Category', icon: Shirt },
  { path: '/add-product', label: 'Add Product', icon: Plus },
  { path: '/products', label: 'Product', icon: Package },
  { path: '/profile', label: 'Profile', icon: User },
];

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path) => location.pathname === path;
  const handleNav = (path) => { navigate(path); setSidebarOpen(false); };

  const fullSidebarNav = isAdmin 
    ? sidebarNav 
    : sidebarNav.filter(item => item.path !== '/add-product');

  const visibleBottomNav = isAdmin 
    ? bottomNav 
    : bottomNav.filter(item => item.path !== '/add-product');

  return (
    <div className="h-screen bg-dark-900 flex overflow-hidden">
      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 z-40 flex flex-col
        bg-dark-800 border-r border-dark-500
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:flex lg:h-screen lg:sticky lg:top-0
      `}>
        {/* Logo */}
        <div className="sticky top-0 z-20 bg-dark-800 p-5 border-b border-dark-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.jpg" alt="TexTrack Logo" className="w-10 h-10 rounded-xl object-cover border border-silver/20 shadow-md" />
              <div>
                <p className="text-white font-extrabold text-xl tracking-tight leading-none">TexTrack</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-gray-500 hover:text-white">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-2">
          <p className="sticky top-0 z-10 bg-dark-800 text-[10px] text-gray-600 font-bold uppercase tracking-widest px-3 py-1 mb-2">Menu</p>
          {fullSidebarNav.map(({ path, label, icon: Icon }) => (
            <button key={path} onClick={() => handleNav(path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200
                ${isActive(path)
                  ? 'bg-gradient-to-r from-silver/15 to-transparent border border-silver/25 text-silver'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-dark-600'
                }`}>
              <Icon size={17} />
              <span className="font-medium text-sm">{label}</span>
              {isActive(path) && <ChevronRight size={13} className="ml-auto opacity-70" />}
            </button>
          ))}
        </nav>

        {/* User profile & Logout block integrated at bottom */}
        <div className="mt-auto p-3 border-t border-dark-500 bg-dark-850/30 shrink-0">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-gradient-to-r from-dark-600 to-dark-700/50 border border-dark-400/40">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0
              ${isAdmin ? 'bg-silver/15 text-silver border border-silver/30' : 'bg-silver-dark/15 text-silver-dark border border-silver-dark/30'}`}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate leading-tight">{user?.name}</p>
              <p className={`text-[10px] font-black uppercase tracking-wider mt-0.5 ${isAdmin ? 'text-silver' : 'text-silver-dark'}`}>
                {user?.role}
              </p>
            </div>
            <button onClick={logout} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0" title="Sign Out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-dark-900/90 backdrop-blur-xl border-b border-dark-600 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile: logo */}
            <div className="lg:hidden flex items-center gap-2">
              <img src="/logo.jpg" alt="Logo" className="w-6 h-6 rounded-md object-cover border border-silver/20" />
              <span className="font-bold text-white text-sm">TexTrack</span>
            </div>

            {/* Desktop: page title + subtitle */}
            <div className="hidden lg:block">
              <h1 className="text-base font-black text-white leading-none">
                {(() => {
                  const p = location.pathname;
                  if (p === '/dashboard') return 'Dashboard';
                  if (p === '/category') return 'Category';
                  if (p === '/products') return 'Product';
                  if (p === '/add-product') return 'Add Product';
                  if (p === '/profile') return 'Profile';
                  if (p === '/admin/users') return 'User Management';
                  if (p.startsWith('/admin')) return 'Admin Panel';
                  return 'TexTrack';
                })()}
              </h1>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                {(() => {
                  const p = location.pathname;
                  if (p === '/dashboard') return 'Overview & analytics';
                  if (p === '/category') return 'Manage product categories';
                  if (p === '/products') return 'Inventory management';
                  if (p === '/add-product') return 'Create new product';
                  if (p === '/profile') return 'Account settings';
                  if (p === '/admin/users') return 'Manage system users and access levels';
                  if (p.startsWith('/admin')) return 'Administrative settings';
                  return 'Textile Inventory System';
                })()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-dark-600 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-silver rounded-full" />
            </button>
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dark-700 border border-dark-500">
              <div className="w-6 h-6 rounded-lg bg-silver/15 text-silver flex items-center justify-center text-xs font-bold">
                {user?.name?.charAt(0)}
              </div>
              <span className="text-sm text-gray-300 font-medium">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto pb-28 lg:pb-6">
          {children}
        </main>

        {/* ── Bottom nav (mobile only) ── */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30">
          {/* Glass bar */}
          <div className="bg-dark-800/95 backdrop-blur-xl border-t border-dark-500 px-2 pt-2 pb-5">
            <div className="flex items-end justify-around relative">
              {visibleBottomNav.map(({ path, label, icon: Icon, isFab }) => {
                if (isFab) {
                  return (
                    <button key={path} onClick={() => handleNav(path)}
                      className="relative -top-6 flex flex-col items-center justify-center w-14 h-14 rounded-2xl
                        bg-gradient-to-br from-silver-dark to-dark-400 shadow-xl shadow-silver/20 border border-silver/30
                        transition-transform duration-200 active:scale-95 hover:scale-105">
                      <Icon size={24} className="text-white" strokeWidth={2.5} />
                    </button>
                  );
                }
                const active = isActive(path);
                return (
                  <button key={path} onClick={() => handleNav(path)}
                    className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-200
                      ${active ? 'text-silver' : 'text-gray-500 hover:text-gray-300'}`}>
                    <div className={`p-1.5 rounded-lg transition-all duration-200 ${active ? 'bg-silver/15' : ''}`}>
                      <Icon size={19} />
                    </div>
                    <span className={`text-[10px] font-semibold ${active ? 'text-silver' : 'text-gray-600'}`}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}

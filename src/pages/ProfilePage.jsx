import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getUsers, createUser, deleteUser, toggleUser } from '../api/api';
import {
  User, Phone, Shield, LogOut, ChevronRight,
  LayoutDashboard, Factory, TrendingDown, Shirt, Users,
  Plus, Loader2, X, Trash2, ToggleLeft, ToggleRight
} from 'lucide-react';

const CreateUserModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ name: '', mobile: '', password: '', role: 'user' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await createUser(form);
      onCreated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-dark-800 rounded-2xl border border-dark-400 w-full max-w-sm animate-slide-up shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-dark-500">
          <h2 className="font-black text-white text-base uppercase tracking-wider">Create User</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-dark-600 text-gray-400"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">{error}</div>}
          <div>
            <label className="block text-[10px] text-gray-500 mb-1.5 font-bold uppercase tracking-wider">Full Name *</label>
            <input type="text" required placeholder="e.g. Ravi Kumar" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-1.5 font-bold uppercase tracking-wider">Mobile Number *</label>
            <input type="tel" required placeholder="10 digit mobile" value={form.mobile}
              onChange={e => setForm({ ...form, mobile: e.target.value })} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-1.5 font-bold uppercase tracking-wider">Password *</label>
            <input type="text" required placeholder="Set password" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-1.5 font-bold uppercase tracking-wider">Role</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="input-field text-sm cursor-pointer">
              <option value="user" className="bg-dark-900 text-white">User</option>
              <option value="admin" className="bg-dark-900 text-white">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2 py-2.5">
              {loading ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function ProfilePage() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  // User Management State
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const fetchUsers = async () => {
    if (!isAdmin) return;
    setLoadingUsers(true);
    try {
      const { data } = await getUsers();
      // Filter out the currently logged in admin user
      const filtered = (data || []).filter(u => u.mobile !== user?.mobile);
      setUsers(filtered);
    } catch {}
    setLoadingUsers(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [isAdmin]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user permanently?')) return;
    await deleteUser(id);
    fetchUsers();
  };

  const handleToggle = async (id) => {
    await toggleUser(id);
    fetchUsers();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10 animate-fade-in">
      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onCreated={fetchUsers} />}

      <div className={`grid grid-cols-1 gap-6 items-start ${isAdmin ? 'lg:grid-cols-3' : 'max-w-md mx-auto'}`}>
        
        {/* Left Side: Unified Premium Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-b from-dark-850/60 to-dark-900/40 backdrop-blur-xl border border-dark-500 rounded-3xl p-6 shadow-2xl hover:border-silver/20 transition-colors duration-300 space-y-6">
            
            {/* Avatar & Header details */}
            <div className="flex flex-col items-center text-center gap-4 pb-6 border-b border-dark-600/40">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black bg-gradient-to-br from-silver-dark to-dark-600 border border-silver/20 text-white shadow-xl shadow-silver/5 transition-transform duration-300 hover:scale-105">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight leading-none">{user?.name}</h2>
                <span className="mt-2.5 inline-flex items-center px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-dark-850 text-white border border-dark-600">
                  {user?.role}
                </span>
              </div>
            </div>

            {/* Account Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between py-1 border-b border-dark-600/30">
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Mobile</span>
                <span className="text-sm font-semibold text-white">{user?.mobile}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Access</span>
                <div className="flex items-center gap-1.5">
                  <Shield size={12} className="text-gray-400" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Sign Out Button integrated inside the same card */}
            <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold text-sm transition-all duration-200 mt-2">
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>

        {/* Right Side: Integrated User Management Control Center (Only for Admins) */}
        {isAdmin && (
          <div className="lg:col-span-2 bg-gradient-to-b from-dark-850/60 to-dark-900/40 backdrop-blur-xl border border-dark-500 rounded-3xl p-6 shadow-2xl hover:border-silver/20 transition-all duration-300 space-y-6">
            
            {/* Header section with Create User button */}
            <div className="flex items-center justify-between pb-4 border-b border-dark-600/40">
              <div className="flex items-center gap-2.5">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">User Control Center</h2>
                <span className="text-[10px] bg-dark-600 text-white px-2.5 py-0.5 rounded-full font-black border border-dark-500">
                  {users.length}
                </span>
              </div>
              <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-1.5 py-2 text-xs font-bold px-3.5 rounded-xl shrink-0">
                <Plus size={14} /> Add
              </button>
            </div>

            {/* List block */}
            {loadingUsers ? (
              <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin text-silver" /></div>
            ) : users.length === 0 ? (
              <div className="border border-dark-600 rounded-2xl p-16 text-center text-gray-500 bg-dark-950/20">
                <Users size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-semibold">No users found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {users.map(u => (
                  <div key={u._id} className={`border border-dark-600 bg-dark-950/30 hover:border-silver/30 transition-all duration-300 rounded-2xl p-5 flex flex-col justify-between min-h-[145px] relative overflow-hidden group ${!u.active ? 'opacity-50' : ''}`}>
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-dark-800 border border-dark-600 flex items-center justify-center shrink-0 shadow-md transition-transform duration-300 group-hover:scale-105">
                          {u.role === 'admin' ? <Shield size={18} className="text-white" /> : <User size={18} className="text-gray-400" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-white text-base leading-tight truncate">{u.name}</p>
                          <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-1 font-medium">
                            <Phone size={10} /> {u.mobile}
                          </p>
                        </div>
                      </div>

                      {/* Disable & Delete controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => handleToggle(u._id)}
                          className={`p-1.5 rounded-xl transition-colors ${u.active ? 'text-gray-400 hover:text-white hover:bg-dark-800' : 'text-gray-600 hover:text-white hover:bg-dark-800'}`}
                          title={u.active ? 'Disable user' : 'Enable user'}>
                          {u.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                        </button>
                        <button onClick={() => handleDelete(u._id)} className="p-1.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-dark-600/30 pt-3.5 mt-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border
                        ${u.role === 'admin' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                        {u.role}
                      </span>
                      {!u.active && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
                          Disabled
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      <p className="text-center text-xs text-gray-700 py-8">
        TexTrack v1.0 · Built for garment excellence
      </p>
    </div>
  );
}

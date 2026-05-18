import { useState, useEffect } from 'react';
import { getUsers, createUser, deleteUser, toggleUser } from '../api/api';
import { Plus, Loader2, X, Trash2, ToggleLeft, ToggleRight, Users, Phone, Shield, User } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-dark-800 rounded-2xl border border-dark-400 w-full max-w-sm animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-dark-500">
          <h2 className="font-bold text-white text-lg">Create User</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-dark-600 text-gray-400"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">{error}</div>}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Full Name *</label>
            <input type="text" required placeholder="e.g. Ravi Kumar" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Mobile Number *</label>
            <input type="tel" required placeholder="10 digit mobile" value={form.mobile}
              onChange={e => setForm({ ...form, mobile: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Password *</label>
            <input type="text" required placeholder="Set password" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Role</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="input-field">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await getUsers();
      setUsers(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

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
    <div className="space-y-5 max-w-2xl mx-auto">
      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onCreated={fetchUsers} />}

      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs text-gray-500 font-medium">{users.length} users</span>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Create User
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-silver" /></div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p>No users found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map(u => (
            <div key={u._id} className={`card p-4 flex items-center gap-4 transition-all duration-200 ${!u.active ? 'opacity-50' : ''}`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
                ${u.role === 'admin' ? 'bg-silver/15 border border-silver/30' : 'bg-dark-600 border border-dark-400'}`}>
                {u.role === 'admin' ? <Shield size={18} className="text-silver" /> : <User size={18} className="text-gray-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{u.name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <Phone size={10} /> {u.mobile}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={u.role === 'admin' ? 'badge-green' : 'badge-blue'}>{u.role}</span>
                  {!u.active && <span className="badge-red">Disabled</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleToggle(u._id)}
                  className={`p-2 rounded-xl transition-colors ${u.active ? 'text-silver hover:bg-silver/10' : 'text-gray-500 hover:bg-dark-600'}`}
                  title={u.active ? 'Disable user' : 'Enable user'}>
                  {u.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>
                <button onClick={() => handleDelete(u._id)} className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

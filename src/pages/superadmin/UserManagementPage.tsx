import React, { useState } from 'react';
import { Users, Plus, Edit2, UserX, UserCheck, Search, Shield } from 'lucide-react';

const ROLES = ['super_admin', 'water_admin', 'water_cashier', 'driver', 'rb_manager', 'rb_cashier'];
const BUSINESSES = ['water_retail', 'rb', 'water_delivery'];

const mockUsers = [
  { id: '1', full_name: 'Jake Mwangi', email: 'jake@enterprise.co.ke', role: 'super_admin', business_id: null, status: 'active', last_login: '2 min ago' },
  { id: '2', full_name: 'Samuel Kariuki', email: 'samuel@enterprise.co.ke', role: 'water_admin', business_id: 'water_retail', status: 'active', last_login: '1 hr ago' },
  { id: '3', full_name: 'Janet Wanjiku', email: 'janet@enterprise.co.ke', role: 'water_cashier', business_id: 'water_retail', status: 'active', last_login: '30 min ago' },
  { id: '4', full_name: 'Peter Omondi', email: 'peter@enterprise.co.ke', role: 'water_cashier', business_id: 'water_retail', status: 'active', last_login: '45 min ago' },
  { id: '5', full_name: 'Brian Njoroge', email: 'brian@enterprise.co.ke', role: 'driver', business_id: 'water_delivery', status: 'active', last_login: '2 hr ago' },
  { id: '6', full_name: 'James Kiprop', email: 'james@enterprise.co.ke', role: 'driver', business_id: 'water_delivery', status: 'active', last_login: '3 hr ago' },
  { id: '7', full_name: 'Grace Auma', email: 'grace@enterprise.co.ke', role: 'rb_manager', business_id: 'rb', status: 'active', last_login: '20 min ago' },
  { id: '8', full_name: 'Alice Moraa', email: 'alice@enterprise.co.ke', role: 'rb_cashier', business_id: 'rb', status: 'active', last_login: '1 hr ago' },
  { id: '9', full_name: 'Bob Kimani', email: 'bob@enterprise.co.ke', role: 'rb_cashier', business_id: 'rb', status: 'inactive', last_login: '3 days ago' },
];

const roleColors: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-800',
  water_admin: 'bg-blue-100 text-blue-800',
  water_cashier: 'bg-cyan-100 text-cyan-800',
  driver: 'bg-green-100 text-green-800',
  rb_manager: 'bg-orange-100 text-orange-800',
  rb_cashier: 'bg-amber-100 text-amber-800',
};

export default function UserManagementPage() {
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'water_cashier', business_id: 'water_retail', shop_id: '' });

  const filtered = mockUsers.filter((u) => {
    const matchSearch = !search || u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !filterRole || u.role === filterRole;
    return matchSearch && matchRole;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 hero-admin rounded-xl flex items-center justify-center">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>User Management</h1>
            <p className="text-gray-500 text-sm">Manage all accounts across all businesses</p>
          </div>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn bg-gray-900 text-white hover:bg-gray-700 gap-2">
          <Plus size={16} /> Create User
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {ROLES.map((role) => {
          const count = mockUsers.filter((u) => u.role === role && u.status === 'active').length;
          return (
            <div key={role} className="card p-3 text-center">
              <p className="text-xl font-black text-gray-900">{count}</p>
              <p className={`badge text-[10px] mt-1 ${roleColors[role]}`}>{role.replace(/_/g, ' ')}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="input-field w-48">
          <option value="">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {/* Users table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {['Name', 'Email', 'Role', 'Business', 'Last Login', 'Status', 'Actions'].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                      user.role === 'super_admin' ? 'bg-gradient-to-br from-purple-600 to-purple-800' :
                      user.role.startsWith('water') ? 'bg-gradient-to-br from-blue-500 to-blue-700' :
                      user.role === 'driver' ? 'bg-gradient-to-br from-green-500 to-green-700' :
                      'bg-gradient-to-br from-orange-500 to-orange-700'
                    }`}>
                      {user.full_name.charAt(0)}
                    </div>
                    <span className="font-semibold text-sm text-gray-900">{user.full_name}</span>
                    {user.role === 'super_admin' && <Shield size={12} className="text-purple-500" />}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-600">{user.email}</td>
                <td className="px-5 py-3.5">
                  <span className={`badge ${roleColors[user.role]}`}>{user.role.replace(/_/g, ' ')}</span>
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-600 capitalize">{user.business_id?.replace(/_/g, ' ') || '—'}</td>
                <td className="px-5 py-3.5 text-sm text-gray-400">{user.last_login}</td>
                <td className="px-5 py-3.5">
                  <span className={`badge ${user.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <button className="w-8 h-8 bg-gray-100 hover:bg-blue-100 hover:text-blue-700 rounded-lg flex items-center justify-center transition-colors" title="Edit">
                      <Edit2 size={14} />
                    </button>
                    {user.role !== 'super_admin' && (
                      <button className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        user.status === 'active'
                          ? 'bg-gray-100 hover:bg-red-100 hover:text-red-700'
                          : 'bg-gray-100 hover:bg-green-100 hover:text-green-700'
                      }`} title={user.status === 'active' ? 'Deactivate' : 'Reactivate'}>
                        {user.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-black text-gray-900 mb-5">Create New User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Full Name</label>
                <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="input-field" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Email Address</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Temporary Password</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field" placeholder="Min 8 characters" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Role</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input-field">
                    {ROLES.filter((r) => r !== 'super_admin').map((r) => (
                      <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Business</label>
                  <select value={form.business_id} onChange={(e) => setForm({ ...form, business_id: e.target.value })} className="input-field">
                    {BUSINESSES.map((b) => <option key={b} value={b}>{b.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              </div>
              {form.role === 'rb_cashier' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 font-medium">
                  ⚠️ R&B allows maximum 6 cashiers. Current: {mockUsers.filter((u) => u.role === 'rb_cashier' && u.status === 'active').length} active.
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button className="flex-1 btn bg-gray-900 text-white hover:bg-gray-700 justify-center">Create Account</button>
                <button onClick={() => setShowCreateModal(false)} className="btn-ghost">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

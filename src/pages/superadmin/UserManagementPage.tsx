import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Edit2, UserX, UserCheck, Search, Shield,
  Building2, MapPin, Loader2, AlertCircle, RefreshCw, X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import toast from 'react-hot-toast';

type UserRole = 'water_admin' | 'water_cashier' | 'driver' | 'rb_manager' | 'rb_cashier';
type TabView = 'users' | 'branches';

interface Profile {
  id: string;
  full_name: string;
  role: string;
  business_id: string | null;
  shop_id: string | null;
  status: 'active' | 'inactive';
  last_login: string | null;
  email?: string;
}

interface Shop {
  id: string;
  name: string;
  location: string | null;
  business_id: string;
  status: 'active' | 'inactive';
  created_at: string;
}

const ROLES: UserRole[] = ['water_admin', 'water_cashier', 'driver', 'rb_manager', 'rb_cashier'];
const BUSINESSES = [
  { id: 'water_retail',   label: 'Water Retail' },
  { id: 'rb',             label: 'Restaurant & Butchery' },
  { id: 'water_delivery', label: 'Water Delivery' },
];
const ROLE_BUSINESS: Record<string, string> = {
  water_admin: 'water_retail', water_cashier: 'water_retail',
  driver: 'water_delivery', rb_manager: 'rb', rb_cashier: 'rb',
};
const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-800', water_admin: 'bg-blue-100 text-blue-800',
  water_cashier: 'bg-cyan-100 text-cyan-800',   driver: 'bg-green-100 text-green-800',
  rb_manager: 'bg-orange-100 text-orange-800',  rb_cashier: 'bg-amber-100 text-amber-800',
};
const BIZ_COLORS: Record<string, string> = {
  water_retail: 'bg-blue-50 text-blue-700 border-blue-200',
  rb: 'bg-orange-50 text-orange-700 border-orange-200',
  water_delivery: 'bg-green-50 text-green-700 border-green-200',
};

// ── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab() {
  const [profiles, setProfiles]   = useState<Profile[]>([]);
  const [shops, setShops]         = useState<Shop[]>([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch]       = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'water_cashier' as UserRole, business_id: 'water_retail', shop_id: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving]       = useState(false);
  const [editUser, setEditUser]   = useState<Profile | null>(null);
  const [editForm, setEditForm]   = useState({ full_name: '', role: '', business_id: '', shop_id: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setLoadError('');
    const [{ data: pData, error: pErr }, { data: sData }] = await Promise.all([
      supabase.from('profiles').select('*').order('full_name'),
      supabase.from('shops').select('*').order('name'),
    ]);
    if (pErr) { setLoadError(pErr.message); setLoading(false); return; }
    setProfiles((pData || []) as Profile[]);
    setShops((sData || []) as Shop[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRoleChange = (role: UserRole) => {
    const biz = ROLE_BUSINESS[role] || 'water_retail';
    setForm((p) => ({ ...p, role, business_id: biz, shop_id: '' }));
    setFormErrors((p) => ({ ...p, role: '', shop_id: '' }));
  };

  const shopsForBiz = shops.filter((s) => s.business_id === form.business_id && s.status === 'active');
  const rbActiveCashiers = profiles.filter((p) => p.role === 'rb_cashier' && p.status === 'active').length;

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = 'Full name is required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email is required';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (!form.shop_id) e.shop_id = 'Select a branch for this user';
    if (form.role === 'rb_cashier' && rbActiveCashiers >= 6) e.role = 'Maximum 6 R&B cashiers already active';
    return e;
  };

  const handleCreate = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true);
    try {
      // Use supabaseAdmin to create auth user (bypasses email confirmation)
      const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email: form.email.trim(), password: form.password, email_confirm: true,
      });
      if (authErr) throw new Error(authErr.message);
      // Insert profile — id comes from Supabase auth, everything else from form
      const { error: profErr } = await supabase.from('profiles').insert({
        id: authData.user.id,
        full_name: form.full_name.trim(),
        role: form.role,
        business_id: form.business_id,
        shop_id: form.shop_id || null,
        status: 'active',
      });
      if (profErr) throw new Error(profErr.message);
      toast.success(`${form.full_name} created and can log in immediately`);
      setShowCreate(false);
      setForm({ full_name: '', email: '', password: '', role: 'water_cashier', business_id: 'water_retail', shop_id: '' });
      setFormErrors({});
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create user');
    } finally { setSaving(false); }
  };

  const handleToggle = async (user: Profile) => {
    if (user.role === 'super_admin') return;
    setProcessing(user.id);
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', user.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`${user.full_name} ${newStatus === 'active' ? 'reactivated' : 'deactivated'}`);
      setProfiles((prev) => prev.map((p) => p.id === user.id ? { ...p, status: newStatus } : p));
    }
    setProcessing(null);
  };

  const openEdit = (user: Profile) => {
    setEditUser(user);
    setEditForm({ full_name: user.full_name, role: user.role, business_id: user.business_id || '', shop_id: user.shop_id || '' });
  };

  const handleEdit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!editUser || !editForm.full_name.trim()) { toast.error('Full name is required'); return; }
    setEditSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: editForm.full_name.trim(), role: editForm.role,
      business_id: editForm.business_id || null, shop_id: editForm.shop_id || null,
    }).eq('id', editUser.id);
    if (error) toast.error(error.message);
    else { toast.success('User updated'); setEditUser(null); load(); }
    setEditSaving(false);
  };

  const filtered = profiles.filter((u) => {
    const matchSearch = !search || u.full_name.toLowerCase().includes(search.toLowerCase()) || (u.email||'').toLowerCase().includes(search.toLowerCase());
    return matchSearch && (!roleFilter || u.role === roleFilter);
  });

  if (loading) return <div className="flex items-center justify-center py-20 gap-3"><Loader2 size={24} className="animate-spin text-blue-600" /><span className="text-gray-500">Loading users…</span></div>;
  if (loadError) return <div className="card p-5 bg-red-50 border-red-200 flex items-start gap-3"><AlertCircle size={18} className="text-red-600 mt-0.5 flex-shrink-0" /><div><p className="font-bold text-red-800">Failed to load</p><p className="text-sm text-red-600">{loadError}</p><button onClick={load} className="btn bg-red-600 text-white mt-3 text-sm gap-2"><RefreshCw size={13}/>Retry</button></div></div>;

  return (
    <div className="space-y-5">
      {/* Role count pills */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {['super_admin', ...ROLES].map((role) => (
          <div key={role} onClick={() => setRoleFilter(roleFilter === role ? '' : role)}
            className={`card p-3 text-center cursor-pointer hover:shadow-md transition-shadow ${roleFilter === role ? 'ring-2 ring-purple-400' : ''}`}>
            <p className="text-2xl font-black text-gray-900">{profiles.filter((u) => u.role === role && u.status === 'active').length}</p>
            <span className={`badge text-[10px] mt-1 ${ROLE_COLORS[role]||'bg-gray-100 text-gray-600'}`}>{role.replace(/_/g,' ')}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search name or email…" value={search} onChange={(e)=>setSearch(e.target.value)} className="input-field pl-9"/>
        </div>
        <select value={roleFilter} onChange={(e)=>setRoleFilter(e.target.value)} className="input-field w-44">
          <option value="">All Roles</option>
          {['super_admin',...ROLES].map((r)=><option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
        </select>
        <button onClick={load} className="btn-ghost gap-1.5 text-sm"><RefreshCw size={13}/>Refresh</button>
        <button onClick={()=>setShowCreate(true)} className="btn bg-gray-900 text-white hover:bg-gray-700 gap-2"><Plus size={15}/>Create User</button>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>{['Name','Role','Branch','Business','Status','Actions'].map((h)=>(
              <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {filtered.length===0&&<tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">No users found</td></tr>}
            {filtered.map((user)=>{
              const shop = shops.find((s)=>s.id===user.shop_id);
              return (
                <tr key={user.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${user.role==='super_admin'?'bg-gradient-to-br from-purple-600 to-purple-800':user.role.startsWith('water')?'bg-gradient-to-br from-blue-500 to-blue-700':user.role==='driver'?'bg-gradient-to-br from-green-500 to-green-700':'bg-gradient-to-br from-orange-500 to-orange-700'}`}>
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900 flex items-center gap-1.5">{user.full_name}{user.role==='super_admin'&&<Shield size={11} className="text-purple-500"/>}</p>
                        {user.email&&<p className="text-xs text-gray-400">{user.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><span className={`badge ${ROLE_COLORS[user.role]||'bg-gray-100 text-gray-600'}`}>{user.role.replace(/_/g,' ')}</span></td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{shop?<span className="flex items-center gap-1"><MapPin size={11} className="text-gray-400"/>{shop.name}</span>:<span className="text-gray-300">—</span>}</td>
                  <td className="px-5 py-3.5">{user.business_id?<span className={`badge border text-[10px] ${BIZ_COLORS[user.business_id]||'bg-gray-50 text-gray-600 border-gray-200'}`}>{user.business_id.replace(/_/g,' ')}</span>:<span className="text-gray-300 text-sm">—</span>}</td>
                  <td className="px-5 py-3.5"><span className={`badge ${user.status==='active'?'badge-active':'badge-inactive'}`}>{user.status}</span></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button onClick={()=>openEdit(user)} className="w-8 h-8 bg-gray-100 hover:bg-blue-100 hover:text-blue-700 rounded-lg flex items-center justify-center transition-colors"><Edit2 size={14}/></button>
                      {user.role!=='super_admin'&&(
                        <button onClick={()=>handleToggle(user)} disabled={processing===user.id} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 ${user.status==='active'?'bg-gray-100 hover:bg-red-100 hover:text-red-700':'bg-gray-100 hover:bg-green-100 hover:text-green-700'}`}>
                          {processing===user.id?<Loader2 size={13} className="animate-spin"/>:user.status==='active'?<UserX size={14}/>:<UserCheck size={14}/>}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* CREATE MODAL */}
      {showCreate&&(
        <div className="modal-overlay" onClick={()=>setShowCreate(false)}>
          <div className="modal-content p-6" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-gray-900">Create New User</h2>
              <button onClick={()=>setShowCreate(false)} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center"><X size={15}/></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Full Name <span className="text-red-500">*</span></label>
                <input value={form.full_name} onChange={(e)=>{setForm(p=>({...p,full_name:e.target.value}));setFormErrors(p=>({...p,full_name:''}));}} className={`input-field ${formErrors.full_name?'border-red-400':''}`} placeholder="e.g. Jane Wanjiku"/>
                {formErrors.full_name&&<p className="text-xs text-red-500 mt-1">{formErrors.full_name}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Email Address <span className="text-red-500">*</span></label>
                <input type="email" value={form.email} onChange={(e)=>{setForm(p=>({...p,email:e.target.value}));setFormErrors(p=>({...p,email:''}));}} className={`input-field ${formErrors.email?'border-red-400':''}`} placeholder="jane@example.com"/>
                {formErrors.email&&<p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Temporary Password <span className="text-red-500">*</span></label>
                <input type="password" value={form.password} onChange={(e)=>{setForm(p=>({...p,password:e.target.value}));setFormErrors(p=>({...p,password:''}));}} className={`input-field ${formErrors.password?'border-red-400':''}`} placeholder="Min 8 characters"/>
                {formErrors.password&&<p className="text-xs text-red-500 mt-1">{formErrors.password}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Role <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((r)=>(
                    <button key={r} type="button" onClick={()=>handleRoleChange(r)} className={`py-2.5 px-3 rounded-xl border-2 text-sm font-bold text-left transition-all ${form.role===r?`border-current ${ROLE_COLORS[r]}`:'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                      {r.replace(/_/g,' ')}
                    </button>
                  ))}
                </div>
                {formErrors.role&&<p className="text-xs text-red-500 mt-1">{formErrors.role}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Branch <span className="text-red-500">*</span></label>
                {shopsForBiz.length===0?(
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                    No branches for <strong>{BUSINESSES.find(b=>b.id===form.business_id)?.label}</strong> yet. Go to the Branches tab to create one first.
                  </div>
                ):(
                  <select value={form.shop_id} onChange={(e)=>{setForm(p=>({...p,shop_id:e.target.value}));setFormErrors(p=>({...p,shop_id:''}));}} className={`input-field ${formErrors.shop_id?'border-red-400':''}`}>
                    <option value="">Select branch…</option>
                    {shopsForBiz.map((s)=><option key={s.id} value={s.id}>{s.name}{s.location?` — ${s.location}`:''}</option>)}
                  </select>
                )}
                {formErrors.shop_id&&<p className="text-xs text-red-500 mt-1">{formErrors.shop_id}</p>}
                <p className="text-xs text-gray-400 mt-1">Business auto-set to <strong>{BUSINESSES.find(b=>b.id===form.business_id)?.label}</strong> based on role.</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
                User ID is auto-assigned by Supabase. The user can log in immediately with these credentials — no email confirmation required.
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving||(form.role==='rb_cashier'&&rbActiveCashiers>=6)} className="flex-1 btn bg-gray-900 text-white hover:bg-gray-700 justify-center gap-2 disabled:opacity-60">
                  {saving&&<Loader2 size={15} className="animate-spin"/>}
                  {saving?'Creating…':'Create Account'}
                </button>
                <button type="button" onClick={()=>setShowCreate(false)} className="btn-ghost">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editUser&&(
        <div className="modal-overlay" onClick={()=>setEditUser(null)}>
          <div className="modal-content p-6" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-gray-900">Edit User</h2>
              <button onClick={()=>setEditUser(null)} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center"><X size={15}/></button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Full Name</label>
                <input value={editForm.full_name} onChange={(e)=>setEditForm(p=>({...p,full_name:e.target.value}))} className="input-field"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Role</label>
                <select value={editForm.role} onChange={(e)=>{const r=e.target.value;setEditForm(p=>({...p,role:r,business_id:ROLE_BUSINESS[r]||p.business_id,shop_id:''}));}} className="input-field" disabled={editUser.role==='super_admin'}>
                  {['super_admin',...ROLES].map((r)=><option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Branch</label>
                <select value={editForm.shop_id} onChange={(e)=>setEditForm(p=>({...p,shop_id:e.target.value}))} className="input-field">
                  <option value="">No branch assigned</option>
                  {shops.filter((s)=>s.business_id===(ROLE_BUSINESS[editForm.role]||editForm.business_id)).map((s)=><option key={s.id} value={s.id}>{s.name}{s.location?` — ${s.location}`:''}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={editSaving} className="flex-1 btn bg-gray-900 text-white hover:bg-gray-700 justify-center gap-2 disabled:opacity-60">
                  {editSaving&&<Loader2 size={15} className="animate-spin"/>}{editSaving?'Saving…':'Save Changes'}
                </button>
                <button type="button" onClick={()=>setEditUser(null)} className="btn-ghost">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Branches Tab ─────────────────────────────────────────────────────────────
function BranchesTab() {
  const [shops, setShops]         = useState<Shop[]>([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', location: '', business_id: 'water_retail' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving]       = useState(false);
  const [editShop, setEditShop]   = useState<Shop | null>(null);
  const [editForm, setEditForm]   = useState({ name: '', location: '', business_id: '' });
  const [processing, setProcessing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setLoadError('');
    const { data, error } = await supabase.from('shops').select('*').order('business_id').order('name');
    if (error) { setLoadError(error.message); setLoading(false); return; }
    setShops((data || []) as Shop[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Branch name is required';
    if (Object.keys(e).length) { setFormErrors(e); return; }
    setSaving(true);
    const { error } = await supabase.from('shops').insert({
      name: form.name.trim(), location: form.location.trim() || null,
      business_id: form.business_id, status: 'active',
    });
    if (error) { toast.error(error.message); }
    else {
      toast.success(`Branch "${form.name}" created`);
      setShowCreate(false);
      setForm({ name: '', location: '', business_id: 'water_retail' });
      setFormErrors({});
      load();
    }
    setSaving(false);
  };

  const handleEdit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!editShop || !editForm.name.trim()) { toast.error('Branch name is required'); return; }
    setSaving(true);
    const { error } = await supabase.from('shops').update({ name: editForm.name.trim(), location: editForm.location.trim() || null, business_id: editForm.business_id }).eq('id', editShop.id);
    if (error) toast.error(error.message);
    else { toast.success('Branch updated'); setEditShop(null); load(); }
    setSaving(false);
  };

  const handleToggle = async (shop: Shop) => {
    setProcessing(shop.id);
    const newStatus = shop.status === 'active' ? 'inactive' : 'active';
    const { error } = await supabase.from('shops').update({ status: newStatus }).eq('id', shop.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`${shop.name} ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      setShops((prev) => prev.map((s) => s.id === shop.id ? { ...s, status: newStatus } : s));
    }
    setProcessing(null);
  };

  const grouped = BUSINESSES.map((biz) => ({ ...biz, shops: shops.filter((s) => s.business_id === biz.id) }));

  if (loading) return <div className="flex items-center justify-center py-20 gap-3"><Loader2 size={24} className="animate-spin text-blue-600"/><span className="text-gray-500">Loading branches…</span></div>;
  if (loadError) return <div className="card p-5 bg-red-50 border-red-200 flex items-start gap-3"><AlertCircle size={18} className="text-red-600 mt-0.5"/><div><p className="font-bold text-red-800">Failed to load</p><p className="text-sm text-red-600">{loadError}</p><button onClick={load} className="btn bg-red-600 text-white mt-3 text-sm gap-2"><RefreshCw size={13}/>Retry</button></div></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{shops.length} total · {shops.filter(s=>s.status==='active').length} active</p>
        <div className="flex gap-2">
          <button onClick={load} className="btn-ghost gap-1.5 text-sm"><RefreshCw size={13}/>Refresh</button>
          <button onClick={()=>setShowCreate(true)} className="btn bg-gray-900 text-white hover:bg-gray-700 gap-2"><Plus size={15}/>Add Branch</button>
        </div>
      </div>

      {grouped.map(({ id: bizId, label, shops: bizShops }) => (
        <div key={bizId} className="card overflow-hidden">
          <div className={`px-5 py-3 border-b flex items-center gap-3 ${BIZ_COLORS[bizId]} border`}>
            <Building2 size={15}/>
            <span className="font-black text-sm uppercase tracking-wider">{label}</span>
            <span className="ml-auto text-xs font-bold">{bizShops.filter(s=>s.status==='active').length} active</span>
          </div>
          {bizShops.length===0?(
            <div className="py-8 text-center text-gray-400 text-sm">No branches yet — click <strong>Add Branch</strong> above</div>
          ):(
            <table className="w-full">
              <thead className="bg-gray-50/60"><tr>
                {['Branch Name','Location','Status','Created','Actions'].map(h=><th key={h} className="text-left px-5 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>)}
              </tr></thead>
              <tbody>
                {bizShops.map((shop)=>(
                  <tr key={shop.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center"><Building2 size={13} className="text-gray-500"/></div>
                        <span className="font-semibold text-sm text-gray-900">{shop.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{shop.location?<span className="flex items-center gap-1"><MapPin size={11} className="text-gray-400"/>{shop.location}</span>:<span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-3.5"><span className={`badge ${shop.status==='active'?'badge-active':'badge-inactive'}`}>{shop.status}</span></td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">{new Date(shop.created_at).toLocaleDateString('en-KE',{day:'2-digit',month:'short',year:'numeric'})}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2">
                        <button onClick={()=>{setEditShop(shop);setEditForm({name:shop.name,location:shop.location||'',business_id:shop.business_id});}} className="w-8 h-8 bg-gray-100 hover:bg-blue-100 hover:text-blue-700 rounded-lg flex items-center justify-center"><Edit2 size={13}/></button>
                        <button onClick={()=>handleToggle(shop)} disabled={processing===shop.id} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 ${shop.status==='active'?'bg-gray-100 hover:bg-red-100 hover:text-red-700':'bg-gray-100 hover:bg-green-100 hover:text-green-700'}`}>
                          {processing===shop.id?<Loader2 size={13} className="animate-spin"/>:shop.status==='active'?<UserX size={13}/>:<UserCheck size={13}/>}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}

      {/* CREATE BRANCH MODAL */}
      {showCreate&&(
        <div className="modal-overlay" onClick={()=>setShowCreate(false)}>
          <div className="modal-content p-6" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-gray-900">Add New Branch</h2>
              <button onClick={()=>setShowCreate(false)} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center"><X size={15}/></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Branch Name <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={(e)=>{setForm(p=>({...p,name:e.target.value}));setFormErrors(p=>({...p,name:''}));}} className={`input-field ${formErrors.name?'border-red-400':''}`} placeholder="e.g. Milimani Branch"/>
                {formErrors.name&&<p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Location</label>
                <input value={form.location} onChange={(e)=>setForm(p=>({...p,location:e.target.value}))} className="input-field" placeholder="e.g. Milimani Estate, Nakuru"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Business Arm <span className="text-red-500">*</span></label>
                <div className="space-y-2">
                  {BUSINESSES.map((biz)=>(
                    <button key={biz.id} type="button" onClick={()=>setForm(p=>({...p,business_id:biz.id}))} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all ${form.business_id===biz.id?`border-current ${BIZ_COLORS[biz.id]}`:'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                      <Building2 size={15}/>{biz.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
                Branch ID is auto-assigned. Users can be assigned to this branch when creating or editing accounts.
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving} className="flex-1 btn bg-gray-900 text-white hover:bg-gray-700 justify-center gap-2 disabled:opacity-60">
                  {saving&&<Loader2 size={15} className="animate-spin"/>}{saving?'Creating…':'Create Branch'}
                </button>
                <button type="button" onClick={()=>setShowCreate(false)} className="btn-ghost">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT BRANCH MODAL */}
      {editShop&&(
        <div className="modal-overlay" onClick={()=>setEditShop(null)}>
          <div className="modal-content p-6" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-gray-900">Edit Branch</h2>
              <button onClick={()=>setEditShop(null)} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center"><X size={15}/></button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Branch Name</label>
                <input value={editForm.name} onChange={(e)=>setEditForm(p=>({...p,name:e.target.value}))} className="input-field"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Location</label>
                <input value={editForm.location} onChange={(e)=>setEditForm(p=>({...p,location:e.target.value}))} className="input-field" placeholder="e.g. Nakuru CBD"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Business Arm</label>
                <select value={editForm.business_id} onChange={(e)=>setEditForm(p=>({...p,business_id:e.target.value}))} className="input-field">
                  {BUSINESSES.map(b=><option key={b.id} value={b.id}>{b.label}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving} className="flex-1 btn bg-gray-900 text-white hover:bg-gray-700 justify-center gap-2 disabled:opacity-60">
                  {saving&&<Loader2 size={15} className="animate-spin"/>}{saving?'Saving…':'Save Changes'}
                </button>
                <button type="button" onClick={()=>setEditShop(null)} className="btn-ghost">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page wrapper ─────────────────────────────────────────────────────────────
export default function UserManagementPage() {
  const [tab, setTab] = useState<TabView>('users');
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 hero-admin rounded-xl flex items-center justify-center">
          {tab==='branches'?<Building2 size={20} className="text-white"/>:<Users size={20} className="text-white"/>}
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900" style={{fontFamily:"'Playfair Display',serif"}}>
            {tab==='branches'?'Branch Management':'User Management'}
          </h1>
          <p className="text-gray-500 text-sm">{tab==='branches'?'Create and manage shop branches':'All accounts across all businesses'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {([['users','👥 Users'],['branches','🏪 Branches']] as const).map(([t,label])=>(
          <button key={t} onClick={()=>setTab(t)} className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all -mb-px ${tab===t?'border-purple-600 text-purple-700':'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab==='users'?<UsersTab/>:<BranchesTab/>}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/firebase';
import {
    collection, getDocs, doc, updateDoc,
    serverTimestamp, addDoc, query, orderBy
} from 'firebase/firestore';
import {
    Users, PlusCircle, Trash2, Mail, AlertTriangle,
    CheckCircle2, Loader, Search, Eye, EyeOff, ShieldOff,
    Settings, ShieldCheck, HeartPulse
} from 'lucide-react';

const ROLES = ['admin', 'doctor', 'nurse', 'patient'];
const ROLE_BADGE = { admin: 'badge-purple', doctor: 'badge-blue', nurse: 'badge-emerald', patient: 'badge-amber' };

const AdminUserManagement = () => {
    const { createUser, currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    // Inline delete confirmation: stores userId pending confirmation
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '',
        password: '', role: 'doctor', specialization: '', department: ''
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
            setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) {
            console.error(e);
            setError('Failed to load users. Please refresh.');
        }
        setLoading(false);
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleCreate = async (e) => {
        e.preventDefault();
        if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        setFormLoading(true); setError('');
        try {
            await createUser(form.email, form.password, {
                firstName: form.firstName,
                lastName: form.lastName,
                role: form.role,
                specialization: form.specialization,
                department: form.department,
            });
            await addDoc(collection(db, 'auditLogs'), {
                userId: currentUser.uid,
                action: 'CREATE_USER',
                resourceId: form.email,
                details: `Created ${form.role} account: ${form.email}`,
                timestamp: serverTimestamp(),
            });
            setSuccess(`User ${form.firstName} ${form.lastName} created!`);
            setShowForm(false);
            setForm({ firstName: '', lastName: '', email: '', password: '', role: 'doctor', specialization: '', department: '' });
            fetchUsers();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(err.message || 'Failed to create user.');
        } finally {
            setFormLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await updateDoc(doc(db, 'users', userId), { role: newRole, updatedAt: serverTimestamp() });
            await addDoc(collection(db, 'auditLogs'), {
                userId: currentUser.uid,
                action: 'CHANGE_ROLE',
                resourceId: userId,
                details: `Role changed to ${newRole}`,
                timestamp: serverTimestamp(),
            });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (err) {
            console.error(err);
            setError('Failed to update role. Please try again.');
            setTimeout(() => setError(''), 4000);
        }
    };

    const handleDisable = async (userId, email) => {
        if (userId === currentUser.uid) {
            setError("You cannot disable your own account.");
            setTimeout(() => setError(''), 4000);
            setDeleteConfirmId(null);
            return;
        }
        try {
            await updateDoc(doc(db, 'users', userId), { disabled: true, updatedAt: serverTimestamp() });
            await addDoc(collection(db, 'auditLogs'), {
                userId: currentUser.uid,
                action: 'DISABLE_USER',
                resourceId: userId,
                details: `Account disabled: ${email}`,
                timestamp: serverTimestamp(),
            });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, disabled: true } : u));
            setSuccess(`Account for ${email} has been disabled.`);
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            console.error(err);
            setError('Failed to disable user. Please try again.');
            setTimeout(() => setError(''), 4000);
        } finally {
            setDeleteConfirmId(null);
        }
    };

    const handleEnable = async (userId) => {
        try {
            await updateDoc(doc(db, 'users', userId), { disabled: false, updatedAt: serverTimestamp() });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, disabled: false } : u));
            setSuccess('Account re-enabled.');
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError('Failed to re-enable user.');
            setTimeout(() => setError(''), 4000);
        }
    };

    const filtered = users.filter(u =>
        `${u.firstName} ${u.lastName} ${u.email} ${u.role}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 font-display tracking-tight flex items-center gap-2">
                        <Users className="w-6 h-6 text-brand-500" />
                        User Management
                    </h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium">{users.length} total accounts registered</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className={showForm ? 'btn-secondary' : 'btn-primary shadow-md shadow-brand-500/20'}>
                    <PlusCircle className="w-4 h-4" />
                    {showForm ? 'Cancel Creation' : 'Create New User'}
                </button>
            </div>

            {error && <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3"><AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" /><p className="text-rose-600 font-medium text-sm">{error}</p></div>}
            {success && <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /><p className="text-emerald-600 font-medium text-sm">{success}</p></div>}

            {/* Create User Form */}
            {showForm && (
                <div className="card border-brand-100 shadow-lg shadow-brand-500/5 animate-slide-up relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-400 to-teal-400" />
                    <div className="mb-6 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                            <PlusCircle className="w-5 h-5 text-brand-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Create New Account</h2>
                            <p className="text-xs font-medium text-slate-500">Add a new staff member or patient</p>
                        </div>
                    </div>

                    <form onSubmit={handleCreate} className="space-y-5 relative z-10">
                        <div className="grid sm:grid-cols-2 gap-5">
                            <div><label className="label">First Name *</label><input name="firstName" value={form.firstName} onChange={handleChange} className="input" placeholder="John" required /></div>
                            <div><label className="label">Last Name *</label><input name="lastName" value={form.lastName} onChange={handleChange} className="input" placeholder="Doe" required /></div>
                        </div>
                        <div><label className="label">Email Address *</label><input name="email" type="email" value={form.email} onChange={handleChange} className="input" placeholder="user@hospital.com" required /></div>
                        <div>
                            <label className="label">Temporary Password *</label>
                            <div className="relative group">
                                <input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange} className="input pr-10" placeholder="Minimum 6 characters" required />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-brand-500 transition-colors">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="label">Account Role *</label>
                            <select name="role" value={form.role} onChange={handleChange} className="input font-medium text-slate-700">
                                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                            </select>
                        </div>
                        {form.role === 'doctor' && (
                            <div className="grid sm:grid-cols-2 gap-5 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <div><label className="label flex items-center gap-1.5"><HeartPulse className="w-3.5 h-3.5 text-brand-500" />Specialization</label><input name="specialization" value={form.specialization} onChange={handleChange} className="input bg-white" placeholder="e.g. Cardiology" /></div>
                                <div><label className="label flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-blue-500" />Department</label><input name="department" value={form.department} onChange={handleChange} className="input bg-white" placeholder="e.g. ICU" /></div>
                            </div>
                        )}
                        <div className="pt-2">
                            <button type="submit" disabled={formLoading} className="btn-primary w-full h-12 justify-center text-[15px] shadow-md shadow-brand-500/20">
                                {formLoading ? <><Loader className="w-5 h-5 animate-spin" />Creating Account...</> : <><PlusCircle className="w-5 h-5" />Create Account</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* User Table */}
            <div className="card p-0 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative max-w-md group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input pl-10 bg-white" placeholder="Search by name, email, or role..." />
                    </div>
                </div>

                {loading ? (
                    <div className="p-5 space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />)}</div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-12"><Users className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-sm font-medium text-slate-500">No users found matching your search</p></div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filtered.map(user => (
                            <div key={user.id} className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 transition-all hover:bg-slate-50/80 ${user.disabled ? 'bg-rose-50/30' : ''}`}>
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border ${user.disabled ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-brand-50 border-brand-100 text-brand-600'}`}>
                                        <span className="text-sm font-bold">{user.firstName?.[0]}{user.lastName?.[0]}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className={`text-sm font-bold truncate ${user.disabled ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{user.firstName} {user.lastName}</p>
                                            <span className={`${ROLE_BADGE[user.role] || 'badge-gray'} shadow-sm`}>{user.role}</span>
                                            {user.disabled && <span className="badge font-bold bg-rose-100 text-rose-700 border border-rose-200">Disabled</span>}
                                            {user.id === currentUser.uid && <span className="badge font-bold bg-slate-800 text-white shadow-sm border border-slate-900">You</span>}
                                        </div>
                                        <p className="text-xs font-medium text-slate-500 truncate mt-0.5">{user.email}</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                {deleteConfirmId === user.id ? (
                                    <div className="flex items-center gap-2 shrink-0 bg-rose-50 p-2 rounded-xl border border-rose-100">
                                        <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wide mr-1">Confirm disable?</span>
                                        <button
                                            onClick={() => handleDisable(user.id, user.email)}
                                            className="text-xs px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors shadow-sm shadow-rose-600/20"
                                        >
                                            Yes
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirmId(null)}
                                            className="text-xs px-3 py-1.5 bg-white text-slate-600 border border-slate-200 font-bold rounded-lg transition-colors hover:bg-slate-50 hover:text-slate-900"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className="relative group/select">
                                            <select
                                                value={user.role}
                                                onChange={e => handleRoleChange(user.id, e.target.value)}
                                                disabled={user.disabled}
                                                className="appearance-none bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 disabled:opacity-50 disabled:bg-slate-50 cursor-pointer shadow-sm transition-all"
                                            >
                                                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                                            </select>
                                            <Settings className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within/select:text-brand-500 transition-colors" />
                                        </div>

                                        {user.disabled ? (
                                            <button
                                                onClick={() => handleEnable(user.id)}
                                                className="p-2 text-emerald-600 bg-emerald-50 border border-emerald-100 hover:bg-emerald-500 hover:text-white rounded-lg transition-all shadow-sm tooltip-trigger"
                                                title="Re-enable account"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    if (user.id === currentUser.uid) {
                                                        setError("You cannot disable your own account.");
                                                        setTimeout(() => setError(''), 4000);
                                                        return;
                                                    }
                                                    setDeleteConfirmId(user.id);
                                                }}
                                                className="p-2 text-rose-500 bg-white border border-rose-100 hover:bg-rose-500 hover:text-white hover:border-rose-500 rounded-lg transition-all shadow-sm tooltip-trigger drop-shadow-sm"
                                                title="Disable account"
                                            >
                                                <ShieldOff className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUserManagement;

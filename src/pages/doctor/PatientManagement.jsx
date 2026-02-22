import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/firebase';
import {
    collection, addDoc, updateDoc, deleteDoc, doc,
    getDocs, query, where, serverTimestamp
} from 'firebase/firestore';
import {
    Users, Plus, Search, Edit3, Trash2, X, Save,
    Loader, AlertCircle, CheckCircle2, User, Phone,
    Mail, Droplets, Calendar, Heart, FileText, ChevronDown
} from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Other'];

const emptyForm = {
    firstName: '', lastName: '', dob: '', gender: '', bloodGroup: '',
    phone: '', email: '', medicalHistory: '', allergies: '', emergencyContact: '',
};

const PatientManagement = () => {
    const { currentUser } = useAuth();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [expandedId, setExpandedId] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const fetchPatients = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const q = query(collection(db, 'patients'), where('assignedDoctorId', '==', currentUser.uid));
            const snap = await getDocs(q);
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            list.sort((a, b) => {
                const ta = a.createdAt?.toMillis?.() || 0;
                const tb = b.createdAt?.toMillis?.() || 0;
                return tb - ta;
            });
            setPatients(list);
        } catch (err) {
            console.error(err);
            setError('Failed to load patients.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPatients(); }, [currentUser]);

    const filteredPatients = useMemo(() => {
        if (!searchQuery.trim()) return patients;
        const q = searchQuery.toLowerCase();
        return patients.filter(p =>
            `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
            p.email?.toLowerCase().includes(q) ||
            p.phone?.includes(q) ||
            p.bloodGroup?.toLowerCase().includes(q)
        );
    }, [patients, searchQuery]);

    const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const openAddForm = () => {
        setForm(emptyForm);
        setEditingId(null);
        setShowForm(true);
        setError('');
    };

    const openEditForm = (patient) => {
        setForm({
            firstName: patient.firstName || '',
            lastName: patient.lastName || '',
            dob: patient.dob || '',
            gender: patient.gender || '',
            bloodGroup: patient.bloodGroup || '',
            phone: patient.phone || '',
            email: patient.email || '',
            medicalHistory: patient.medicalHistory || '',
            allergies: patient.allergies || '',
            emergencyContact: patient.emergencyContact || '',
        });
        setEditingId(patient.id);
        setShowForm(true);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.firstName.trim() || !form.lastName.trim()) {
            setError('First name and last name are required.');
            return;
        }
        if (!form.gender) { setError('Gender is required.'); return; }

        setSaving(true);
        setError('');
        try {
            const data = {
                ...form,
                assignedDoctorId: currentUser.uid,
                updatedAt: serverTimestamp(),
            };
            if (editingId) {
                await updateDoc(doc(db, 'patients', editingId), data);
                setSuccess('Patient updated successfully!');
            } else {
                data.createdAt = serverTimestamp();
                await addDoc(collection(db, 'patients'), data);
                setSuccess('Patient added successfully!');
            }
            setShowForm(false);
            setEditingId(null);
            setForm(emptyForm);
            await fetchPatients();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            console.error(err);
            setError('Failed to save patient. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, 'patients', id));
            setDeleteConfirm(null);
            setSuccess('Patient removed.');
            await fetchPatients();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            console.error(err);
            setError('Failed to delete patient.');
        }
    };

    const calculateAge = (dob) => {
        if (!dob) return '—';
        const birth = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    };

    return (
        <div className="space-y-5 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-brand-400" />
                        Patient Management
                    </h1>
                    <p className="text-sm text-gray-400 mt-0.5">{patients.length} patient{patients.length !== 1 ? 's' : ''} assigned to you</p>
                </div>
                <button onClick={openAddForm} className="btn-primary">
                    <Plus className="w-4 h-4" /> Add Patient
                </button>
            </div>

            {/* Notifications */}
            {error && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <p className="text-red-400 text-sm flex-1">{error}</p>
                    <button onClick={() => setError('')} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
                </div>
            )}
            {success && (
                <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3">
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                    <p className="text-green-400 text-sm">{success}</p>
                </div>
            )}

            {/* Add/Edit Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowForm(false); setEditingId(null); }} />
                    <div className="relative z-10 w-full max-w-lg bg-hospital-card border border-hospital-border rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-hospital-border">
                            <h2 className="text-base font-semibold text-white flex items-center gap-2">
                                {editingId ? <Edit3 className="w-4 h-4 text-brand-400" /> : <Plus className="w-4 h-4 text-brand-400" />}
                                {editingId ? 'Edit Patient' : 'Add New Patient'}
                            </h2>
                            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-gray-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">First Name *</label>
                                    <input name="firstName" value={form.firstName} onChange={handleChange} className="input" placeholder="John" required />
                                </div>
                                <div>
                                    <label className="label">Last Name *</label>
                                    <input name="lastName" value={form.lastName} onChange={handleChange} className="input" placeholder="Doe" required />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Date of Birth</label>
                                    <input type="date" name="dob" value={form.dob} onChange={handleChange} className="input" />
                                </div>
                                <div>
                                    <label className="label">Gender *</label>
                                    <select name="gender" value={form.gender} onChange={handleChange} className="input" required>
                                        <option value="">Select</option>
                                        {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Blood Group</label>
                                    <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange} className="input">
                                        <option value="">Select</option>
                                        {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Phone</label>
                                    <input name="phone" value={form.phone} onChange={handleChange} className="input" placeholder="+91 9876543210" />
                                </div>
                            </div>
                            <div>
                                <label className="label">Email</label>
                                <input type="email" name="email" value={form.email} onChange={handleChange} className="input" placeholder="patient@email.com" />
                            </div>
                            <div>
                                <label className="label">Emergency Contact</label>
                                <input name="emergencyContact" value={form.emergencyContact} onChange={handleChange} className="input" placeholder="Name — Phone" />
                            </div>
                            <div>
                                <label className="label">Allergies</label>
                                <textarea name="allergies" value={form.allergies} onChange={handleChange} rows={2} className="input resize-none" placeholder="Penicillin, Peanuts..." />
                            </div>
                            <div>
                                <label className="label">Medical History</label>
                                <textarea name="medicalHistory" value={form.medicalHistory} onChange={handleChange} rows={3} className="input resize-none" placeholder="Diabetes Type 2, Hypertension..." />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-secondary flex-1 justify-center">Cancel</button>
                                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                                    {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {editingId ? 'Update' : 'Add Patient'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
                    <div className="relative z-10 w-full max-w-sm bg-hospital-card border border-hospital-border rounded-2xl shadow-2xl p-6 animate-fade-in text-center">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-5 h-5 text-red-400" />
                        </div>
                        <h3 className="text-base font-semibold text-white mb-1">Remove Patient?</h3>
                        <p className="text-sm text-gray-400 mb-5">This will permanently delete this patient record.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
                            <button onClick={() => handleDelete(deleteConfirm)} className="btn-danger flex-1 justify-center">
                                <Trash2 className="w-4 h-4" /> Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search patients by name, email, phone, or blood group..."
                    className="input pl-10"
                />
            </div>

            {/* Patient List */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-hospital-card border border-hospital-border rounded-xl animate-pulse" />)}
                </div>
            ) : filteredPatients.length === 0 ? (
                <div className="card text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-4">
                        <Users className="w-7 h-7 text-brand-400" />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-1">
                        {searchQuery ? 'No matching patients' : 'No patients yet'}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                        {searchQuery ? 'Try adjusting your search query.' : 'Start by adding your first patient.'}
                    </p>
                    {!searchQuery && (
                        <button onClick={openAddForm} className="btn-primary mx-auto">
                            <Plus className="w-4 h-4" /> Add Your First Patient
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredPatients.map(p => (
                        <div key={p.id} className="card p-0 overflow-hidden">
                            {/* Patient Row */}
                            <div
                                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                                onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shrink-0 shadow-lg shadow-green-500/10">
                                    <span className="text-xs font-bold text-white">{p.firstName?.[0]}{p.lastName?.[0]}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white">{p.firstName} {p.lastName}</p>
                                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                        {p.gender && <span className="text-xs text-gray-500">{p.gender}</span>}
                                        {p.dob && <span className="text-xs text-gray-500">Age {calculateAge(p.dob)}</span>}
                                        {p.bloodGroup && <span className="badge-red text-[10px]"><Droplets className="w-2.5 h-2.5" />{p.bloodGroup}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openEditForm(p); }}
                                        className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-brand-400 transition-colors"
                                        title="Edit patient"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(p.id); }}
                                        className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                                        title="Delete patient"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${expandedId === p.id ? 'rotate-180' : ''}`} />
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedId === p.id && (
                                <div className="px-4 pb-4 pt-0 border-t border-hospital-border animate-fade-in">
                                    <div className="grid sm:grid-cols-2 gap-3 pt-4">
                                        {p.phone && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Phone className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                                <span className="text-gray-300">{p.phone}</span>
                                            </div>
                                        )}
                                        {p.email && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Mail className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                                <span className="text-gray-300">{p.email}</span>
                                            </div>
                                        )}
                                        {p.dob && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Calendar className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                                <span className="text-gray-300">DOB: {p.dob}</span>
                                            </div>
                                        )}
                                        {p.emergencyContact && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Heart className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                                <span className="text-gray-300">Emergency: {p.emergencyContact}</span>
                                            </div>
                                        )}
                                    </div>
                                    {p.allergies && (
                                        <div className="mt-3">
                                            <p className="text-xs font-medium text-yellow-400 mb-1">⚠️ Allergies</p>
                                            <p className="text-sm text-gray-400 bg-yellow-500/5 border border-yellow-500/10 rounded-lg px-3 py-2">{p.allergies}</p>
                                        </div>
                                    )}
                                    {p.medicalHistory && (
                                        <div className="mt-3">
                                            <p className="text-xs font-medium text-gray-400 mb-1 flex items-center gap-1">
                                                <FileText className="w-3 h-3" /> Medical History
                                            </p>
                                            <p className="text-sm text-gray-400 bg-white/[0.02] border border-hospital-border rounded-lg px-3 py-2">{p.medicalHistory}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PatientManagement;

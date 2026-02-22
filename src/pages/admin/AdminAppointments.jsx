import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/firebase';
import {
    collection, query, where, getDocs, addDoc,
    updateDoc, doc, serverTimestamp, orderBy
} from 'firebase/firestore';
import {
    Calendar, Clock, Users, Plus, Trash2, CheckCircle2,
    AlertCircle, Loader, X, LayoutDashboard, User
} from 'lucide-react';

const STATUS_BADGE = {
    available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    booked: 'bg-blue-50 text-blue-700 border-blue-200',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
};

const AdminAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSlotForm, setShowSlotForm] = useState(false);
    const [slotForm, setSlotForm] = useState({ doctorId: '', date: '', time: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('appointments');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [apptSnap, doctorsSnap, slotsSnap] = await Promise.all([
                getDocs(query(collection(db, 'appointments'), orderBy('createdAt', 'desc'))),
                getDocs(query(collection(db, 'users'), where('role', '==', 'doctor'))),
                getDocs(collection(db, 'availability_slots')),
            ]);

            const doctorList = doctorsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const doctorMap = {};
            doctorList.forEach(d => doctorMap[d.uid || d.id] = `Dr. ${d.firstName} ${d.lastName}`);

            // Also get patient names for appointments
            const apptList = apptSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const patientIds = [...new Set(apptList.map(a => a.patientId).filter(Boolean))];
            const patientMap = {};
            if (patientIds.length > 0) {
                const pSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'patient')));
                pSnap.docs.forEach(d => { patientMap[d.id] = `${d.data().firstName} ${d.data().lastName}`; });
            }

            setDoctors(doctorList);
            setAppointments(apptList.map(a => ({
                ...a,
                doctorName: doctorMap[a.doctorId] || 'Unknown Doctor',
                patientName: patientMap[a.patientId] || 'Unknown Patient',
            })));
            setSlots(slotsSnap.docs.map(d => ({
                ...d.data(), id: d.id,
                doctorName: doctorMap[d.data().doctorId] || 'Doctor',
            })).sort((a, b) => a.date.localeCompare(b.date)));
        } catch (err) {
            console.error(err);
            setError('Failed to load data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleCreateSlot = async (e) => {
        e.preventDefault();
        if (!slotForm.doctorId || !slotForm.date || !slotForm.time) {
            setError('All fields are required.'); return;
        }
        setSaving(true); setError('');
        try {
            await addDoc(collection(db, 'availability_slots'), {
                ...slotForm,
                isBooked: false,
                createdAt: serverTimestamp(),
            });
            setShowSlotForm(false);
            setSlotForm({ doctorId: '', date: '', time: '' });
            setSuccess('Slot created!');
            setTimeout(() => setSuccess(''), 3000);
            fetchData();
        } catch (err) {
            setError('Failed to create slot.');
        } finally {
            setSaving(false);
        }
    };

    const cancelAppointment = async (id) => {
        try {
            await updateDoc(doc(db, 'appointments', id), { status: 'cancelled' });
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
        } catch (err) {
            setError('Failed to cancel appointment.');
        }
    };

    const formatDate = (str) => {
        if (!str) return '—';
        const d = new Date(str);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 card bg-white border-white shadow-soft">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 font-display tracking-tight flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-brand-500" />
                        Appointment Management
                    </h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Manage doctor availability and patient bookings</p>
                </div>
                <button onClick={() => setShowSlotForm(true)} className="btn-primary shrink-0">
                    <Plus className="w-4 h-4" /> Create Slot
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <p className="text-sm text-rose-600 font-medium flex-1">{error}</p>
                    <button onClick={() => setError('')}><X className="w-4 h-4 text-rose-400" /></button>
                </div>
            )}
            {success && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <p className="text-sm text-emerald-600 font-medium">{success}</p>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
                {[
                    { key: 'appointments', label: 'Appointments', count: appointments.length },
                    { key: 'slots', label: 'Available Slots', count: slots.filter(s => !s.isBooked).length },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {tab.label}
                        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-md font-bold ${activeTab === tab.key ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-500'}`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white border border-slate-100 rounded-2xl animate-pulse" />)}</div>
            ) : activeTab === 'appointments' ? (
                <div className="card space-y-3">
                    {appointments.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">No appointments yet</p>
                        </div>
                    ) : appointments.map(a => (
                        <div key={a.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                                <User className="w-5 h-5 text-brand-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900">{a.patientName}</p>
                                <p className="text-xs text-slate-500 font-medium">{a.doctorName} · {formatDate(a.date)} at {a.time}</p>
                            </div>
                            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${STATUS_BADGE[a.status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                {a.status || 'pending'}
                            </span>
                            {a.status !== 'cancelled' && (
                                <button
                                    onClick={() => cancelAppointment(a.id)}
                                    className="p-2 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
                                    title="Cancel appointment"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card space-y-3">
                    {slots.filter(s => !s.isBooked).length === 0 ? (
                        <div className="text-center py-12">
                            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">No available slots. Create one above.</p>
                        </div>
                    ) : slots.filter(s => !s.isBooked).map(s => (
                        <div key={s.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                                <Clock className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-slate-900">{s.doctorName}</p>
                                <p className="text-xs text-slate-500 font-medium">{formatDate(s.date)} at {s.time}</p>
                            </div>
                            <span className="text-xs font-bold px-3 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                                Available
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Slot Modal */}
            {showSlotForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowSlotForm(false)} />
                    <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in border border-slate-100">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Plus className="w-4 h-4 text-brand-500" /> Create Appointment Slot
                            </h2>
                            <button onClick={() => setShowSlotForm(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateSlot} className="p-6 space-y-4">
                            <div>
                                <label className="label">Select Doctor *</label>
                                <select
                                    className="input"
                                    value={slotForm.doctorId}
                                    onChange={e => setSlotForm(p => ({ ...p, doctorId: e.target.value }))}
                                    required
                                >
                                    <option value="">-- Choose Doctor --</option>
                                    {doctors.map(d => (
                                        <option key={d.id} value={d.uid || d.id}>
                                            Dr. {d.firstName} {d.lastName} {d.specialization ? `· ${d.specialization}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Date *</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={slotForm.date}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={e => setSlotForm(p => ({ ...p, date: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Time *</label>
                                    <input
                                        type="time"
                                        className="input"
                                        value={slotForm.time}
                                        onChange={e => setSlotForm(p => ({ ...p, time: e.target.value }))}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowSlotForm(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                                    {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    Create Slot
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAppointments;

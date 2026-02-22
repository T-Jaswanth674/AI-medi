import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { Calendar, Clock, User, CheckCircle2, AlertCircle, X } from 'lucide-react';

const DoctorAppointments = () => {
    const { currentUser } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!currentUser) return;
        const fetchData = async () => {
            try {
                const apptSnap = await getDocs(
                    query(collection(db, 'appointments'), where('doctorId', '==', currentUser.uid))
                );
                const apptList = apptSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                apptList.sort((a, b) => a.date.localeCompare(b.date));

                // Load patient names
                const patientIds = [...new Set(apptList.map(a => a.patientId).filter(Boolean))];
                const patientMap = {};
                await Promise.all(patientIds.map(async pid => {
                    try {
                        const pSnap = await getDocs(query(collection(db, 'patients'), where('__name__', '==', pid)));
                        if (!pSnap.empty) {
                            const d = pSnap.docs[0].data();
                            patientMap[pid] = `${d.firstName} ${d.lastName}`;
                        }
                    } catch { /* ignore */ }
                }));

                // Also try users collection
                const userSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'patient')));
                userSnap.docs.forEach(d => {
                    const uid = d.data().uid || d.id;
                    if (!patientMap[uid]) patientMap[uid] = `${d.data().firstName} ${d.data().lastName}`;
                });

                setAppointments(apptList.map(a => ({
                    ...a,
                    patientName: patientMap[a.patientId] || 'Patient',
                })));
            } catch (err) {
                console.error(err);
                setError('Failed to load appointments.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentUser]);

    const markComplete = async (id) => {
        try {
            await updateDoc(doc(db, 'appointments', id), { status: 'completed' });
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'completed' } : a));
        } catch (err) { setError('Failed to update appointment.'); }
    };

    const formatDate = (str) => {
        if (!str) return '—';
        return new Date(str + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
    };

    const STATUS_COLOR = {
        booked: 'bg-blue-50 text-blue-700 border-blue-200',
        completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
    };

    const upcoming = appointments.filter(a => a.status === 'booked');
    const past = appointments.filter(a => a.status !== 'booked');

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 font-display tracking-tight flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-brand-500" />
                    My Appointments
                </h1>
                <p className="text-sm text-slate-500 mt-1 font-medium">{upcoming.length} upcoming appointment{upcoming.length !== 1 ? 's' : ''}</p>
            </div>

            {error && (
                <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <p className="text-sm text-rose-600 font-medium flex-1">{error}</p>
                    <button onClick={() => setError('')}><X className="w-4 h-4 text-rose-400" /></button>
                </div>
            )}

            {loading ? (
                <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white border border-slate-100 rounded-2xl animate-pulse" />)}</div>
            ) : appointments.length === 0 ? (
                <div className="card text-center py-16 border-dashed border-2 border-slate-200">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-700 mb-1">No Appointments Yet</h3>
                    <p className="text-sm text-slate-500 font-medium">Patients can book appointments via their portal.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {upcoming.length > 0 && (
                        <div>
                            <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-brand-500" /> Upcoming
                            </h2>
                            <div className="space-y-3">
                                {upcoming.map(a => (
                                    <div key={a.id} className="card p-5 flex items-center gap-4 border-slate-200 hover:border-brand-200 transition-colors">
                                        <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                                            <User className="w-6 h-6 text-brand-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-base font-bold text-slate-900">{a.patientName}</p>
                                            <p className="text-sm text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                                                <Calendar className="w-3.5 h-3.5" /> {formatDate(a.date)}
                                                <span className="text-slate-300">·</span>
                                                <Clock className="w-3.5 h-3.5" /> {a.time}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold px-3 py-1.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">Confirmed</span>
                                            <button
                                                onClick={() => markComplete(a.id)}
                                                className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 transition-colors"
                                                title="Mark as completed"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {past.length > 0 && (
                        <div>
                            <h2 className="text-base font-bold text-slate-700 mb-3">Past Appointments</h2>
                            <div className="space-y-2">
                                {past.map(a => (
                                    <div key={a.id} className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                            <User className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-700">{a.patientName}</p>
                                            <p className="text-xs text-slate-500 font-medium">{formatDate(a.date)} at {a.time}</p>
                                        </div>
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${STATUS_COLOR[a.status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                            {a.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DoctorAppointments;

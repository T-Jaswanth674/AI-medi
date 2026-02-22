import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/firebase';
import { collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import {
    Search, ClipboardList, Users, ArrowRight, AlertCircle,
    HeartPulse, Calendar, CheckCircle2
} from 'lucide-react';

const NurseDashboard = () => {
    const { userProfile } = useAuth();
    const [patients, setPatients] = useState([]);
    const [todayNotesCount, setTodayNotesCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [patientsSnap, notesSnap] = await Promise.all([
                    getDocs(collection(db, 'patients')),
                    getDocs(collection(db, 'nurse_notes')),
                ]);
                const allPatients = patientsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                allPatients.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
                setPatients(allPatients);

                // Count today's notes
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayCount = notesSnap.docs.filter(d => {
                    const ts = d.data().timestamp;
                    if (!ts) return false;
                    const noteDate = ts.toDate ? ts.toDate() : new Date(ts);
                    return noteDate >= today;
                }).length;
                setTodayNotesCount(todayCount);
            } catch (err) {
                console.error(err);
                setError('Failed to load ward data. Please refresh.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredPatients = patients.filter(p => {
        const term = searchTerm.toLowerCase();
        return (
            `${p.firstName} ${p.lastName}`.toLowerCase().includes(term) ||
            (p.phone && p.phone.includes(term)) ||
            (p.email && p.email.toLowerCase().includes(term))
        );
    });

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good Morning';
        if (h < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="space-y-6 animate-fade-in relative">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl border border-transparent bg-gradient-to-br from-brand-600 to-teal-700 p-8 shadow-soft">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-teal-300/20 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6 z-10">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/30">
                            <HeartPulse className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-brand-100 font-medium mb-1 tracking-wide uppercase">{greeting()}</p>
                            <h1 className="text-2xl font-bold text-white font-display tracking-tight">{userProfile?.firstName} {userProfile?.lastName}</h1>
                            <p className="text-sm text-teal-100 font-medium mt-1 opacity-90">Nursing Station</p>
                        </div>
                    </div>
                    <Link to="/nurse/notes" className="btn-primary !bg-white !text-brand-700 hover:!bg-brand-50 shadow-md relative z-10">
                        <ClipboardList className="w-4 h-4" />
                        Write Note
                    </Link>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    <p className="text-rose-600 text-sm font-medium flex-1">{error}</p>
                    <button onClick={() => window.location.reload()} className="text-xs text-rose-600 bg-rose-100/50 hover:bg-rose-200 px-3 py-1.5 rounded-lg transition-colors font-semibold">Retry</button>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
                {[
                    { icon: Users, label: 'Total Patients', value: patients.length, bg: 'bg-blue-50', color: 'text-blue-600' },
                    { icon: ClipboardList, label: 'Notes Today', value: todayNotesCount, bg: 'bg-purple-50', color: 'text-purple-600' },
                ].map(({ icon: Icon, label, value, bg, color }) => (
                    <div key={label} className="stat-card !border-white !bg-white">
                        <div className="flex items-start justify-between">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-slate-100 ${bg}`}>
                                <Icon className={`w-6 h-6 ${color}`} />
                            </div>
                        </div>
                        <div>
                            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{loading ? '—' : value}</p>
                            <p className="text-sm font-medium text-slate-500 mt-1">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Patient Search */}
            <div className="card h-full flex flex-col p-6 border-slate-200">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Search className="w-5 h-5 text-brand-500" />
                        Patient Search
                    </h2>
                    <Link to="/nurse/notes" className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 group">
                        Write Note <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>
                <div className="relative mb-4 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                    <input
                        type="text"
                        className="input pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white"
                        placeholder="Search patients by name, phone, or email..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                {loading ? (
                    <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />)}</div>
                ) : filteredPatients.length === 0 ? (
                    <div className="text-center py-10 my-auto">
                        <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3">
                            <Users className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-500 font-medium">
                            {searchTerm ? 'No patients matched your search' : 'No patients in system'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-80">
                        {filteredPatients.map(p => (
                            <Link
                                key={p.id}
                                to="/nurse/notes"
                                className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100"
                            >
                                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 font-bold border border-emerald-100 flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105">
                                    <span className="text-sm">{p.firstName?.[0]}{p.lastName?.[0]}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 transition-colors group-hover:text-brand-600">{p.firstName} {p.lastName}</p>
                                    <p className="text-xs font-medium text-slate-500 mt-0.5">{p.gender}{p.bloodGroup ? ` · ${p.bloodGroup}` : ''}</p>
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-purple-50 hover:bg-purple-100 flex items-center justify-center text-purple-500 transition-colors">
                                    <ClipboardList className="w-4 h-4" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="card p-6 border-slate-200">
                <h2 className="text-base font-bold text-slate-900 mb-5">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { to: '/nurse/notes', icon: ClipboardList, label: 'Nurse Notes', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
                        { to: '/nurse', icon: Search, label: 'Find Patient', color: 'text-brand-600', bg: 'bg-brand-50 border-brand-100' },
                    ].map(({ to, icon: Icon, label, color, bg }) => (
                        <Link key={to} to={to}
                            className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${bg} group`}>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-sm transition-transform group-hover:scale-110">
                                <Icon className={`w-6 h-6 ${color}`} />
                            </div>
                            <span className={`text-sm font-bold ${color}`}>{label}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default NurseDashboard;

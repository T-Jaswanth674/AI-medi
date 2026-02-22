import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import {
    FileText, Calendar, CheckCircle2, Clock,
    AlertCircle, ChevronRight, Brain, ClipboardList,
    FileCheck, User
} from 'lucide-react';

const PatientPortal = () => {
    const { currentUser } = useAuth();
    const [patient, setPatient] = useState(null);
    const [reports, setReports] = useState([]);
    const [nurseNotes, setNurseNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!currentUser) return;
        const fetchData = async () => {
            try {
                const pSnap = await getDocs(query(collection(db, 'patients'), where('uid', '==', currentUser.uid)));
                if (pSnap.empty) { setLoading(false); return; }
                const patientDoc = { id: pSnap.docs[0].id, ...pSnap.docs[0].data() };
                setPatient(patientDoc);

                const [reportsSnap, notesSnap] = await Promise.all([
                    getDocs(query(collection(db, 'reports'), where('patientId', '==', patientDoc.id), where('status', '==', 'approved'))),
                    getDocs(query(collection(db, 'nurse_notes'), where('patientId', '==', patientDoc.id))),
                ]);

                const reportList = reportsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                reportList.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
                setReports(reportList);

                const noteList = notesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                noteList.sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0));
                setNurseNotes(noteList);
            } catch (err) {
                console.error(err);
                setError('Failed to load your health records. Please refresh.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentUser]);

    const formatDate = (ts) => {
        if (!ts) return '—';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-48 bg-slate-100 rounded-3xl" />
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="h-32 bg-slate-100 rounded-2xl" />
                    <div className="h-32 bg-slate-100 rounded-2xl" />
                </div>
                <div className="h-64 bg-slate-100 rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-teal-700 p-7 shadow-soft">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-300/20 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
                <div className="relative z-10">
                    <p className="text-sm text-teal-100 font-medium mb-1 uppercase tracking-wide">Patient Portal</p>
                    <h1 className="text-2xl font-bold text-white font-display tracking-tight mb-0.5">
                        Hello, {patient?.firstName || 'Patient'} 👋
                    </h1>
                    {patient && (
                        <p className="text-sm text-teal-100 font-medium">
                            {patient.gender}
                            {patient.bloodGroup ? ` · Blood: ${patient.bloodGroup}` : ''}
                            {patient.phone ? ` · ${patient.phone}` : ''}
                        </p>
                    )}
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    <p className="text-rose-600 text-sm font-medium">{error}</p>
                </div>
            )}

            {!patient && !error && (
                <div className="card text-center py-16 border-dashed border-2 border-slate-200">
                    <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-700 mb-2">Account Not Linked</h3>
                    <p className="text-sm text-slate-500 max-w-xs mx-auto">
                        Your account hasn't been linked to a patient record yet. Please contact your care provider.
                    </p>
                </div>
            )}

            {patient && (
                <>
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="stat-card !border-white !bg-white">
                            <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-brand-500" />
                            </div>
                            <div>
                                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{reports.length}</p>
                                <p className="text-sm font-medium text-slate-500 mt-1">Discharge Reports</p>
                            </div>
                        </div>
                        <div className="stat-card !border-white !bg-white">
                            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center">
                                <ClipboardList className="w-6 h-6 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{nurseNotes.length}</p>
                                <p className="text-sm font-medium text-slate-500 mt-1">Nurse Notes</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { to: '/patient/reports', icon: FileText, label: 'My Reports', sub: `${reports.length} approved`, color: 'from-brand-500 to-brand-700' },
                            { to: '/patient/appointments', icon: Calendar, label: 'Appointments', sub: 'Book & manage', color: 'from-teal-500 to-teal-700' },
                        ].map(({ to, icon: Icon, label, sub, color }) => (
                            <Link key={to} to={to}
                                className="relative overflow-hidden flex flex-col gap-3 p-5 rounded-2xl bg-white border border-slate-200 hover:border-brand-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
                            >
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{label}</p>
                                    <p className="text-xs text-slate-500 font-medium">{sub}</p>
                                </div>
                                <ChevronRight className="absolute bottom-4 right-4 w-4 h-4 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
                            </Link>
                        ))}
                    </div>

                    {/* Recent Reports */}
                    <div className="card p-6 border-slate-200">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-brand-500" />
                                Recent Reports
                            </h2>
                            <Link to="/patient/reports" className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 group">
                                View all <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>
                        {reports.length === 0 ? (
                            <div className="text-center py-8">
                                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm text-slate-500 font-medium">No approved reports yet</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {reports.slice(0, 3).map(r => (
                                    <div key={r.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                        <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                                            {r.isAiGenerated ? <Brain className="w-5 h-5 text-brand-500" /> : <FileCheck className="w-5 h-5 text-amber-600" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-800 truncate">
                                                {r.generatedContent?.diagnosis || 'Discharge Summary'}
                                            </p>
                                            <p className="text-xs text-slate-500 font-medium">{formatDate(r.createdAt)}</p>
                                        </div>
                                        <span className="badge-green shadow-sm"><CheckCircle2 className="w-3 h-3" />Approved</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Nurse Notes */}
                    <div className="card p-6 border-slate-200">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <ClipboardList className="w-5 h-5 text-purple-500" />
                                Nurse Notes
                            </h2>
                            <span className="text-xs font-bold text-white bg-purple-500 rounded-full px-2 py-0.5">{nurseNotes.length}</span>
                        </div>
                        {nurseNotes.length === 0 ? (
                            <div className="text-center py-8">
                                <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm text-slate-500 font-medium">No nurse notes recorded yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                                {nurseNotes.map(n => (
                                    <div key={n.id} className="bg-purple-50/50 border border-purple-100 rounded-2xl p-4">
                                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{n.note}</p>
                                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-purple-100">
                                            <User className="w-3.5 h-3.5 text-purple-400" />
                                            <p className="text-xs text-slate-500 font-semibold">{n.nurseName || 'Nursing Staff'}</p>
                                            <span className="text-slate-300">·</span>
                                            <p className="text-xs text-slate-400 font-medium">{formatDate(n.timestamp)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default PatientPortal;

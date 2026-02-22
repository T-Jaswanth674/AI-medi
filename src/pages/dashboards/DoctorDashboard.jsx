import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
    Users, FilePlus, FileCheck, Clock, CheckCircle2,
    AlertCircle, Brain, ArrowRight, PlusCircle, Activity,
    TrendingUp, Sparkles, Stethoscope, Calendar
} from 'lucide-react';

const DoctorDashboard = () => {
    const { userProfile, currentUser } = useAuth();
    const [stats, setStats] = useState({ patients: 0, drafts: 0, approved: 0, pending: 0 });
    const [recentPatients, setRecentPatients] = useState([]);
    const [recentReports, setRecentReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = async () => {
        if (!currentUser) return;
        setLoading(true);
        setError('');
        try {
            const [patientsSnap, reportsSnap] = await Promise.all([
                getDocs(query(collection(db, 'patients'), where('assignedDoctorId', '==', currentUser.uid))),
                getDocs(query(collection(db, 'reports'), where('doctorId', '==', currentUser.uid))),
            ]);

            const patientsList = patientsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const allReportsList = reportsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            allReportsList.sort((a, b) => {
                const ta = a.createdAt?.toMillis?.() || 0;
                const tb = b.createdAt?.toMillis?.() || 0;
                return tb - ta;
            });

            setRecentPatients(patientsList.slice(0, 5));
            setRecentReports(allReportsList.slice(0, 5));
            setStats({
                patients: patientsList.length,
                drafts: allReportsList.filter(r => r.status === 'draft').length,
                approved: allReportsList.filter(r => r.status === 'approved').length,
                pending: allReportsList.filter(r => r.status === 'pending_approval').length,
            });
        } catch (err) {
            console.error(err);
            setError('Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentUser]);

    const STATUS_BADGE = {
        draft: 'badge-gray',
        pending_approval: 'badge-yellow',
        approved: 'badge-green',
    };

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good Morning';
        if (h < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const formatDate = (ts) => {
        if (!ts) return '';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    };

    return (
        <div className="space-y-6 animate-fade-in relative">
            {/* Welcome Header */}
            <div className="relative overflow-hidden rounded-3xl border border-transparent bg-gradient-to-br from-brand-600 to-teal-700 p-8 shadow-soft">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-teal-300/20 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6 z-10">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/30">
                            <Stethoscope className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-brand-100 font-medium mb-1 tracking-wide uppercase">{greeting()}</p>
                            <h1 className="text-2xl font-bold text-white font-display tracking-tight">Dr. {userProfile?.firstName} {userProfile?.lastName}</h1>
                            <p className="text-sm text-teal-100 font-medium mt-1 opacity-90">{userProfile?.specialization || 'General Medicine'}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Link to="/doctor/patients" className="btn-secondary !bg-white/10 !border-white/20 !text-white hover:!bg-white/20 shadow-none">
                            <PlusCircle className="w-4 h-4" />
                            Add Patient
                        </Link>
                        <Link to="/doctor/new-report" className="btn-primary !bg-white !text-brand-700 hover:!bg-brand-50 shadow-md">
                            <Brain className="w-4 h-4 text-brand-600" />
                            Generate Report
                        </Link>
                    </div>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    <p className="text-rose-600 text-sm font-medium flex-1">{error}</p>
                    <button onClick={fetchData} className="text-xs text-rose-600 hover:text-rose-700 bg-rose-100/50 hover:bg-rose-200 px-3 py-1.5 rounded-lg transition-colors font-semibold">Retry</button>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[
                    { icon: Users, label: 'My Patients', value: stats.patients, bg: 'bg-blue-50', color: 'text-blue-600', link: '/doctor/patients' },
                    { icon: Clock, label: 'Drafts', value: stats.drafts, bg: 'bg-slate-50', color: 'text-slate-600', link: '/doctor/reports' },
                    { icon: AlertCircle, label: 'Pending Approval', value: stats.pending, bg: 'bg-amber-50', color: 'text-amber-600', link: '/doctor/reports' },
                    { icon: CheckCircle2, label: 'Approved', value: stats.approved, bg: 'bg-emerald-50', color: 'text-emerald-600', link: '/doctor/reports' },
                ].map(({ icon: Icon, label, value, bg, color, link }) => (
                    <Link key={label} to={link} className="stat-card !border-white !bg-white">
                        <div className="flex items-start justify-between">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-slate-100 ${bg}`}>
                                <Icon className={`w-6 h-6 ${color}`} />
                            </div>
                        </div>
                        <div>
                            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{loading ? '—' : value}</p>
                            <p className="text-sm font-medium text-slate-500 mt-1">{label}</p>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { icon: PlusCircle, label: 'Add New Patient', desc: 'Register a patient profile', to: '/doctor/patients', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100 shrink-0' },
                    { icon: Brain, label: 'AI Report Generator', desc: 'Create semantic summaries', to: '/doctor/new-report', color: 'text-brand-600', bg: 'bg-brand-50 border-brand-100 shrink-0' },
                    { icon: FileCheck, label: 'Review Reports', desc: 'Check pending approvals', to: '/doctor/reports', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100 shrink-0' },
                ].map(({ icon: Icon, label, desc, to, color, bg }) => (
                    <Link key={to} to={to} className="card p-5 border-slate-200 hover:border-brand-200 transition-all duration-300 flex items-center gap-4 group bg-white">
                        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-110 ${bg}`}>
                            <Icon className={`w-6 h-6 ${color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{label}</p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">{desc}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-brand-500 transition-colors" />
                    </Link>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Patients */}
                <div className="card h-full flex flex-col p-6 border-slate-200">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Users className="w-5 h-5 text-brand-500" />
                            My Patients
                        </h2>
                        <Link to="/doctor/patients" className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 group">
                            View all <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                    {loading ? (
                        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />)}</div>
                    ) : recentPatients.length === 0 ? (
                        <div className="text-center py-10 my-auto">
                            <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3">
                                <Users className="w-8 h-8 text-slate-400" />
                            </div>
                            <p className="text-sm text-slate-500 font-medium mb-1">No patients assigned</p>
                            <Link to="/doctor/patients" className="btn-secondary !py-2 mt-4 text-xs"><PlusCircle className="w-4 h-4" /> Add Patient</Link>
                        </div>
                    ) : (
                        <div className="space-y-2 flex-1">
                            {recentPatients.map(p => (
                                <Link key={p.id} to="/doctor/patients" className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100">
                                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 font-bold border border-emerald-100 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                                        <span className="text-sm">{p.firstName?.[0]}{p.lastName?.[0]}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800 group-hover:text-brand-600 transition-colors">{p.firstName} {p.lastName}</p>
                                        <p className="text-xs font-medium text-slate-500 mt-0.5">{p.gender}{p.bloodGroup ? ` · ${p.bloodGroup}` : ''}</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition-colors" />
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Reports */}
                <div className="card h-full flex flex-col p-6 border-slate-200">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <FileCheck className="w-5 h-5 text-brand-500" />
                            Recent Reports
                        </h2>
                        <Link to="/doctor/reports" className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 group">
                            View all <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                    {loading ? (
                        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />)}</div>
                    ) : recentReports.length === 0 ? (
                        <div className="text-center py-10 my-auto">
                            <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3">
                                <FilePlus className="w-8 h-8 text-slate-400" />
                            </div>
                            <p className="text-sm text-slate-500 font-medium mb-1">No reports yet</p>
                            <Link to="/doctor/new-report" className="btn-primary !py-2 mt-4 text-xs"><Brain className="w-4 h-4" /> Generate Report</Link>
                        </div>
                    ) : (
                        <div className="space-y-2 flex-1">
                            {recentReports.map(r => (
                                <Link key={r.id} to="/doctor/reports" className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border transition-transform group-hover:scale-105 ${r.isAiGenerated ? 'bg-brand-50 border-brand-100' : 'bg-amber-50 border-amber-100'
                                        }`}>
                                        {r.isAiGenerated ? <Brain className="w-5 h-5 text-brand-600" /> : <FileCheck className="w-5 h-5 text-amber-600" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800 truncate group-hover:text-brand-600 transition-colors">
                                            {typeof r.generatedContent?.diagnosis === 'string'
                                                ? r.generatedContent.diagnosis.slice(0, 50)
                                                : 'Discharge Summary'}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className={STATUS_BADGE[r.status] || 'badge-gray'}>{r.status?.replace('_', ' ')}</span>
                                            {r.isAiGenerated && <span className="text-[10px] uppercase font-bold text-brand-600 tracking-wider">AI Generated</span>}
                                            <span className="text-xs font-medium text-slate-400">{formatDate(r.createdAt)}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* AI Generation CTA */}
            <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-r from-brand-50 via-white to-brand-50 p-8 shadow-sm group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-200/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl transition-transform duration-700 group-hover:scale-110" />
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-teal-500 flex items-center justify-center shadow-lg shadow-brand-500/30 ring-4 ring-white">
                            <Sparkles className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight">AI Discharge Report Generator</h3>
                            <p className="text-sm font-medium text-slate-500 mt-1">Powered by Google Gemini AI · Intelligent contextual summaries</p>
                        </div>
                    </div>
                    <Link to="/doctor/new-report" className="btn-primary shrink-0 shadow-lg shadow-brand-500/20 px-6 py-3">
                        <Sparkles className="w-4 h-4" />
                        Start Generation <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default DoctorDashboard;

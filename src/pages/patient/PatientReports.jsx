import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import {
    FileText, Calendar, CheckCircle2, Brain, ChevronDown,
    AlertCircle, FileCheck, Clock, Info
} from 'lucide-react';

const PatientReports = () => {
    const { currentUser } = useAuth();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        if (!currentUser) return;
        const fetchData = async () => {
            try {
                const patientSnap = await getDocs(query(collection(db, 'patients'), where('uid', '==', currentUser.uid)));
                if (patientSnap.empty) { setLoading(false); return; }
                const patientId = patientSnap.docs[0].id;

                const reportsSnap = await getDocs(query(
                    collection(db, 'reports'),
                    where('patientId', '==', patientId),
                    where('status', '==', 'approved')
                ));
                const list = reportsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                list.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
                setReports(list);
            } catch (err) {
                console.error(err);
                setError('Failed to load reports.');
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

    const renderContent = (val) => {
        if (!val) return '—';
        if (typeof val === 'string') return val;
        if (Array.isArray(val)) return val.map((v, i) => `${i + 1}. ${v}`).join('\n');
        return JSON.stringify(val, null, 2);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 font-display tracking-tight flex items-center gap-2">
                    <FileText className="w-6 h-6 text-brand-500" />
                    My Discharge Reports
                </h1>
                <p className="text-sm text-slate-500 mt-1 font-medium">
                    {reports.length} approved report{reports.length !== 1 ? 's' : ''} on file
                </p>
            </div>

            {error && (
                <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    <p className="text-rose-600 text-sm font-medium">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white border border-slate-100 rounded-2xl animate-pulse" />)}</div>
            ) : reports.length === 0 ? (
                <div className="card text-center py-16 border-dashed border-2 border-slate-200">
                    <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-brand-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-1">No Reports Yet</h3>
                    <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto">
                        Your approved discharge reports will appear here once your doctor generates and approves them.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reports.map(r => (
                        <div key={r.id} className="card p-0 overflow-hidden border-slate-200 hover:border-brand-200 transition-colors duration-300">
                            <div
                                className="flex items-center gap-4 p-5 cursor-pointer hover:bg-slate-50/80 transition-colors"
                                onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${r.isAiGenerated ? 'bg-brand-50 border border-brand-100' : 'bg-amber-50 border border-amber-100'}`}>
                                    {r.isAiGenerated ? <Brain className="w-6 h-6 text-brand-500" /> : <FileCheck className="w-6 h-6 text-amber-600" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-base font-bold text-slate-900 truncate">
                                        {r.generatedContent?.diagnosis || 'Discharge Summary'}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                        <span className="badge-green shadow-sm"><CheckCircle2 className="w-3 h-3" />Approved</span>
                                        {r.isAiGenerated && <span className="badge text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-100"><Brain className="w-2.5 h-2.5" />AI</span>}
                                        {r.admissionDate && <span className="text-xs text-slate-400 font-medium flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(r.admissionDate)} — {formatDate(r.dischargeDate)}</span>}
                                    </div>
                                </div>
                                <div className="shrink-0 flex items-center gap-3">
                                    <p className="text-sm font-bold text-slate-600 hidden sm:block">{formatDate(r.createdAt)}</p>
                                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedId === r.id ? 'rotate-180 text-brand-500' : ''}`} />
                                </div>
                            </div>

                            {expandedId === r.id && (
                                <div className="border-t border-slate-100 bg-slate-50/80 p-6 animate-fade-in space-y-4">
                                    {r.finalContent ? (
                                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-brand-500" />
                                                <h4 className="text-sm font-bold text-slate-700">Full Discharge Summary</h4>
                                            </div>
                                            <div className="p-5">
                                                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed max-h-[500px] overflow-y-auto custom-scrollbar">{r.finalContent}</pre>
                                            </div>
                                        </div>
                                    ) : r.generatedContent ? (
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            {[
                                                { label: 'Diagnosis', val: r.generatedContent.diagnosis, color: 'border-brand-100 bg-brand-50/50' },
                                                { label: 'Treatment', val: r.generatedContent.treatment, color: 'border-slate-100' },
                                                { label: 'Medications', val: r.generatedContent.medications, color: 'border-emerald-100 bg-emerald-50/30' },
                                                { label: 'Follow-Up', val: r.generatedContent.followUp, color: 'border-amber-100 bg-amber-50/30' },
                                                { label: 'Advice', val: r.generatedContent.advice, color: 'col-span-2 border-slate-100' },
                                            ].filter(s => s.val).map(({ label, val, color }) => (
                                                <div key={label} className={`bg-white border rounded-2xl p-4 shadow-sm ${color}`}>
                                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
                                                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{renderContent(val)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500 text-center py-4">No report content available.</p>
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

export default PatientReports;

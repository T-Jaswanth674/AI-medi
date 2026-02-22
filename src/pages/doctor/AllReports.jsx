import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import {
    FileText, Search, Filter, Brain, Info, Clock,
    CheckCircle2, AlertCircle, ChevronDown, Eye, User,
    Calendar, FileCheck, Loader
} from 'lucide-react';

const STATUS_CONFIG = {
    draft: { label: 'Draft', badge: 'badge-gray', icon: Clock },
    pending_approval: { label: 'Pending', badge: 'badge-amber', icon: AlertCircle },
    approved: { label: 'Approved', badge: 'badge-emerald', icon: CheckCircle2 },
};

const AllReports = () => {
    const { currentUser } = useAuth();
    const [reports, setReports] = useState([]);
    const [patients, setPatients] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [expandedId, setExpandedId] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) return;
            try {
                const reportsSnap = await getDocs(
                    query(collection(db, 'reports'), where('doctorId', '==', currentUser.uid))
                );
                const reportsList = reportsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                reportsList.sort((a, b) => {
                    const ta = a.createdAt?.toMillis?.() || 0;
                    const tb = b.createdAt?.toMillis?.() || 0;
                    return tb - ta;
                });
                setReports(reportsList);

                // Fetch patient names for each unique patientId
                const patientIds = [...new Set(reportsList.map(r => r.patientId).filter(Boolean))];
                const patientMap = {};
                await Promise.all(patientIds.map(async (pid) => {
                    try {
                        const pDoc = await getDoc(doc(db, 'patients', pid));
                        if (pDoc.exists()) {
                            const d = pDoc.data();
                            patientMap[pid] = `${d.firstName} ${d.lastName}`;
                        }
                    } catch { /* ignore */ }
                }));
                setPatients(patientMap);
            } catch (err) {
                console.error(err);
                setError('Failed to load reports.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentUser]);

    const filteredReports = useMemo(() => {
        let results = reports;
        if (statusFilter !== 'all') {
            results = results.filter(r => r.status === statusFilter);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            results = results.filter(r =>
                (patients[r.patientId] || '').toLowerCase().includes(q) ||
                (r.generatedContent?.summary || r.generatedContent?.['1. summary'] || '').toLowerCase().includes(q) ||
                (r.generatedContent?.diagnosis || r.generatedContent?.['2. diagnosis'] || '').toLowerCase().includes(q)
            );
        }
        return results;
    }, [reports, statusFilter, searchQuery, patients]);

    const formatDate = (ts) => {
        if (!ts) return '—';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const statusCounts = useMemo(() => {
        const counts = { all: reports.length, draft: 0, pending_approval: 0, approved: 0 };
        reports.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });
        return counts;
    }, [reports]);

    return (
        <div className="space-y-6 animate-fade-in relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 font-display tracking-tight flex items-center gap-2">
                        <FileText className="w-6 h-6 text-brand-500" />
                        All Reports
                    </h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium">{reports.length} report{reports.length !== 1 ? 's' : ''} generated</p>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 shadow-sm">
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    <p className="text-rose-600 text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search by patient name, diagnosis..."
                        className="input pl-10 bg-white"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'draft', label: 'Drafts' },
                        { key: 'pending_approval', label: 'Pending' },
                        { key: 'approved', label: 'Approved' },
                    ].map(f => (
                        <button
                            key={f.key}
                            onClick={() => setStatusFilter(f.key)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border shadow-sm ${statusFilter === f.key
                                ? 'bg-brand-50 text-brand-600 border-brand-200 shadow-brand-500/10'
                                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                        >
                            {f.label} <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${statusFilter === f.key ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500'}`}>{statusCounts[f.key] || 0}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Reports List */}
            {loading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-white border border-slate-100 rounded-2xl shadow-sm animate-pulse" />)}
                </div>
            ) : filteredReports.length === 0 ? (
                <div className="card text-center py-16 border-dashed border-2 border-slate-200 bg-slate-50/50">
                    <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <FileText className="w-8 h-8 text-brand-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">
                        {searchQuery || statusFilter !== 'all' ? 'No matching reports found' : 'No reports generated yet'}
                    </h3>
                    <p className="text-sm font-medium text-slate-500">
                        {searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters or search terms.' : 'Generate your first report from the patient management dashboard.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredReports.map(r => {
                        const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.draft;
                        const StatusIcon = cfg.icon;
                        return (
                            <div key={r.id} className="card p-0 overflow-hidden hover:shadow-md transition-shadow duration-300 border-slate-200 bg-white">
                                <div
                                    className="flex items-center gap-4 p-5 cursor-pointer hover:bg-slate-50/80 transition-colors"
                                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${r.isAiGenerated ? 'bg-brand-50 border border-brand-100 text-brand-600' : 'bg-amber-50 border border-amber-100 text-amber-600'
                                        }`}>
                                        {r.isAiGenerated ? <Brain className="w-6 h-6" /> : <FileCheck className="w-6 h-6" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 flex-wrap mb-1">
                                            <p className="text-base font-bold text-slate-900 truncate">
                                                {patients[r.patientId] || 'Unknown Patient'}
                                            </p>
                                            <span className={`${cfg.badge} shadow-sm`}><StatusIcon className="w-3.5 h-3.5" />{cfg.label}</span>
                                            {r.isAiGenerated ? (
                                                <span className="badge font-bold bg-brand-50 text-brand-700 border border-brand-200 flex items-center gap-1 shadow-sm"><Brain className="w-3 h-3" />AI Generated</span>
                                            ) : (
                                                <span className="badge font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 shadow-sm"><Info className="w-3 h-3" />Rule-Based</span>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium text-slate-500 truncate">
                                            {(() => {
                                                const diag = r.generatedContent?.diagnosis || r.generatedContent?.['2. diagnosis'] || r.generatedContent?.['diagnosis'];
                                                if (!diag) return 'Discharge Summary';
                                                if (Array.isArray(diag)) return diag.join(', ').slice(0, 80);
                                                if (typeof diag === 'object') return JSON.stringify(diag).slice(0, 80);
                                                return String(diag).slice(0, 80);
                                            })()}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0 hidden sm:block">
                                        <p className="text-sm font-bold text-slate-700">{formatDate(r.createdAt)}</p>
                                        {r.admissionDate && r.dischargeDate && (
                                            <p className="text-xs font-medium text-slate-500 mt-1.5 flex items-center justify-end gap-1"><Calendar className="w-3 h-3 text-slate-400" />{formatDate(r.admissionDate)} → {formatDate(r.dischargeDate)}</p>
                                        )}
                                    </div>
                                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform shrink-0 ${expandedId === r.id ? 'rotate-180 text-brand-500' : ''}`} />
                                </div>

                                {expandedId === r.id && (
                                    <div className="border-t border-slate-100 bg-slate-50 p-6 animate-fade-in relative z-0">
                                        <div className="grid sm:grid-cols-2 gap-5 mb-5">
                                            <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                                    <User className="w-4 h-4 text-slate-500" />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Patient Name</p>
                                                    <p className="text-sm font-bold text-slate-800">{patients[r.patientId] || r.patientId}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                                    <Calendar className="w-4 h-4 text-slate-500" />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Created Date</p>
                                                    <p className="text-sm font-bold text-slate-800">{formatDate(r.createdAt)}</p>
                                                </div>
                                            </div>
                                        </div>
                                        {r.finalContent && (
                                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                                                    <Eye className="w-4 h-4 text-brand-500" />
                                                    <h4 className="text-sm font-bold text-slate-700">Report Content</h4>
                                                </div>
                                                <div className="p-4">
                                                    <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed max-h-80 overflow-y-auto custom-scrollbar">{r.finalContent}</pre>
                                                </div>
                                            </div>
                                        )}
                                        {r.versionHistory && r.versionHistory.length > 0 && (
                                            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white px-3 py-2 rounded-lg border border-slate-200 inline-flex shadow-sm">
                                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                {r.versionHistory.length} version{r.versionHistory.length > 1 ? 's' : ''} saved in history
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AllReports;

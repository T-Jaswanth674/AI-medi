import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import {
    History, Brain, FileCheck, Info, Clock, CheckCircle2,
    AlertCircle, Calendar, Filter
} from 'lucide-react';

const STATUS_CONFIG = {
    draft: { label: 'Draft', badge: 'badge-gray', icon: Clock, color: 'bg-gray-500', border: 'border-gray-500/30' },
    pending_approval: { label: 'Pending Approval', badge: 'badge-yellow', icon: AlertCircle, color: 'bg-yellow-500', border: 'border-yellow-500/30' },
    approved: { label: 'Approved', badge: 'badge-green', icon: CheckCircle2, color: 'bg-green-500', border: 'border-green-500/30' },
};

const ReportHistory = () => {
    const { currentUser } = useAuth();
    const [timeline, setTimeline] = useState([]);
    const [patients, setPatients] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterType, setFilterType] = useState('all');

    useEffect(() => {
        const fetchHistory = async () => {
            if (!currentUser) return;
            try {
                const reportsSnap = await getDocs(
                    query(collection(db, 'reports'), where('doctorId', '==', currentUser.uid))
                );
                const reports = reportsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                // Fetch patient names
                const patientIds = [...new Set(reports.map(r => r.patientId).filter(Boolean))];
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

                // Build timeline events from reports only
                const events = [];
                reports.forEach(r => {
                    events.push({
                        id: `report-${r.id}`,
                        type: 'report_created',
                        reportId: r.id,
                        patientId: r.patientId,
                        status: r.status,
                        isAiGenerated: r.isAiGenerated,
                        diagnosis: (() => {
                            const diag = r.generatedContent?.diagnosis || r.generatedContent?.['2. diagnosis'] || r.generatedContent?.['diagnosis'];
                            if (!diag) return '';
                            if (Array.isArray(diag)) return diag.join(', ');
                            if (typeof diag === 'object') return JSON.stringify(diag);
                            return String(diag);
                        })(),
                        timestamp: r.createdAt?.toMillis?.() || 0,
                        date: r.createdAt,
                    });
                    if (r.versionHistory && r.versionHistory.length > 1) {
                        r.versionHistory.slice(1).forEach((v, i) => {
                            events.push({
                                id: `version-${r.id}-${i}`,
                                type: 'report_updated',
                                reportId: r.id,
                                patientId: r.patientId,
                                timestamp: new Date(v.savedAt).getTime() || 0,
                                date: { toDate: () => new Date(v.savedAt) },
                            });
                        });
                    }
                });

                events.sort((a, b) => b.timestamp - a.timestamp);
                setTimeline(events);
            } catch (err) {
                console.error(err);
                setError('Failed to load report history.');
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [currentUser]);

    const formatDate = (ts) => {
        if (!ts) return '—';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatTime = (ts) => {
        if (!ts) return '';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    const groupByDate = (events) => {
        const groups = {};
        events.forEach(e => {
            const dateStr = formatDate(e.date);
            if (!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push(e);
        });
        return groups;
    };

    const filteredTimeline = filterType === 'all'
        ? timeline
        : timeline.filter(e => e.type === filterType);

    const grouped = groupByDate(filteredTimeline);

    const getEventDisplay = (event) => {
        switch (event.type) {
            case 'report_created': {
                const cfg = STATUS_CONFIG[event.status] || STATUS_CONFIG.draft;
                return {
                    icon: event.isAiGenerated ? Brain : FileCheck,
                    iconBg: event.isAiGenerated ? 'bg-brand-500/20 text-brand-400' : 'bg-yellow-500/20 text-yellow-400',
                    title: `Report generated for ${patients[event.patientId] || 'Unknown Patient'}`,
                    subtitle: event.diagnosis?.slice(0, 80) || 'Discharge Summary',
                    badge: <span className={cfg.badge}>{cfg.label}</span>,
                    extra: event.isAiGenerated
                        ? <span className="badge-blue"><Brain className="w-2.5 h-2.5" />AI</span>
                        : <span className="badge-yellow"><Info className="w-2.5 h-2.5" />Rule-Based</span>,
                };
            }
            case 'report_updated':
                return {
                    icon: History,
                    iconBg: 'bg-purple-500/20 text-purple-400',
                    title: `Report updated for ${patients[event.patientId] || 'Unknown Patient'}`,
                    subtitle: 'New version saved',
                    badge: <span className="badge-purple">Updated</span>,
                };
            default:
                return {
                    icon: Clock,
                    iconBg: 'bg-gray-500/20 text-gray-400',
                    title: 'Event',
                    subtitle: '',
                };
        }
    };

    return (
        <div className="space-y-5 animate-fade-in">
            <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-brand-400" />
                    Report History
                </h1>
                <p className="text-sm text-gray-400 mt-0.5">Timeline of all report activity</p>
            </div>

            {error && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                {[
                    { key: 'all', label: 'All Activity' },
                    { key: 'report_created', label: 'Reports Created' },
                    { key: 'report_updated', label: 'Updates' },
                ].map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilterType(f.key)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${filterType === f.key
                            ? 'bg-brand-600/20 text-brand-400 border-brand-500/30'
                            : 'bg-hospital-card text-gray-400 border-hospital-border hover:text-white hover:border-gray-600'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Timeline */}
            {loading ? (
                <div className="space-y-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-hospital-border animate-pulse shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-hospital-border rounded animate-pulse w-2/3" />
                                <div className="h-3 bg-hospital-border rounded animate-pulse w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredTimeline.length === 0 ? (
                <div className="card text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-4">
                        <History className="w-7 h-7 text-brand-400" />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-1">No activity yet</h3>
                    <p className="text-sm text-gray-500">Your report activity timeline will appear here.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(grouped).map(([dateStr, events]) => (
                        <div key={dateStr}>
                            {/* Date Header */}
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 bg-hospital-card border border-hospital-border rounded-full px-3 py-1.5">
                                    <Calendar className="w-3 h-3" />
                                    {dateStr}
                                </div>
                                <div className="flex-1 h-px bg-hospital-border" />
                            </div>

                            {/* Events */}
                            <div className="space-y-1 ml-1">
                                {events.map((event, i) => {
                                    const display = getEventDisplay(event);
                                    const Icon = display.icon;
                                    return (
                                        <div key={event.id} className="flex gap-3 group">
                                            {/* Timeline line & dot */}
                                            <div className="flex flex-col items-center">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${display.iconBg}`}>
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                {i < events.length - 1 && (
                                                    <div className="w-px flex-1 bg-hospital-border my-1" />
                                                )}
                                            </div>
                                            {/* Content */}
                                            <div className="flex-1 pb-4">
                                                <div className="flex items-start gap-2 flex-wrap">
                                                    <p className="text-sm font-medium text-white">{display.title}</p>
                                                    {display.badge}
                                                    {display.extra}
                                                </div>
                                                {display.subtitle && (
                                                    <p className="text-xs text-gray-500 mt-0.5">{display.subtitle}</p>
                                                )}
                                                <p className="text-[10px] text-gray-600 mt-1">{formatTime(event.date)}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReportHistory;

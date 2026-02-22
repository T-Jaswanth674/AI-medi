import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/firebase';
import {
    collection, getDocs, addDoc, query, where,
    orderBy, serverTimestamp
} from 'firebase/firestore';
import {
    Search, ClipboardList, User, CheckCircle2,
    AlertCircle, Loader, X, Send, Calendar, Clock
} from 'lucide-react';

const NurseNotes = () => {
    const { currentUser, userProfile } = useAuth();
    const [allPatients, setAllPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [note, setNote] = useState('');
    const [patientNotes, setPatientNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadingNotes, setLoadingNotes] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Load ALL patients on mount
    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const snap = await getDocs(collection(db, 'patients'));
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                list.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
                setAllPatients(list);
            } catch (err) {
                console.error(err);
                setError('Failed to load patients.');
            } finally {
                setLoading(false);
            }
        };
        fetchPatients();
    }, []);

    // Load notes when patient selected
    const selectPatient = async (patient) => {
        setSelectedPatient(patient);
        setNote('');
        setSuccess('');
        setError('');
        setLoadingNotes(true);
        try {
            const q = query(
                collection(db, 'nurse_notes'),
                where('patientId', '==', patient.id),
                orderBy('timestamp', 'desc')
            );
            const snap = await getDocs(q);
            setPatientNotes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error(err);
            // Try without orderBy if index doesn't exist
            try {
                const q2 = query(collection(db, 'nurse_notes'), where('patientId', '==', patient.id));
                const snap2 = await getDocs(q2);
                const notes = snap2.docs.map(d => ({ id: d.id, ...d.data() }));
                notes.sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0));
                setPatientNotes(notes);
            } catch { setPatientNotes([]); }
        } finally {
            setLoadingNotes(false);
        }
    };

    const handleSaveNote = async () => {
        if (!note.trim()) { setError('Please write a note before saving.'); return; }
        if (!selectedPatient) return;
        setSaving(true);
        setError('');
        try {
            const docData = {
                patientId: selectedPatient.id,
                nurseId: currentUser.uid,
                nurseName: `${userProfile?.firstName} ${userProfile?.lastName}`,
                note: note.trim(),
                timestamp: serverTimestamp(),
            };
            const ref = await addDoc(collection(db, 'nurse_notes'), docData);
            // Prepend optimistically
            setPatientNotes(prev => [{
                id: ref.id,
                ...docData,
                timestamp: { toMillis: () => Date.now(), toDate: () => new Date() },
            }, ...prev]);
            setNote('');
            setSuccess('Note saved successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error(err);
            setError('Failed to save note. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (ts) => {
        if (!ts) return '';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatTime = (ts) => {
        if (!ts) return '';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    // Filtered patient list for search
    const filteredPatients = allPatients.filter(p => {
        const term = searchTerm.toLowerCase();
        return (
            `${p.firstName} ${p.lastName}`.toLowerCase().includes(term) ||
            (p.phone && p.phone.includes(term)) ||
            (p.email && p.email.toLowerCase().includes(term))
        );
    });

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight font-display">
                    <ClipboardList className="w-6 h-6 text-brand-500" />
                    Nurse Notes
                </h1>
                <p className="text-sm text-slate-500 mt-1 font-medium">
                    Search for an admitted patient and write clinical notes
                </p>
            </div>

            <div className="grid lg:grid-cols-5 gap-6">
                {/* LEFT — Patient Search Panel */}
                <div className="lg:col-span-2 card h-fit flex flex-col">
                    <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Search className="w-4 h-4 text-brand-500" />
                        Find Patient
                    </h2>

                    {/* Search box */}
                    <div className="relative mb-4 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                        <input
                            type="text"
                            className="input pl-9 h-11 bg-slate-50 border-slate-200 focus:bg-white"
                            placeholder="Name, phone or email..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Patient List */}
                    {loading ? (
                        <div className="space-y-2">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : filteredPatients.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                <User className="w-6 h-6 text-slate-400" />
                            </div>
                            <p className="text-sm text-slate-500 font-medium">
                                {searchTerm ? 'No patients found' : 'No patients in system'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1.5 overflow-y-auto max-h-[500px] pr-1 custom-scrollbar">
                            {filteredPatients.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => selectPatient(p)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 border ${selectedPatient?.id === p.id
                                        ? 'bg-brand-50 border-brand-200 shadow-sm'
                                        : 'border-transparent hover:bg-slate-50 hover:border-slate-100'
                                        }`}
                                >
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${selectedPatient?.id === p.id
                                        ? 'bg-brand-500 text-white'
                                        : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                        }`}>
                                        {p.firstName?.[0]}{p.lastName?.[0]}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-sm font-bold truncate ${selectedPatient?.id === p.id ? 'text-brand-700' : 'text-slate-800'}`}>
                                            {p.firstName} {p.lastName}
                                        </p>
                                        <p className="text-xs text-slate-500 font-medium">
                                            {p.gender}{p.bloodGroup ? ` · ${p.bloodGroup}` : ''}
                                        </p>
                                    </div>
                                    {selectedPatient?.id === p.id && (
                                        <div className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT — Notes Panel */}
                <div className="lg:col-span-3 space-y-5">
                    {!selectedPatient ? (
                        <div className="card flex flex-col items-center justify-center py-20 text-center border-dashed border-2 border-slate-200 bg-slate-50/50">
                            <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mb-4">
                                <ClipboardList className="w-8 h-8 text-brand-400" />
                            </div>
                            <h3 className="text-base font-bold text-slate-700 mb-1">Select a Patient</h3>
                            <p className="text-sm text-slate-500 font-medium max-w-xs">
                                Search and select a patient from the list to view or add nursing notes.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Patient Header */}
                            <div className="card p-5 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-lg">
                                    {selectedPatient.firstName?.[0]}{selectedPatient.lastName?.[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-base font-extrabold text-slate-900">
                                        {selectedPatient.firstName} {selectedPatient.lastName}
                                    </p>
                                    <p className="text-sm text-slate-500 font-medium">
                                        {selectedPatient.gender}
                                        {selectedPatient.bloodGroup ? ` · Blood: ${selectedPatient.bloodGroup}` : ''}
                                        {selectedPatient.phone ? ` · ${selectedPatient.phone}` : ''}
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setSelectedPatient(null); setPatientNotes([]); }}
                                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Note Writing Area */}
                            <div className="card space-y-4">
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <ClipboardList className="w-4 h-4 text-brand-500" />
                                    Write Clinical Note
                                </h3>

                                {error && (
                                    <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2.5">
                                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                                        <p className="text-sm text-rose-600 font-medium">{error}</p>
                                    </div>
                                )}
                                {success && (
                                    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <p className="text-sm text-emerald-600 font-medium">{success}</p>
                                    </div>
                                )}

                                <textarea
                                    className="input resize-none leading-relaxed"
                                    rows={5}
                                    placeholder={`Write clinical observation for ${selectedPatient.firstName}...\n\nE.g. Patient's vitals stable. Complaint of mild headache. Administered paracetamol 500mg as prescribed.`}
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                />

                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400 font-medium">
                                        {note.length} characters
                                    </span>
                                    <button
                                        onClick={handleSaveNote}
                                        disabled={saving || !note.trim()}
                                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {saving
                                            ? <><Loader className="w-4 h-4 animate-spin" />Saving...</>
                                            : <><Send className="w-4 h-4" />Save Note</>
                                        }
                                    </button>
                                </div>
                            </div>

                            {/* Past Notes */}
                            <div className="card space-y-4">
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-brand-500" />
                                    Past Notes
                                    {patientNotes.length > 0 && (
                                        <span className="text-xs font-bold text-white bg-brand-500 rounded-full px-2 py-0.5 ml-1">
                                            {patientNotes.length}
                                        </span>
                                    )}
                                </h3>

                                {loadingNotes ? (
                                    <div className="space-y-3">
                                        {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />)}
                                    </div>
                                ) : patientNotes.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-sm text-slate-500 font-medium">No notes yet for this patient.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                                        {patientNotes.map(n => (
                                            <div key={n.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 hover:border-brand-100 transition-colors">
                                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap mb-3">
                                                    {n.note}
                                                </p>
                                                <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
                                                    <div className="w-6 h-6 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                                                        <User className="w-3 h-3 text-brand-500" />
                                                    </div>
                                                    <p className="text-xs font-semibold text-slate-500">{n.nurseName || 'Nurse'}</p>
                                                    <span className="text-slate-300">·</span>
                                                    <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                                                        <Calendar className="w-3 h-3" />
                                                        {formatDate(n.timestamp)}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                                                        <Clock className="w-3 h-3" />
                                                        {formatTime(n.timestamp)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NurseNotes;

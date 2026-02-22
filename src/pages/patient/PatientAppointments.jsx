import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import {
    Calendar, Clock, Stethoscope, CheckCircle2, AlertCircle,
    Loader, X, ArrowRight, BookOpen, User
} from 'lucide-react';

const PatientAppointments = () => {
    const { currentUser } = useAuth();
    const [doctors, setDoctors] = useState([]);
    const [slots, setSlots] = useState([]);
    const [myAppointments, setMyAppointments] = useState([]);
    const [patientId, setPatientId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [activeTab, setActiveTab] = useState('doctors');

    useEffect(() => {
        if (!currentUser) return;
        const fetchData = async () => {
            try {
                const patientSnap = await getDocs(query(collection(db, 'patients'), where('uid', '==', currentUser.uid)));
                let pid = null;
                if (!patientSnap.empty) { pid = patientSnap.docs[0].id; setPatientId(pid); }

                const [doctorSnap, slotsSnap, apptSnap] = await Promise.all([
                    getDocs(query(collection(db, 'users'), where('role', '==', 'doctor'))),
                    getDocs(query(collection(db, 'availability_slots'), where('isBooked', '==', false))),
                    pid ? getDocs(query(collection(db, 'appointments'), where('patientId', '==', pid))) : Promise.resolve({ docs: [] }),
                ]);

                const doctorList = doctorSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                const doctorMap = {};
                doctorList.forEach(d => { doctorMap[d.uid || d.id] = `Dr. ${d.firstName} ${d.lastName}`; });

                setDoctors(doctorList);
                setSlots(slotsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                const appts = apptSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                setMyAppointments(appts.map(a => ({ ...a, doctorName: doctorMap[a.doctorId] || 'Doctor' }))
                    .sort((a, b) => a.date.localeCompare(b.date)));
            } catch (err) {
                console.error(err);
                setError('Failed to load data.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentUser]);

    const doctorSlots = selectedDoctor ? slots.filter(s => s.doctorId === (selectedDoctor.uid || selectedDoctor.id)) : [];

    const bookSlot = async (slot) => {
        if (!patientId) { setError('Your account is not linked to a patient record. Please contact your care provider.'); return; }
        setBooking(true); setError('');
        try {
            await addDoc(collection(db, 'appointments'), {
                patientId, doctorId: slot.doctorId, slotId: slot.id,
                date: slot.date, time: slot.time, status: 'booked', createdAt: serverTimestamp(),
            });
            // Mark slot as booked in Firestore
            await updateDoc(doc(db, 'availability_slots', slot.id), { isBooked: true });
            setSlots(prev => prev.filter(s => s.id !== slot.id));
            const doctorName = `Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}`;
            setMyAppointments(prev => [...prev, { id: Date.now().toString(), patientId, doctorId: slot.doctorId, date: slot.date, time: slot.time, status: 'booked', doctorName }]);
            setSuccess(`Appointment booked with ${doctorName} on ${formatDate(slot.date)} at ${slot.time}!`);
            setSelectedDoctor(null); setActiveTab('myAppointments');
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            console.error(err); setError('Failed to book appointment.');
        } finally { setBooking(false); }
    };

    const formatDate = (str) => {
        if (!str) return '—';
        return new Date(str + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    };

    const STATUS_COLOR = { booked: 'bg-blue-50 text-blue-700 border-blue-200', cancelled: 'bg-rose-50 text-rose-700 border-rose-200', completed: 'bg-emerald-50 text-emerald-700 border-emerald-200' };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-teal-700 p-8 shadow-soft">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
                <h1 className="text-2xl font-bold text-white font-display flex items-center gap-3 relative z-10">
                    <Calendar className="w-7 h-7" /> My Appointments
                </h1>
                <p className="text-teal-100 text-sm font-medium mt-1 relative z-10">Browse doctors, view slots, and book appointments</p>
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

            <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
                {[{ key: 'doctors', label: 'All Doctors' }, { key: 'myAppointments', label: 'My Bookings', count: myAppointments.length }].map(tab => (
                    <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSelectedDoctor(null); }}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        {tab.label}
                        {tab.count !== undefined && (
                            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-md font-bold ${activeTab === tab.key ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-500'}`}>{tab.count}</span>
                        )}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-white border border-slate-100 rounded-2xl animate-pulse" />)}</div>
            ) : activeTab === 'doctors' && !selectedDoctor ? (
                <div>
                    <p className="text-sm text-slate-500 font-medium mb-4">Select a doctor to view available appointment slots</p>
                    {doctors.length === 0 ? (
                        <div className="card text-center py-12"><Stethoscope className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-slate-500 font-medium">No doctors available</p></div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {doctors.map(d => {
                                const available = slots.filter(s => s.doctorId === (d.uid || d.id)).length;
                                return (
                                    <button key={d.id} onClick={() => setSelectedDoctor(d)}
                                        className="card p-5 text-left hover:border-brand-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group border-slate-200">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
                                                {d.firstName?.[0]}{d.lastName?.[0]}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-extrabold text-slate-900 group-hover:text-brand-600 transition-colors">Dr. {d.firstName} {d.lastName}</p>
                                                <p className="text-xs text-slate-500 font-medium">{d.specialization || 'General Medicine'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${available > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                {available} slot{available !== 1 ? 's' : ''} available
                                            </span>
                                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : activeTab === 'doctors' && selectedDoctor ? (
                <div className="space-y-4">
                    <button onClick={() => setSelectedDoctor(null)} className="flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700">← Back to Doctors</button>
                    <div className="card p-5 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-teal-500 flex items-center justify-center text-white font-bold shadow-lg">
                            {selectedDoctor.firstName?.[0]}{selectedDoctor.lastName?.[0]}
                        </div>
                        <div>
                            <p className="text-lg font-extrabold text-slate-900">Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}</p>
                            <p className="text-sm text-slate-500 font-medium">{selectedDoctor.specialization || 'General Medicine'}</p>
                        </div>
                    </div>
                    {doctorSlots.length === 0 ? (
                        <div className="card text-center py-12"><Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-slate-500 font-medium">No available slots</p></div>
                    ) : (
                        <div className="grid sm:grid-cols-2 gap-4">
                            {doctorSlots.map(slot => (
                                <div key={slot.id} className="card p-5 border-slate-200 hover:border-brand-200 transition-colors">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center">
                                            <Calendar className="w-5 h-5 text-brand-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{formatDate(slot.date)}</p>
                                            <p className="text-xs text-slate-500 font-medium flex items-center gap-1"><Clock className="w-3 h-3" />{slot.time}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => bookSlot(slot)} disabled={booking} className="btn-primary w-full justify-center disabled:opacity-50">
                                        {booking ? <Loader className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />} Book Appointment
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="card space-y-3">
                    {myAppointments.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">No appointments booked yet</p>
                            <button onClick={() => setActiveTab('doctors')} className="btn-primary mx-auto mt-4"><Stethoscope className="w-4 h-4" />Browse Doctors</button>
                        </div>
                    ) : myAppointments.map(a => (
                        <div key={a.id} className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                                <Stethoscope className="w-5 h-5 text-brand-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900">{a.doctorName}</p>
                                <p className="text-xs text-slate-500 font-medium">{formatDate(a.date)} at {a.time}</p>
                            </div>
                            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${STATUS_COLOR[a.status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                {a.status || 'booked'}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PatientAppointments;

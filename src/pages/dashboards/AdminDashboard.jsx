import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/firebase';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import {
    Users, UserCheck, FileText, Calendar,
    TrendingUp, AlertCircle, ShieldCheck, PlusCircle, ArrowRight, Clock
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color, bg, border, trend }) => (
    <div className="stat-card">
        <div className="flex items-start justify-between">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bg} ${border} border`}>
                <Icon className={`w-6 h-6 ${color}`} />
            </div>
            {trend && (
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />{trend}
                </span>
            )}
        </div>
        <div>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</p>
            <p className="text-sm font-medium text-slate-500 mt-1">{label}</p>
        </div>
    </div>
);

const AdminDashboard = () => {
    const { userProfile } = useAuth();
    const [stats, setStats] = useState({ users: 0, patients: 0, reports: 0, appointments: 0 });
    const [recentUsers, setRecentUsers] = useState([]);
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersSnap, patientsSnap, reportsSnap, apptSnap, recentSnap] = await Promise.all([
                    getDocs(collection(db, 'users')),
                    getDocs(collection(db, 'patients')),
                    getDocs(collection(db, 'reports')),
                    getDocs(query(collection(db, 'appointments'), where('status', '==', 'booked'))),
                    getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(5))),
                ]);

                setStats({
                    users: usersSnap.size,
                    patients: patientsSnap.size,
                    reports: reportsSnap.size,
                    appointments: apptSnap.size,
                });
                setRecentUsers(recentSnap.docs.map(d => ({ id: d.id, ...d.data() })));

                // Get upcoming appointments with doctor names
                const apptList = apptSnap.docs.map(d => ({ id: d.id, ...d.data() })).slice(0, 5);
                const doctorIds = [...new Set(apptList.map(a => a.doctorId).filter(Boolean))];
                const doctorMap = {};
                if (doctorIds.length > 0) {
                    const dSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'doctor')));
                    dSnap.docs.forEach(d => { doctorMap[d.data().uid || d.id] = `Dr. ${d.data().firstName} ${d.data().lastName}`; });
                }
                setUpcomingAppointments(apptList.map(a => ({ ...a, doctorName: doctorMap[a.doctorId] || 'Doctor' })));
            } catch (err) {
                console.error('Error fetching admin data:', err);
                setError('Failed to load dashboard data. Please refresh.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const ROLE_BADGE_MAP = {
        admin: 'badge-purple',
        doctor: 'badge-blue',
        nurse: 'badge-green',
        patient: 'badge-yellow',
    };

    const formatDate = (str) => {
        if (!str) return '—';
        return new Date(str + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="space-y-6 animate-fade-in relative">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 card bg-white border-white shadow-soft relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="relative z-10">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-display">Admin Dashboard</h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Welcome back, {userProfile?.firstName} — System Overview</p>
                </div>
                <Link to="/admin/users" className="btn-primary relative z-10">
                    <PlusCircle className="w-5 h-5" />
                    Add New User
                </Link>
            </div>

            {error && (
                <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    <p className="text-rose-600 text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <StatCard icon={Users} label="Total Users" value={stats.users} color="text-purple-600" bg="bg-purple-50" border="border-purple-100" trend="+12%" />
                <StatCard icon={UserCheck} label="Patients" value={stats.patients} color="text-brand-600" bg="bg-brand-50" border="border-brand-100" trend="+8%" />
                <StatCard icon={FileText} label="Reports" value={stats.reports} color="text-emerald-600" bg="bg-emerald-50" border="border-emerald-100" trend="+23%" />
                <StatCard icon={Calendar} label="Appointments" value={stats.appointments} color="text-amber-600" bg="bg-amber-50" border="border-amber-100" />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Users */}
                <div className="card h-full flex flex-col">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Users className="w-5 h-5 text-brand-500" />
                            Recent Users
                        </h2>
                        <Link to="/admin/users" className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 group">
                            View all <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                    {loading ? (
                        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />)}</div>
                    ) : recentUsers.length === 0 ? (
                        <div className="text-center py-10 my-auto">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Users className="w-8 h-8 text-slate-400" />
                            </div>
                            <p className="text-sm font-medium text-slate-500">No users yet</p>
                        </div>
                    ) : (
                        <div className="space-y-2 flex-1">
                            {recentUsers.map(user => (
                                <div key={user.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-teal-400 flex items-center justify-center shrink-0 shadow-sm">
                                        <span className="text-sm font-bold text-white">
                                            {user.firstName?.[0]}{user.lastName?.[0]}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800 truncate">{user.firstName} {user.lastName}</p>
                                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                    </div>
                                    <span className={ROLE_BADGE_MAP[user.role] || 'badge-gray'}>{user.role}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Upcoming Appointments */}
                <div className="card h-full flex flex-col">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-brand-500" />
                            Upcoming Appointments
                        </h2>
                        <Link to="/admin/appointments" className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 group">
                            Manage <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                    {loading ? (
                        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse" />)}</div>
                    ) : upcomingAppointments.length === 0 ? (
                        <div className="text-center py-10 my-auto">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Calendar className="w-8 h-8 text-slate-400" />
                            </div>
                            <p className="text-sm font-medium text-slate-500">No upcoming appointments</p>
                            <Link to="/admin/appointments" className="btn-secondary mx-auto mt-4 !py-2 text-xs">
                                Create Slots
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-2 flex-1">
                            {upcomingAppointments.map(a => (
                                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                    <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                                        <Clock className="w-5 h-5 text-brand-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800">{a.doctorName}</p>
                                        <p className="text-xs text-slate-500 font-medium">{formatDate(a.date)} at {a.time}</p>
                                    </div>
                                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">booked</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
                <h2 className="text-base font-bold text-slate-900 mb-5">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                        { to: '/admin/users', icon: Users, label: 'Manage Users', color: 'text-purple-600 bg-purple-50 group-hover:bg-purple-100 border-purple-100' },
                        { to: '/admin/appointments', icon: Calendar, label: 'Appointments', color: 'text-brand-600 bg-brand-50 group-hover:bg-brand-100 border-brand-100' },
                        { to: '/admin/users', icon: ShieldCheck, label: 'User Roles', color: 'text-emerald-600 bg-emerald-50 group-hover:bg-emerald-100 border-emerald-100' },
                    ].map(({ to, icon: Icon, label, color }) => (
                        <Link key={label} to={to}
                            className="flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all duration-300 hover:shadow-md hover:-translate-y-1 group bg-white"
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors border ${color}`}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-bold text-slate-700">{label}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

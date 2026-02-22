import React, { useState, memo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Stethoscope, LayoutDashboard, Users, FileText,
    ClipboardList, LogOut, Menu, X,
    ChevronRight, Bell, HeartPulse,
    FilePlus, History, FileCheck, Calendar
} from 'lucide-react';

const ROLE_NAV = {
    admin: [
        { icon: LayoutDashboard, label: 'Dashboard', to: '/admin' },
        { icon: Users, label: 'Manage Users', to: '/admin/users' },
        { icon: Calendar, label: 'Appointments', to: '/admin/appointments' },
    ],
    doctor: [
        { icon: LayoutDashboard, label: 'Dashboard', to: '/doctor' },
        { icon: Users, label: 'My Patients', to: '/doctor/patients' },
        { icon: FilePlus, label: 'New Report', to: '/doctor/new-report' },
        { icon: FileText, label: 'Reports', to: '/doctor/reports' },
        { icon: History, label: 'History', to: '/doctor/history' },
        { icon: Calendar, label: 'Appointments', to: '/doctor/appointments' },
    ],
    nurse: [
        { icon: LayoutDashboard, label: 'Dashboard', to: '/nurse' },
        { icon: ClipboardList, label: 'Nurse Notes', to: '/nurse/notes' },
    ],
    patient: [
        { icon: LayoutDashboard, label: 'Dashboard', to: '/patient' },
        { icon: FileCheck, label: 'My Reports', to: '/patient/reports' },
        { icon: Calendar, label: 'Appointments', to: '/patient/appointments' },
    ],
};

const ROLE_BADGE = {
    admin: 'badge-purple',
    doctor: 'badge-blue',
    nurse: 'badge-green',
    patient: 'badge-yellow',
};

const SidebarContent = memo(({ userProfile, role, navItems, onLogout, onNavClick }) => (
    <div className="flex flex-col h-full bg-white relative">
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-brand-50/50 to-transparent pointer-events-none"></div>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-slate-100 relative z-10">
            <div className="w-10 h-10 bg-brand-50 border border-brand-100 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                <Stethoscope className="w-6 h-6 text-brand-600" />
            </div>
            <div>
                <p className="font-bold text-slate-900 text-lg tracking-tight">MediDischarge</p>
                <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">AI Platform</p>
            </div>
        </div>

        {/* User Info */}
        <div className="px-5 py-5 border-b border-slate-100 relative z-10 bg-white/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-teal-400 flex items-center justify-center shrink-0 shadow-md ring-2 ring-white group-hover:scale-105 transition-transform duration-300">
                    <span className="text-sm font-bold text-white">
                        {userProfile?.firstName?.[0]}{userProfile?.lastName?.[0]}
                    </span>
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">
                        {userProfile?.firstName} {userProfile?.lastName}
                    </p>
                    <span className={`mt-0.5 ${ROLE_BADGE[role]}`}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                    </span>
                </div>
            </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto relative z-10 custom-scrollbar">
            {navItems.map(({ icon: Icon, label, to }) => (
                <NavLink
                    key={to}
                    to={to}
                    end={to === `/${role}`}
                    className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                    onClick={onNavClick}
                >
                    <Icon className="w-5 h-5 shrink-0 opacity-80" />
                    <span>{label}</span>
                </NavLink>
            ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-rose-600 font-semibold bg-rose-50 hover:bg-rose-500 hover:text-white rounded-xl transition-all duration-300 group"
            >
                <LogOut className="w-4 h-4 shrink-0 transition-transform group-hover:-translate-x-1" />
                <span>Sign Out</span>
            </button>
        </div>
    </div>
));

SidebarContent.displayName = 'SidebarContent';

const Layout = ({ children }) => {
    const { userProfile, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    const role = userProfile?.role || 'patient';
    const navItems = ROLE_NAV[role] || [];

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className="min-h-screen bg-hospital-bg flex selection:bg-brand-500/20">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-64 flex-col shrink-0 border-r border-slate-200 bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 transition-all duration-300">
                <SidebarContent
                    userProfile={userProfile}
                    role={role}
                    navItems={navItems}
                    onLogout={handleLogout}
                    onNavClick={closeSidebar}
                />
            </aside>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    <div
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                        onClick={closeSidebar}
                    />
                    <aside className="relative z-10 w-72 bg-white flex flex-col shadow-2xl animate-fade-in translate-x-0">
                        <SidebarContent
                            userProfile={userProfile}
                            role={role}
                            navItems={navItems}
                            onLogout={handleLogout}
                            onNavClick={closeSidebar}
                        />
                    </aside>
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                {/* Top Navbar */}
                <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <button
                            className="lg:hidden text-slate-500 hover:text-brand-600 transition-colors p-2 -ml-2 rounded-lg hover:bg-slate-50"
                            onClick={() => setSidebarOpen(true)}
                            aria-label="Open navigation menu"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="lg:hidden flex items-center gap-2">
                            <div className="w-8 h-8 bg-brand-50 border border-brand-100 rounded-lg flex items-center justify-center">
                                <Stethoscope className="w-4 h-4 text-brand-600" />
                            </div>
                        </div>
                        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-500 text-sm font-medium">
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                            <span className="capitalize">{role} Portal</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:block text-right mr-2">
                            <p className="text-sm font-bold text-slate-700">Welcome back</p>
                            <p className="text-xs text-slate-500">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                        <button
                            className="relative text-slate-400 hover:text-brand-600 transition-colors p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100"
                            aria-label="Notifications"
                        >
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 border-2 border-white rounded-full"></span>
                        </button>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative z-0">
                    <div className="max-w-7xl mx-auto animate-fade-in">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Stethoscope, Brain, ShieldCheck, Users, FileText,
    ArrowRight, Star, Sparkles, Activity, Clock, CheckCircle2,
    ChevronDown, ChevronRight
} from 'lucide-react';

const FEATURES = [
    {
        icon: Brain,
        title: 'AI-Powered Summaries',
        desc: 'Google Gemini AI generates accurate, comprehensive discharge reports in seconds.',
        color: 'from-emerald-500 to-teal-600',
        bgLight: 'bg-emerald-50',
        textLight: 'text-emerald-600',
        borderHover: 'hover:border-emerald-300'
    },
    {
        icon: ShieldCheck,
        title: 'Role-Based Security',
        desc: 'Admin, Doctor, Nurse, and Patient portals with strict Firebase security rules.',
        color: 'from-teal-500 to-cyan-600',
        bgLight: 'bg-teal-50',
        textLight: 'text-teal-600',
        borderHover: 'hover:border-teal-300'
    },
    {
        icon: Users,
        title: 'Complete Patient Care',
        desc: 'Nurse notes, doctor reports, and appointment booking in one unified platform.',
        color: 'from-green-500 to-emerald-600',
        bgLight: 'bg-green-50',
        textLight: 'text-green-600',
        borderHover: 'hover:border-green-300'
    },
    {
        icon: FileText,
        title: 'Smart Report History',
        desc: 'Full version control and audit trail for every discharge report generated.',
        color: 'from-lime-500 to-green-600',
        bgLight: 'bg-lime-50',
        textLight: 'text-lime-700',
        borderHover: 'hover:border-lime-300'
    },
    {
        icon: Activity,
        title: 'Real-Time Dashboard',
        desc: 'Live stats and patient data across all portals, always up to date.',
        color: 'from-teal-400 to-emerald-500',
        bgLight: 'bg-teal-50',
        textLight: 'text-teal-600',
        borderHover: 'hover:border-teal-300'
    },
    {
        icon: Clock,
        title: 'Appointment System',
        desc: 'Patients book slots, doctors manage schedules, admins oversee everything.',
        color: 'from-cyan-500 to-teal-500',
        bgLight: 'bg-cyan-50',
        textLight: 'text-cyan-600',
        borderHover: 'hover:border-cyan-300'
    },
];

const ROLES = [
    { role: 'Admin', desc: 'Full system control', icon: ShieldCheck, color: 'from-teal-600 to-emerald-700', path: '/login', shadowColor: 'shadow-teal-600/20' },
    { role: 'Doctor', desc: 'Manage patients & reports', icon: Stethoscope, color: 'from-emerald-500 to-teal-600', path: '/login', shadowColor: 'shadow-emerald-500/20' },
    { role: 'Nurse', desc: 'Ward notes & search', icon: Activity, color: 'from-green-500 to-emerald-500', path: '/login', shadowColor: 'shadow-green-500/20' },
    { role: 'Patient', desc: 'View records & book', icon: Users, color: 'from-cyan-500 to-teal-500', path: '/login', shadowColor: 'shadow-cyan-500/20' },
];

export default function LandingPage() {
    const [scrolled, setScrolled] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        setTimeout(() => setVisible(true), 100);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <div className="min-h-screen bg-[#f0fdfa] text-slate-800 overflow-x-hidden font-sans selection:bg-emerald-500/30">

            {/* ── NAVBAR ───────────────────────────── */}
            <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/90 backdrop-blur-xl border-b border-teal-100 shadow-sm py-3' : 'bg-transparent py-5'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Stethoscope className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900">Medi<span className="text-emerald-600">Discharge</span></span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
                        <a href="#features" className="hover:text-emerald-600 transition-colors">Features</a>
                        <a href="#portals" className="hover:text-emerald-600 transition-colors">Portals</a>
                    </div>
                    <Link
                        to="/login"
                        className="flex items-center gap-2 bg-slate-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-emerald-600 transition-all shadow-md hover:-translate-y-0.5"
                    >
                        Sign In <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </nav>

            {/* ── LIGHT HERO ───────────────────────────── */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-16">
                {/* Clean Animated Background */}
                <div className="absolute inset-0 bg-[#f0fdfa] overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-[#ccfbf1] via-white/50 to-transparent" />

                    {/* Soft Orbs */}
                    <div className="absolute top-20 -left-20 w-[600px] h-[600px] bg-emerald-200/50 rounded-full blur-[120px] animate-pulse-slow mix-blend-multiply" />
                    <div className="absolute bottom-20 -right-20 w-[500px] h-[500px] bg-teal-200/50 rounded-full blur-[120px] animate-pulse-slow mix-blend-multiply" style={{ animationDelay: '2s' }} />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

                    {/* Hero Text Content */}
                    <div className={`transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                        <div className="inline-flex items-center gap-2.5 bg-white border border-emerald-200/60 shadow-sm rounded-full px-4 py-2 text-xs font-bold text-emerald-700 mb-8 uppercase tracking-widest">
                            <Sparkles className="w-4 h-4 text-emerald-500" />
                            Next-Generation Medical AI
                        </div>

                        <h1 className="text-5xl lg:text-[4.5rem] font-extrabold leading-[1.1] tracking-tight mb-6 text-slate-900">
                            Intelligent Care, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                                Zero Friction.
                            </span>
                        </h1>

                        <p className="text-lg lg:text-xl text-slate-600 leading-relaxed max-w-xl mb-10 font-medium">
                            Create accurate AI discharge summaries in seconds, sync patient records in real-time, and manage everything from a secure, clean platform.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                to="/login"
                                className="group relative inline-flex items-center justify-center gap-3 bg-emerald-600 text-white font-bold px-8 py-4 rounded-2xl transition-all hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 hover:-translate-y-1 text-base overflow-hidden"
                            >
                                <Stethoscope className="w-5 h-5 relative z-10" />
                                <span className="relative z-10">Launch Dashboard</span>
                                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <a
                                href="#features"
                                className="inline-flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 font-bold px-8 py-4 rounded-2xl hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-all text-base shadow-sm group hover:-translate-y-1"
                            >
                                Explore Features
                                <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                            </a>
                        </div>

                        <div className="flex items-center gap-6 mt-12 pt-8 border-t border-emerald-900/10">
                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className={`w-10 h-10 rounded-full border-2 border-[#f0fdfa] bg-teal-100 shadow-sm z-[${5 - i}]`} />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-1 text-amber-500">
                                    {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                                </div>
                                <p className="text-sm font-semibold text-slate-600 mt-1">Trusted by <span className="text-slate-900 font-bold">500+</span> clinicians</p>
                            </div>
                        </div>
                    </div>

                    {/* Clean 3D UI Mockup */}
                    <div className={`relative hidden lg:block transition-all duration-1000 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}>
                        <div className="relative w-full aspect-square perspective-[1200px]">
                            {/* Main Report Card */}
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-2xl p-8 rounded-[3rem] shadow-2xl shadow-teal-900/10 border border-white flex flex-col justify-between transform rotate-y-[-10deg] rotate-x-[5deg] animate-float z-10">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/20 rounded-[3rem] pointer-events-none" />
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-teal-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                                                <Brain className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-lg">AI Diagnosis</h3>
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Auto-Generated</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                                            <ShieldCheck className="w-4 h-4" /> Secure
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="h-4 w-1/3 bg-slate-200 rounded-full" />
                                        <div className="space-y-3">
                                            <div className="h-3 w-full bg-slate-100 rounded-full" />
                                            <div className="h-3 w-5/6 bg-slate-100 rounded-full" />
                                            <div className="h-3 w-4/6 bg-slate-100 rounded-full" />
                                        </div>
                                    </div>

                                    <div className="mt-8 grid grid-cols-2 gap-4">
                                        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex flex-col gap-2">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><Activity className="w-4 h-4" /></div>
                                            <div className="h-2 w-1/2 bg-slate-200 rounded-full mt-2" />
                                            <div className="h-2 w-3/4 bg-slate-200 rounded-full" />
                                        </div>
                                        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex flex-col gap-2">
                                            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600"><FileText className="w-4 h-4" /></div>
                                            <div className="h-2 w-1/2 bg-slate-200 rounded-full mt-2" />
                                            <div className="h-2 w-2/3 bg-slate-200 rounded-full" />
                                        </div>
                                    </div>
                                </div>
                                <div className="relative z-10 h-14 w-full bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer rounded-2xl mt-6 flex items-center justify-center gap-2 text-sm font-bold text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="w-5 h-5" /> Sign & Approve Report
                                </div>
                            </div>

                            {/* Floating Side Card 1 (Vitals) */}
                            <div className="absolute -right-8 top-12 bg-white/80 backdrop-blur-xl p-5 rounded-3xl w-64 shadow-2xl shadow-slate-300/50 border border-white animate-float-delayed transform rotate-y-[-15deg] translate-z-24 z-20">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center">
                                        <Activity className="w-6 h-6 text-rose-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Heart Rate</p>
                                        <p className="text-2xl font-black text-slate-900 tracking-tight">72 <span className="text-sm font-semibold text-slate-500">bpm</span></p>
                                    </div>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="w-2/3 h-full bg-rose-500 rounded-full" />
                                </div>
                            </div>

                            {/* Floating Side Card 2 (Nurse Note) */}
                            <div className="absolute -left-12 bottom-20 bg-white/80 backdrop-blur-xl p-5 rounded-3xl w-64 shadow-2xl shadow-slate-300/50 border border-white animate-float transform rotate-y-[10deg] translate-z-12 z-20">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
                                        <Users className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-900">Nurse Station A</span>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                    <p className="text-xs font-medium text-slate-600 leading-relaxed">Patient resting comfortably. Vitals stable. Medication administered.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FEATURES ───────────────────────────── */}
            <section id="features" className="py-24 relative bg-white">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-20 max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-full px-4 py-2 text-xs font-bold text-emerald-700 mb-6 uppercase tracking-widest">
                            <Sparkles className="w-3 h-3 text-emerald-500" /> Platform Capabilities
                        </div>
                        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 text-slate-900">
                            Engineered for <span className="text-emerald-600">Clinical Flow</span>
                        </h2>
                        <p className="text-slate-500 text-lg md:text-xl font-medium">
                            A clean, modern interface packed with powerful tools to reduce documentation time and improve patient safety.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {FEATURES.map(({ icon: Icon, title, desc, color, bgLight, textLight, borderHover }) => (
                            <div key={title}
                                className={`group bg-white border border-slate-100 ${borderHover} rounded-[2rem] p-8 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-900/5 hover:-translate-y-1`}
                            >
                                <div className={`w-14 h-14 rounded-2xl ${bgLight} flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110`}>
                                    <Icon className={`w-7 h-7 ${textLight}`} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
                                <p className="text-slate-600 leading-relaxed font-medium">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── PORTALS ────────────────────────────── */}
            <section id="portals" className="py-24 relative bg-[#f0fdfa] border-t border-emerald-100">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-16 max-w-2xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-white border border-emerald-200 rounded-full px-4 py-2 text-xs font-bold text-emerald-700 mb-6 uppercase tracking-widest shadow-sm">
                            <Users className="w-3 h-3" /> Dedicated Interfaces
                        </div>
                        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 text-slate-900">
                            One Platform, <br className="md:hidden" />
                            <span className="text-emerald-600">Four Portals</span>
                        </h2>
                        <p className="text-slate-500 text-lg font-medium">
                            Tailored experiences for every role. Log in to your specific dashboard.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {ROLES.map(({ role, desc, icon: Icon, color, path, shadowColor }) => (
                            <Link key={role} to={path}
                                className={`group bg-white border border-emerald-100 rounded-3xl p-8 text-center transition-all duration-300 hover:shadow-2xl ${shadowColor} hover:-translate-y-2 flex flex-col items-center hover:border-emerald-300`}
                            >
                                <div className={`w-20 h-20 rounded-[1.5rem] bg-gradient-to-br ${color} flex items-center justify-center mb-6 text-white shadow-lg group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                                    <Icon className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-extrabold text-slate-900 mb-2">{role}</h3>
                                <p className="text-sm font-medium text-slate-500 mb-8 flex-1">{desc}</p>

                                <div className="inline-flex items-center justify-center gap-2 text-emerald-800 font-bold bg-emerald-50 group-hover:bg-emerald-100 transition-colors rounded-xl w-full py-3 mt-auto">
                                    Authenticate <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA BANNER ────────────────────────── */}
            <section className="py-24 relative bg-white overflow-hidden">
                <div className="max-w-5xl mx-auto px-6 relative z-10">
                    <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-12 md:p-16 text-center relative overflow-hidden shadow-2xl shadow-emerald-900/20">
                        {/* Light sweeps */}
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-500/20 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2 pointer-events-none" />

                        <div className="relative z-10 flex flex-col items-center">
                            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
                                Ready to Upgrade <br className="hidden md:block" />
                                Patient Management?
                            </h2>

                            <p className="text-slate-300 text-lg md:text-xl mb-10 max-w-2xl font-medium">
                                Join healthcare professionals using our secure, AI-powered platform to deliver better outcomes.
                            </p>

                            <Link
                                to="/login"
                                className="inline-flex items-center gap-3 bg-emerald-600 text-white font-bold px-10 py-5 rounded-full hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-1 text-lg"
                            >
                                Get Started <ArrowRight className="w-6 h-6" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ────────────────────────────── */}
            <footer className="py-10 bg-[#f0fdfa] border-t border-emerald-100">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                            <Stethoscope className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-slate-800 text-sm">MediDischarge AI Platform</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                        © 2026 MediDischarge · Powered by Google Gemini AI · Firebase Secured
                    </p>
                </div>
            </footer>
        </div>
    );
}

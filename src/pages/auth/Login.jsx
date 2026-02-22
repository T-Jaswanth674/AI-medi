import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Activity, Eye, EyeOff, Lock, Mail, AlertCircle, Stethoscope, ChevronRight } from 'lucide-react';

const ROLE_ROUTES = {
    admin: '/admin',
    doctor: '/doctor',
    nurse: '/nurse',
    patient: '/patient',
};

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, userProfile, currentUser } = useAuth();
    const navigate = useNavigate();

    // Redirect already-authenticated users to their dashboard
    useEffect(() => {
        if (currentUser && userProfile) {
            const route = ROLE_ROUTES[userProfile.role] || '/';
            navigate(route, { replace: true });
        }
    }, [currentUser, userProfile, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            // Navigation handled by useEffect
        } catch (err) {
            if (err.code === 'auth/account-disabled') {
                setError(err.message);
            } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
                setError('Invalid email or password.');
            } else if (err.code === 'auth/user-not-found') {
                setError('No account found with this email.');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Too many attempts. Please try again later.');
            } else {
                setError('Login failed. Please check your credentials.');
            }
        } finally {
            setLoading(false);
        }
    };

    const fillDemo = (role) => {
        const demos = {
            admin: { email: 'admin@hospital.com', password: 'admin123' },
            doctor: { email: 'doctor@hospital.com', password: 'doctor123' },
            nurse: { email: 'nurse@hospital.com', password: 'nurse123' },
            patient: { email: 'patient@hospital.com', password: 'patient123' },
        };
        setEmail(demos[role].email);
        setPassword(demos[role].password);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden selection:bg-brand-200">
            {/* Background elements */}
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none"></div>
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-400/20 rounded-full blur-[120px] pointer-events-none mix-blend-multiply" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-300/20 rounded-full blur-[120px] pointer-events-none mix-blend-multiply" />

            <div className="w-full max-w-md relative z-10 animate-fade-in">
                {/* Logo Section */}
                <div className="text-center mb-8 animate-slide-up">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white border border-slate-100 rounded-3xl shadow-xl shadow-brand-500/10 mb-6 rotate-3 hover:rotate-0 transition-transform duration-500">
                        <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center">
                            <Stethoscope className="w-8 h-8 text-brand-600" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">
                        Medi<span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-teal-400">Discharge</span>
                    </h1>
                    <p className="text-slate-500 text-sm mt-3 font-medium">Smart AI-Powered Healthcare OS</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/80 backdrop-blur-xl border border-white rounded-3xl p-8 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] relative overflow-hidden animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-400 to-teal-400"></div>

                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-slate-900">Sign in</h2>
                        <p className="text-sm text-slate-500 mt-1">Welcome back! Please enter your details.</p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 mb-6 animate-fade-in">
                            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                            <p className="text-rose-600 text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label htmlFor="email" className="label ml-1">Email</label>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-400 group-focus-within:bg-brand-50 group-focus-within:text-brand-600 transition-colors">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input pl-14 h-12 text-base shadow-sm"
                                    placeholder="name@hospital.com"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label htmlFor="password" className="label !mb-0">Password</label>
                                <a href="#" className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline">Forgot?</a>
                            </div>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-400 group-focus-within:bg-brand-50 group-focus-within:text-brand-600 transition-colors">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input pl-14 pr-12 h-12 text-base shadow-sm"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full h-12 justify-center mt-2 text-[15px] shadow-brand-500/20"
                        >
                            {loading ? (
                                <>
                                    <Activity className="w-5 h-5 animate-spin" />
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <>
                                    <span>Sign in</span>
                                    <ChevronRight className="w-4 h-4 ml-1 opacity-70" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Quick Demo Access */}
                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400 text-center mb-4">Quick Demo Access</p>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { role: 'admin', label: 'Admin', color: 'text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-100' },
                                { role: 'doctor', label: 'Doctor', color: 'text-brand-700 bg-brand-50 hover:bg-brand-100 border-brand-100' },
                                { role: 'nurse', label: 'Nurse', color: 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-100' },
                                { role: 'patient', label: 'Patient', color: 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-100' },
                            ].map(({ role, label, color }) => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => fillDemo(role)}
                                    className={`text-xs font-bold px-4 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer shadow-sm hover:shadow active:scale-95 ${color}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <p className="text-center text-xs font-medium text-slate-400 mt-8">
                    &copy; {new Date().getFullYear()} MediDischarge OS. All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default Login;

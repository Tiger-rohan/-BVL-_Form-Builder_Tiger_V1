import React, { useState } from 'react';
import { useAuth } from './AuthContext.tsx';
import { Mail, Lock, User, AlertCircle, ArrowRight, CheckCircle2, Shield } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultMode = 'login' }) => {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) throw new Error('Full Name is required.');
        if (!email.trim()) throw new Error('Email is required.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');
        await signup(name, email, password);
      } else {
        if (!email.trim() || !password) throw new Error('Email and password are required.');
        await login(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (role: 'lead' | 'researcher') => {
    if (role === 'lead') {
      setName('Alex Rivera');
      setEmail('alex.rivera@formforge.dev');
      setPassword('password123');
    } else {
      setName('Dana Kim');
      setEmail('dana.kim@formforge.dev');
      setPassword('password123');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white text-center relative">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md mb-3 border border-white/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            {mode === 'login' ? 'Welcome Back to FormForge' : 'Create FormForge Account'}
          </h2>
          <p className="text-emerald-100 text-xs mt-1 max-w-xs mx-auto">
            {mode === 'login'
              ? 'Sign in to access your forms, versions, and respondent data'
              : 'Deploy forms, collect field data, and analyze responses with full RLS protection'}
          </p>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white text-lg font-semibold w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition"
          >
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 p-1">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              mode === 'login'
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              mode === 'signup'
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Jane Smith"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.org"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm transition shadow-sm hover:shadow flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In to Dashboard' : 'Complete Registration'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Quick Demo Autofill */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
              <span>Quick Test Credentials:</span>
              <span className="text-emerald-600 font-medium">Click to fill</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillQuickDemo('lead')}
                className="text-left p-2 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition text-[11px]"
              >
                <div className="font-semibold text-slate-700">Project Lead</div>
                <div className="text-slate-400 truncate">alex.rivera@formforge.dev</div>
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo('researcher')}
                className="text-left p-2 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition text-[11px]"
              >
                <div className="font-semibold text-slate-700">Field Researcher</div>
                <div className="text-slate-400 truncate">dana.kim@formforge.dev</div>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

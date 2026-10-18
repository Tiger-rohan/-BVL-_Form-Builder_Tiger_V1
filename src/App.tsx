import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './modules/auth/AuthContext.tsx';
import { AuthModal } from './modules/auth/AuthModal.tsx';
import { FormsDashboard } from './modules/dashboard/FormsDashboard.tsx';
import { FormBuilder } from './modules/builder/FormBuilder.tsx';
import { ResponsesDashboard } from './modules/responses/ResponsesDashboard.tsx';
import { PublicFormPage } from './modules/public/PublicFormPage.tsx';
import { EmbedFormPage } from './modules/embed/EmbedFormPage.tsx';
import { IntegrationPlayground } from './modules/playground/IntegrationPlayground.tsx';
import { DocsModal } from './modules/docs/DocsModal.tsx';
import { DatabaseStatusBadge } from './components/DatabaseStatusBadge.tsx';
import {
  Layers,
  FileText,
  LogOut,
  User,
  Shield,
  BookOpen,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Database,
  Lock,
  Key,
  Cpu,
} from 'lucide-react';

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [docsModalOpen, setDocsModalOpen] = useState(false);

  // Hash-based router
  const [route, setRoute] = useState<{
    page: 'dashboard' | 'builder' | 'responses' | 'public-form' | 'embed-form' | 'playground';
    param?: string;
  }>(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#form/')) {
      return { page: 'public-form', param: hash.replace('#form/', '') };
    }
    if (hash.startsWith('#embed/')) {
      return { page: 'embed-form', param: hash.replace('#embed/', '') };
    }
    if (hash.startsWith('#builder/')) {
      return { page: 'builder', param: hash.replace('#builder/', '') };
    }
    if (hash.startsWith('#responses/')) {
      return { page: 'responses', param: hash.replace('#responses/', '') };
    }
    if (hash === '#playground') {
      return { page: 'playground' };
    }
    return { page: 'dashboard' };
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#form/')) {
        setRoute({ page: 'public-form', param: hash.replace('#form/', '') });
      } else if (hash.startsWith('#embed/')) {
        setRoute({ page: 'embed-form', param: hash.replace('#embed/', '') });
      } else if (hash.startsWith('#builder/')) {
        setRoute({ page: 'builder', param: hash.replace('#builder/', '') });
      } else if (hash.startsWith('#responses/')) {
        setRoute({ page: 'responses', param: hash.replace('#responses/', '') });
      } else if (hash === '#playground') {
        setRoute({ page: 'playground' });
      } else {
        setRoute({ page: 'dashboard' });
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (page: string, param?: string) => {
    if (param) {
      window.location.hash = `#${page}/${param}`;
    } else {
      window.location.hash = `#${page}`;
    }
  };

  // Standalone embed route does not render outer navigation chrome
  if (route.page === 'embed-form' && route.param) {
    return <EmbedFormPage slug={route.param} />;
  }

  // Standalone public form route
  if (route.page === 'public-form' && route.param) {
    return (
      <PublicFormPage
        slug={route.param}
        onGoHome={() => {
          window.location.hash = '#dashboard';
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Platform Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateTo('dashboard')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold text-slate-900 tracking-tight">
                    FormForge
                  </span>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    KoboToolbox Architecture
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Reusable Form Builder & Collection Engine
                </div>
              </div>
            </button>
          </div>

          {/* Navigation Links & User Bar */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => navigateTo('dashboard')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  route.page !== 'playground'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hosted Dashboard
              </button>
              <button
                type="button"
                onClick={() => navigateTo('playground')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  route.page === 'playground'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                <span>Framework Lab (Adapters)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setDocsModalOpen(true)}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Architecture & RLS</span>
            </button>

            <DatabaseStatusBadge />

            {loading ? (
              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-800">{user.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">
                    {user.email}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const token = localStorage.getItem('formforge_auth_token');
                    if (token) {
                      navigator.clipboard.writeText(token);
                      alert('JWT Token copied to clipboard!');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold transition"
                  title="Copy your active JWT token to clipboard"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Copy JWT</span>
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 text-xs font-semibold transition"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthModalOpen(true);
                  }}
                  className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* If user is not logged in, show auth gate banner */}
        {!user && !loading && (
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-10 mb-8 shadow-xl relative overflow-hidden">
            <div className="relative z-10 max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-medium">
                <Shield className="w-3.5 h-3.5" />
                <span>Phase 1 Core Platform Ready</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Enterprise Form Building with PostgreSQL & Supabase RLS
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Build versioned survey schemas with 8 question types, deploy public forms with server-side validation, manage respondents, and isolate user data with Row Level Security.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthModalOpen(true);
                  }}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
                >
                  <span>Sign Up / Quick Test Login</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDocsModalOpen(true)}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 transition"
                >
                  View Architecture & Schema
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Router */}
        {route.page === 'playground' ? (
          <IntegrationPlayground />
        ) : route.page === 'builder' && route.param ? (
          <FormBuilder
            formId={route.param}
            onBack={() => navigateTo('dashboard')}
            onViewResponses={(id) => navigateTo('responses', id)}
          />
        ) : route.page === 'responses' && route.param ? (
          <ResponsesDashboard
            formId={route.param}
            onBack={() => navigateTo('dashboard')}
            onOpenBuilder={(id) => navigateTo('builder', id)}
          />
        ) : (
          <FormsDashboard
            onOpenBuilder={(id) => navigateTo('builder', id)}
            onOpenResponses={(id) => navigateTo('responses', id)}
            onOpenPublicView={(slug) => navigateTo('form', slug)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">FormForge</span>
            <span>•</span>
            <span>Inspired by KoboToolbox & ODK open data architectures</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDocsModalOpen(true)}
              className="hover:text-emerald-700 transition"
            >
              Schema & RLS Policies
            </button>
            <span>•</span>
            <span>PostgreSQL Engine Active</span>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authMode}
      />

      {/* Documentation Modal: JWT Verification, Supabase Integration & RLS */}
      <DocsModal
        isOpen={docsModalOpen}
        onClose={() => setDocsModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

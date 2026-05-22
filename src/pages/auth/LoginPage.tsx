import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getRoleHome } from '../../components/shared/RoleGuard';
import { Droplets, Flame, Truck, Eye, EyeOff, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

export default function LoginPage() {
  const { signIn, role, isLoading, profileError, refetchProfile } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [authError, setAuthError]       = useState('');

  // Redirect as soon as role resolves after sign-in
  useEffect(() => {
    if (!isLoading && role) {
      navigate(getRoleHome(role), { replace: true });
    }
  }, [isLoading, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setSubmitting(true);

    const { error } = await signIn(email.trim(), password);
    setSubmitting(false);

    if (error) {
      // Surface the real Supabase error message so debugging is easy
      if (error.message?.toLowerCase().includes('email not confirmed')) {
        setAuthError('Please confirm your email address first. Check your inbox for the confirmation link.');
      } else if (error.message?.toLowerCase().includes('invalid login')) {
        setAuthError('Incorrect email or password. Double-check your credentials and try again.');
      } else {
        setAuthError(error.message || 'Sign-in failed. Please try again.');
      }
    }
    // On success: onAuthStateChange fires → profile loads → useEffect above redirects
  };

  // Full-page loader while checking existing session on mount
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
        <Loader2 size={32} className="animate-spin text-blue-600" />
        <p className="text-gray-500 text-sm">Checking session…</p>
      </div>
    );
  }

  // Signed in but no profile row — show actionable error, not infinite spinner
  if (!isLoading && !role && profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="card p-8 max-w-md text-center space-y-4">
          <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle size={26} className="text-amber-600" />
          </div>
          <h2 className="text-xl font-black text-gray-900">Profile Not Found</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{profileError}</p>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left">
            <p className="text-xs font-bold text-gray-700 mb-2">Quick fix — run this in Supabase SQL editor:</p>
            <pre className="text-xs text-blue-700 bg-blue-50 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
{`INSERT INTO profiles (id, full_name, role, status)
VALUES (
  auth.uid(),   -- or paste your user UUID
  'Super Admin Jake',
  'super_admin',
  'active'
);`}
            </pre>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={refetchProfile}
              className="btn bg-blue-700 text-white hover:bg-blue-900 gap-2">
              <RefreshCw size={15} /> Retry
            </button>
            <button onClick={() => { signIn('',''); window.location.reload(); }}
              className="btn-ghost text-sm">
              Sign out &amp; try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[55%] p-12 text-white"
        style={{ background: 'linear-gradient(135deg,#0a0e1a 0%,#111827 40%,#1e293b 100%)' }}
      >
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
              <span className="text-2xl font-black" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>J</span>
            </div>
            <div>
              <p className="font-black text-xl tracking-[0.15em] uppercase" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>
                Jake's Enterprise
              </p>
              <p className="text-white/50 text-xs tracking-widest uppercase">Business Management Platform</p>
            </div>
          </div>

          <h1 className="text-5xl font-black leading-tight mb-6" style={{ fontFamily: "'Playfair Display',serif" }}>
            One platform.<br />
            <span className="text-transparent" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.4)' }}>
              Three businesses.
            </span>
          </h1>
          <p className="text-white/60 text-lg max-w-sm leading-relaxed">
            Water Retail, Restaurant &amp; Butchery, and Water Delivery — managed from a single unified platform.
          </p>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Water Retail',          desc: 'Refill, bottles & dispensing',  icon: <Droplets size={18} />, grad: 'from-blue-800/80 to-blue-600/40',   border: 'border-blue-400/30' },
            { label: 'Restaurant & Butchery', desc: 'Take-away chicken & more',      icon: <Flame    size={18} />, grad: 'from-orange-900/80 to-orange-600/40', border: 'border-orange-400/30' },
            { label: 'Water Delivery',        desc: 'Dispatch, GPS & debt tracking', icon: <Truck    size={18} />, grad: 'from-green-900/80 to-green-600/40',   border: 'border-green-400/30' },
          ].map((b) => (
            <div key={b.label}
              className={`flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r ${b.grad} border ${b.border}`}>
              <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">{b.icon}</div>
              <div>
                <p className="font-bold text-sm">{b.label}</p>
                <p className="text-white/50 text-xs">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-white/30 text-xs">© 2026 Mirie Technologies · All rights reserved</p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10 text-center">
            <h1 className="text-2xl font-black text-gray-900 mb-1" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>
              JAKE'S ENTERPRISE
            </h1>
            <p className="text-gray-500 text-sm">Business Management Platform</p>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Playfair Display',serif" }}>
              Welcome back
            </h2>
            <p className="text-gray-500">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email" value={email} required
                onChange={(e) => { setEmail(e.target.value); setAuthError(''); }}
                placeholder="you@example.com"
                className="input-field"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} value={password} required
                  onChange={(e) => { setPassword(e.target.value); setAuthError(''); }}
                  placeholder="••••••••"
                  className="input-field pr-10"
                  autoComplete="current-password"
                />
                <button type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Auth error — shows real Supabase message */}
            {authError && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit" disabled={submitting}
              className="w-full btn bg-gray-900 text-white hover:bg-gray-700 justify-center py-3 text-base shadow-lg disabled:opacity-60"
            >
              {submitting && <Loader2 size={18} className="animate-spin" />}
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-xs text-blue-700 font-medium mb-1">Need an account?</p>
            <p className="text-xs text-blue-600">
              Accounts are created by administrators only. Contact your system administrator for access.
            </p>
          </div>

          {/* Debug helper in development */}
          {process.env.NODE_ENV === 'development' && (
            <p className="text-center text-[10px] text-gray-300 mt-4">
              Supabase URL: {process.env.REACT_APP_SUPABASE_URL ? '✓ set' : '✗ missing'} ·
              Anon key: {process.env.REACT_APP_SUPABASE_ANON_KEY ? '✓ set' : '✗ missing'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useOrgTheme } from '../../lib/OrgThemeContext.tsx';
import {
  Lock,
  Mail,
  HeartHandshake,
  ArrowRight,
  Sparkles,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import api from '../../lib/api.js';

export const LoginPage: React.FC = () => {
  const { org } = useOrgTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const performLogin = async (loginEmail: string, loginPass: string) => {
    setIsLoading(true);
    setMsg(null);

    try {
      const res = await api.post('/api/v1/auth/login', {
        email: loginEmail,
        password: loginPass,
      });

      if (!res.data.success) {
        throw new Error(res.data.error || 'Authentication failed');
      }

      const { token, user } = res.data.data;
      localStorage.setItem('crystal_jwt', token);
      localStorage.setItem('crystal_user', JSON.stringify(user));

      setMsg({
        type: 'success',
        text: `Authenticated as ${user.email} (${user.role}). Redirecting...`,
      });

      let destination: string;
      if (user.role === 'super_admin' || user.role === 'agency_admin') {
        destination = '/admin';
      } else if (user.role === 'care_coordinator' || user.role === 'registered_nurse') {
        destination = '/clients';
      } else {
        destination = '/caregiver/portal';
      }

      setTimeout(() => {
        navigate(destination);
      }, 500);
    } catch (err: unknown) {
      setMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to connect to authentication service.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(email, password);
  };

  return (
    <div className="py-12 px-4 sm:px-6 max-w-md mx-auto space-y-8">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 mb-2">
          <HeartHandshake className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          {org?.name || 'Crystal Healthcare Platform'}
        </h1>
        <p className="text-xs text-slate-400">
          Secure sign-in for caregivers, clinical supervisors, and agency administrators.
        </p>
      </div>

      {/* Form Box */}
      <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        {msg && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              msg.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}
          >
            {msg.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{msg.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1.5">
              <Mail className="w-3.5 h-3.5 text-teal-400" />
              <span>Email Address</span>
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-400 focus:outline-none focus:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-400"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-teal-400" />
              <span>Password</span>
            </label>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-400 focus:outline-none focus:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-400"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{ backgroundColor: 'var(--primary, #0F766E)' }}
            className="w-full py-2.5 rounded-lg text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Sign In to Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800 text-center space-y-2 text-xs">
          <span className="text-slate-400 block">Looking to become a caregiver?</span>
          <Link
            to="/apply"
            className="inline-flex items-center space-x-1 text-teal-400 font-semibold hover:underline"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Apply online with our 5-step wizard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

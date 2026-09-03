import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrgTheme } from '../../lib/OrgThemeContext.tsx';
import {
  Lock,
  Mail,
  HeartHandshake,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Loader2,
  Users,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { org } = useOrgTheme();
  const [role, setRole] = useState<'caregiver' | 'client'>('caregiver');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setMsg(`Prototype Mode: Authentication for ${role === 'caregiver' ? 'Caregiver Employee' : 'Client Family'} portal will connect to Supabase Auth.`);
    }, 600);
  };

  return (
    <div className="py-12 px-4 sm:px-6 max-w-md mx-auto space-y-8">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-2">
          <HeartHandshake className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          {org?.name || 'Care Portal'}
        </h1>
        <p className="text-xs text-slate-400">
          Sign in to access your attendant shifts, EVV logs, or SFC family coaching notes.
        </p>
      </div>

      {/* Role Toggle */}
      <div className="p-1 rounded-xl bg-slate-900 border border-slate-800 flex text-xs font-semibold">
        <button
          type="button"
          onClick={() => setRole('caregiver')}
          className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
            role === 'caregiver'
              ? 'bg-blue-700 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Caregiver Staff</span>
        </button>
        <button
          type="button"
          onClick={() => setRole('client')}
          className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
            role === 'client'
              ? 'bg-blue-700 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Client & Family</span>
        </button>
      </div>

      {/* Form Box */}
      <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        {msg && (
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs">
            {msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span>Password</span>
              </label>
              <a href="#forgot" className="text-[11px] text-blue-400 hover:underline">
                Forgot?
              </a>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{ backgroundColor: 'var(--primary, #1E3A8A)' }}
            className="w-full py-2.5 rounded-lg text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
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
          <span className="text-slate-400 block">Looking to become an attendant caregiver?</span>
          <Link
            to="/apply"
            className="inline-flex items-center space-x-1 text-blue-400 font-semibold hover:underline"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Apply online with our 5-step wizard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

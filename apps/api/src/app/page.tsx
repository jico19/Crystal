import { ShieldCheck, Layers, Globe, ExternalLink, Activity, Users, FileText } from 'lucide-react';

export default function ApiHubPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16 space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
          <Activity className="w-3.5 h-3.5" />
          Unified API & Local Development Hub (Port 3000)
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          Crystal Multi-State Home Care Platform
        </h1>
        <p className="text-lg text-slate-400 max-w-3xl leading-relaxed">
          Modular Monolith architecture connecting dedicated state-specific frontend applications with a centralized backend and unified super admin governance.
        </p>
      </div>

      {/* Dedicated State Websites */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Georgia App Card */}
        <div className="rounded-2xl bg-slate-800/80 border border-teal-500/30 p-8 space-y-6 hover:border-teal-500/60 transition-all shadow-xl">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-lg">
              GA
            </div>
            <span className="px-2.5 py-1 rounded-md bg-teal-500/10 text-teal-300 text-xs font-semibold">
              Port :3001
            </span>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-white">With Open Hands</h3>
            <p className="text-sm text-slate-400 mt-1">
              Georgia Dedicated State App • Atlanta Headquarters
            </p>
            <p className="text-xs text-teal-400/80 font-mono mt-2">License: GA-HCPR-049281</p>
          </div>

          <p className="text-sm text-slate-300">
            Dedicated website experience with Georgia DCH licensing disclosures, personal care services, and local Atlanta contact capture.
          </p>

          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition-colors"
          >
            Launch Georgia App (withopenhands.com)
            <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </div>

        {/* Indiana App Card */}
        <div className="rounded-2xl bg-slate-800/80 border border-blue-500/30 p-8 space-y-6 hover:border-blue-500/60 transition-all shadow-xl">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg">
              IN
            </div>
            <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-300 text-xs font-semibold">
              Port :3002
            </span>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-white">Cherish Open Arms</h3>
            <p className="text-sm text-slate-400 mt-1">
              Indiana Dedicated State App • Indianapolis Headquarters
            </p>
            <p className="text-xs text-blue-400/80 font-mono mt-2">License: IN-FSSA-982104</p>
          </div>

          <p className="text-sm text-slate-300">
            Dedicated website experience with Indiana FSSA licensing disclosures, structured family caregiving coaching, and local Indianapolis contact capture.
          </p>

          <a
            href="http://localhost:3002"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors"
          >
            Launch Indiana App (cherishopenarms.com)
            <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </div>
      </div>

      {/* Admin Governance Quick Link */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-800 to-indigo-950/70 border border-slate-700 p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start text-indigo-400 text-sm font-semibold">
            <ShieldCheck className="w-5 h-5" />
            Super Administrator Governance
          </div>
          <h3 className="text-2xl font-bold text-white">Unified Admin Dashboard</h3>
          <p className="text-sm text-slate-400 max-w-xl">
            Review incoming leads, caregiver applications, compliance metrics, and authorizations across all states in one centralized place.
          </p>
        </div>

        <a
          href="/admin"
          className="shrink-0 py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors shadow-lg shadow-indigo-900/30"
        >
          Open Admin Portal →
        </a>
      </div>

      {/* API Endpoint Documentation */}
      <div className="rounded-2xl bg-slate-800/40 border border-slate-800 p-6 space-y-4">
        <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold">
          Active Centralized API Endpoints
        </h4>
        <div className="font-mono text-xs text-slate-300 space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between py-1 border-b border-slate-800">
            <span className="text-emerald-400 font-bold">GET</span>
            <span className="text-slate-400">/api/v1/inquiries</span>
            <span className="text-slate-500">List inquiries (supports ?state_code=GA|IN)</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-blue-400 font-bold">POST</span>
            <span className="text-slate-400">/api/v1/inquiries</span>
            <span className="text-slate-500">Submit new lead (Zod validated)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

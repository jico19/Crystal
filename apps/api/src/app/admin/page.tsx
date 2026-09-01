'use client';

import * as React from 'react';
import type { PublicInquiry, StateCode } from '@crystal/types';
import { mockInquiries } from '@/lib/store';
import {
  ShieldCheck,
  Building2,
  Users,
  Inbox,
  Clock,
  Filter,
  CheckCircle,
  Phone,
  Mail,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const [selectedState, setSelectedState] = React.useState<StateCode | 'ALL'>('ALL');
  const [inquiries, setInquiries] = React.useState<PublicInquiry[]>(mockInquiries);
  const [selectedInquiry, setSelectedInquiry] = React.useState<PublicInquiry | null>(null);

  const filteredInquiries = inquiries.filter((inq) => {
    if (selectedState === 'ALL') return true;
    return inq.state_code === selectedState;
  });

  const gaCount = inquiries.filter((i) => i.state_code === 'GA').length;
  const inCount = inquiries.filter((i) => i.state_code === 'IN').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-10 space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            Super Administrator Governance
          </div>
          <h1 className="text-3xl font-extrabold text-white">Central Admin Dashboard</h1>
          <p className="text-sm text-slate-400">
            Cross-state lead inquiries, compliance status, and operations governance.
          </p>
        </div>

        <a
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 py-2 px-3 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dev Portal
        </a>
      </div>

      {/* State Filter & Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <button
          type="button"
          onClick={() => setSelectedState('ALL')}
          className={`p-6 rounded-2xl border text-left transition-all ${
            selectedState === 'ALL'
              ? 'bg-indigo-950/60 border-indigo-500 shadow-lg shadow-indigo-950/50'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase">
            <span>All State Operations</span>
            <Building2 className="w-4 h-4" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">{inquiries.length}</div>
          <div className="text-xs text-slate-400 mt-1">Total inquiries across all states</div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedState('GA')}
          className={`p-6 rounded-2xl border text-left transition-all ${
            selectedState === 'GA'
              ? 'bg-teal-950/60 border-teal-500 shadow-lg shadow-teal-950/50'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex justify-between items-center text-teal-400 text-xs font-semibold uppercase">
            <span>Georgia (With Open Hands)</span>
            <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono text-[10px]">GA</span>
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">{gaCount}</div>
          <div className="text-xs text-slate-400 mt-1">Atlanta office leads & inquiries</div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedState('IN')}
          className={`p-6 rounded-2xl border text-left transition-all ${
            selectedState === 'IN'
              ? 'bg-blue-950/60 border-blue-500 shadow-lg shadow-blue-950/50'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex justify-between items-center text-blue-400 text-xs font-semibold uppercase">
            <span>Indiana (Cherish Open Arms)</span>
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px]">IN</span>
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">{inCount}</div>
          <div className="text-xs text-slate-400 mt-1">Indianapolis office leads & inquiries</div>
        </button>
      </div>

      {/* Main Table / Grid View */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-white">Incoming Inquiries Pipeline</h3>
            <p className="text-xs text-slate-400">
              Showing {filteredInquiries.length} records {selectedState !== 'ALL' ? `for state: ${selectedState}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Filter:</span>
            <span className="font-semibold text-indigo-400">{selectedState}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">State</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Inquiry Type</th>
                <th className="px-6 py-4">Message Preview</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Received</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredInquiries.map((inquiry) => (
                <tr key={inquiry.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold font-mono ${
                        inquiry.state_code === 'GA'
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {inquiry.state_code}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-white">{inquiry.full_name}</div>
                    <div className="text-xs text-slate-400">{inquiry.phone}</div>
                    <div className="text-xs text-slate-400">{inquiry.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-medium text-slate-300 capitalize">
                      {inquiry.inquiry_type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate text-xs text-slate-400">
                    {inquiry.message}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        inquiry.status === 'new'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {inquiry.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                    {new Date(inquiry.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedInquiry(inquiry)}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inquiry Detail Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold ${
                    selectedInquiry.state_code === 'GA'
                      ? 'bg-teal-500/20 text-teal-300'
                      : 'bg-blue-500/20 text-blue-300'
                  }`}
                >
                  {selectedInquiry.state_code} Organization
                </span>
                <h3 className="text-xl font-bold text-white mt-1">{selectedInquiry.full_name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <div>
                <div className="text-xs text-slate-500 font-semibold uppercase">Inquiry Type</div>
                <div className="capitalize">{selectedInquiry.inquiry_type.replace(/_/g, ' ')}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold uppercase">Contact Information</div>
                <div>Phone: {selectedInquiry.phone}</div>
                <div>Email: {selectedInquiry.email}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold uppercase">Message Content</div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 whitespace-pre-wrap">
                  {selectedInquiry.message}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold uppercase">Source URL</div>
                <div className="text-xs text-indigo-400 font-mono break-all">{selectedInquiry.source_url}</div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import type { CaregiverDocument, DocumentCategory } from '@crystal/types';
import { Badge, Button } from '@crystal/ui';
import { FileText, Upload, Eye, AlertCircle, Clock } from 'lucide-react';

export interface DocumentRowItem {
  category: DocumentCategory;
  label: string;
  description: string;
  isMandatory: boolean;
  document?: CaregiverDocument;
}

export interface DocumentChecklistTableProps {
  items: DocumentRowItem[];
  errorMessage?: string | null;
  onRetry?: () => void;
  onUploadClick: (category: DocumentCategory) => void;
  onViewClick: (documentId: string) => void;
}

export const DocumentChecklistTable: React.FC<DocumentChecklistTableProps> = ({
  items,
  errorMessage,
  onRetry,
  onUploadClick,
  onViewClick,
}) => {
  const getStatusBadge = (doc?: CaregiverDocument) => {
    if (!doc) {
      return (
        <Badge variant="warning" size="sm">
          Missing
        </Badge>
      );
    }

    switch (doc.verification_status) {
      case 'approved':
        return (
          <Badge variant="success" size="sm">
            Approved
          </Badge>
        );
      case 'under_review':
      case 'pending_upload':
        return (
          <Badge variant="info" size="sm">
            Under Review
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="danger" size="sm">
            Rejected
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="danger" size="sm">
            Expired
          </Badge>
        );
      default:
        return <Badge size="sm">{doc.verification_status}</Badge>;
    }
  };

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary-600" />
            Compliance Credential Checklist
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Mandatory certifications and legal documents required before client assignment
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="px-6 py-3">Credential / Document</th>
              <th className="px-6 py-3">Required</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Expiration Date</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {errorMessage ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-red-600 bg-red-50/50">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="flex items-center gap-1.5 font-medium text-xs">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span>{errorMessage}</span>
                    </div>
                    {onRetry && (
                      <Button variant="outline" size="sm" onClick={onRetry}>
                        Retry loading documents
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No compliance documents found.
                </td>
              </tr>
            ) : items.map((item) => {
                const doc = item.document;
                return (
                  <tr key={item.category} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-slate-900">{item.label}</div>
                      <div className="text-[11px] text-slate-500">{item.description}</div>
                      {doc?.rejection_reason && (
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-red-600 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Rejection note: {doc.rejection_reason}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      {item.isMandatory ? (
                        <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                          MANDATORY
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          OPTIONAL
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">{getStatusBadge(doc)}</td>
                    <td className="px-6 py-3.5">
                      {doc?.has_no_expiration ? (
                        <span className="text-slate-500 italic">No Expiry (Evergreen)</span>
                      ) : doc?.expiration_date ? (
                        <span className="font-mono text-slate-700 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {doc.expiration_date}
                        </span>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {doc && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewClick(doc.id)}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          View
                        </Button>
                      )}
                      <Button
                        variant={doc?.verification_status === 'approved' ? 'outline' : 'primary'}
                        size="sm"
                        onClick={() => onUploadClick(item.category)}
                        leftIcon={<Upload className="w-3.5 h-3.5" />}
                      >
                        {doc ? 'Replace' : 'Upload'}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

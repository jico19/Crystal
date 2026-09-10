import React, { useState } from 'react';
import { SignatureCanvasPad } from './SignatureCanvasPad.js';
import { ESIGNConsentCheckbox } from './ESIGNConsentCheckbox.js';
import { Button, Input } from '@crystal/ui';
import { FileSignature, AlertCircle, CheckCircle2, Shield } from 'lucide-react';

export interface SignatureContainerModalProps {
  envelopeId: string;
  title: string;
  documentType: string;
  recipientName: string;
  isOpen: boolean;
  onClose: () => void;
  onSign: (data: { fullLegalName: string; signatureDataUrl: string }) => Promise<{ tamperSha256?: string }>;
}

export const SignatureContainerModal: React.FC<SignatureContainerModalProps> = ({
  title,
  documentType,
  recipientName,
  isOpen,
  onClose,
  onSign,
}) => {
  const [legalName, setLegalName] = useState(recipientName);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signedSha256, setSignedSha256] = useState<string | null>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setErrorMsg(null);

    if (!legalName || legalName.trim().length < 2) {
      setErrorMsg('Please enter your full legal name.');
      return;
    }

    if (!signatureData) {
      setErrorMsg('Please draw your signature on the pad.');
      return;
    }

    if (!consentGiven) {
      setErrorMsg('You must check the E-SIGN Act consent checkbox to proceed.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onSign({
        fullLegalName: legalName.trim(),
        signatureDataUrl: signatureData,
      });

      if (result?.tamperSha256) {
        setSignedSha256(result.tamperSha256);
      } else {
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sign-document-modal-title"
        className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden my-8 border border-neutral-200"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <h2 id="sign-document-modal-title" className="text-base font-bold text-neutral-900">Sign Document</h2>
              <p className="text-xs text-neutral-500">{title} • {documentType}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 p-1.5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        {signedSha256 ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900">Document Successfully Signed!</h3>
            <p className="text-xs text-neutral-600 max-w-md mx-auto">
              Your signature has been securely sealed with a cryptographic SHA-256 audit digest.
            </p>
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-left space-y-1 max-w-md mx-auto">
              <span className="text-[11px] font-bold text-neutral-500 uppercase">Tamper-Evident SHA-256 Digest</span>
              <p className="font-mono text-[11px] text-neutral-800 break-all">{signedSha256}</p>
            </div>
            <div className="pt-2">
              <Button variant="primary" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Full Legal Name *
              </label>
              <Input
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="Type your full legal name"
              />
            </div>

            <SignatureCanvasPad onSignatureChange={setSignatureData} />

            <ESIGNConsentCheckbox
              checked={consentGiven}
              onChange={setConsentGiven}
              signerName={legalName}
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100">
              <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={isSubmitting || !signatureData || !consentGiven}
                className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5"
              >
                <Shield className="w-4 h-4" />
                {isSubmitting ? 'Signing...' : 'Sign & Complete'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

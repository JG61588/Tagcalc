import React, { useEffect, useState } from 'react';
import { ArrowUpRight, CheckCircle2, KeyRound, X } from 'lucide-react';
import { PRO_BACKUP_KEY, STRIPE_PAYMENT_LINK } from '../utils/pricing';

interface ConversionModalProps {
  isOpen: boolean;
  triggerReason: 'item_limit' | 'tag_limit' | 'csv_export' | 'upgrade';
  onClose: () => void;
  onUnlockWithKey: () => void;
}

export const ConversionModal: React.FC<ConversionModalProps> = ({
  isOpen,
  triggerReason,
  onClose,
  onUnlockWithKey,
}) => {
  const [keyInput, setKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const reasonLabel = {
    item_limit: 'You have reached the 5-item free calculator limit.',
    tag_limit: 'Free printing is capped at 5 tags per sheet.',
    csv_export: 'CSV spreadsheet export is included with Lifetime Pro.',
    upgrade: 'Upgrade once and keep every feature permanently in this browser.',
  }[triggerReason];

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError('');
    const normalized = keyInput.trim().toUpperCase();
    if (normalized === PRO_BACKUP_KEY) {
      onUnlockWithKey();
      setKeyInput('');
    } else {
      setKeyError(`Invalid license key. Enter ${PRO_BACKUP_KEY} to unlock.`);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="conversion-modal-title"
      className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-xl p-6 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close upgrade modal"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        <p className="text-xs font-medium text-emerald-700 mb-2">{reasonLabel}</p>

        <h2
          id="conversion-modal-title"
          className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug pr-6"
        >
          Unlock Unlimited Items &amp; Print Full Tag Sheets — $19 Once (No Monthly Subscription)
        </h2>

        <ul className="mt-5 space-y-2.5 text-sm text-slate-700">
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
            <span>Add unlimited booth items and queue full multi-page 2&quot; × 3&quot; tag sheets</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
            <span>Download complete pricing &amp; net-profit CSV spreadsheets for bookkeeping</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
            <span>Clean printable sheets with the &quot;Printed free at TagCalc&quot; footer removed</span>
          </li>
        </ul>

        <div className="mt-6">
          <a
            href={STRIPE_PAYMENT_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
          >
            Unlock Lifetime Access ($19)
            <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
          </a>
          <p className="text-xs text-slate-500 text-center mt-2">
            One-time checkout · Automatically unlocks your browser when redirected back
          </p>
        </div>

        {/* Manual Backup Key Box */}
        <form onSubmit={handleKeySubmit} className="mt-6 pt-5 border-t border-slate-200">
          <label
            htmlFor="backup-license-key"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-700 mb-2"
          >
            <KeyRound className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            Already purchased or testing? Enter backup key
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="backup-license-key"
              type="text"
              placeholder="TAGCALC-PRO-2026"
              value={keyInput}
              onChange={(e) => {
                setKeyInput(e.target.value);
                if (keyError) setKeyError('');
              }}
              className="flex-1 min-h-[40px] px-3 py-2 text-sm font-mono text-slate-900 placeholder:text-slate-400 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            />
            <button
              type="submit"
              className="min-h-[40px] px-4 py-2 text-xs font-semibold text-slate-900 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0"
            >
              Activate Key
            </button>
          </div>
          {keyError && (
            <p role="alert" className="mt-2 text-xs font-medium text-red-700">
              {keyError}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

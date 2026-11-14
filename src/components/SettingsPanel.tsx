import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { BoothSettings, RoundingMode } from '../types';
import { calculateBoothSplit, DEFAULT_SETTINGS, formatCurrency } from '../utils/pricing';

interface SettingsPanelProps {
  settings: BoothSettings;
  onChange: (next: BoothSettings) => void;
}

const ROUNDING_OPTIONS: { value: RoundingMode; label: string }[] = [
  { value: 'half', label: 'Clean .00/.50 Pricing' },
  { value: 'quarter', label: 'Round to $0.25' },
  { value: 'exact', label: 'Exact Cents' },
];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onChange }) => {
  const boothSplit = calculateBoothSplit(settings);
  const combinedLoad = settings.cardFeePercent + settings.targetMarginPercent;
  const isInvalidLoad = combinedLoad >= 99.9;

  const updateField = (field: keyof BoothSettings, rawValue: string) => {
    const parsed = parseFloat(rawValue);
    const safeVal = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
    onChange({
      ...settings,
      [field]: field === 'estimatedItems' ? Math.max(1, Math.round(safeVal || 1)) : safeVal,
    });
  };

  const handleReset = () => {
    onChange(DEFAULT_SETTINGS);
  };

  return (
    <section
      id="calculator-settings"
      aria-labelledby="settings-heading"
      className="no-print bg-white border border-slate-200 rounded-xl p-5 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h2 id="settings-heading" className="text-lg font-bold text-slate-900">
            Booth Overhead &amp; Margin Rules
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Auto-saved locally · Booth split per item:{' '}
            <span className="font-mono font-semibold text-slate-900 tabular-nums">
              {formatCurrency(boothSplit)}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          Reset Defaults
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-5">
        <div>
          <label
            htmlFor="setting-booth-fee"
            className="block text-xs font-medium text-slate-700 mb-1.5"
          >
            Total Booth / Table Fee ($)
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-mono text-slate-500">
              $
            </span>
            <input
              id="setting-booth-fee"
              type="number"
              min="0"
              step="1"
              value={settings.boothFee}
              onChange={(e) => updateField('boothFee', e.target.value)}
              className="w-full min-h-[42px] pl-7 pr-3 py-2 text-sm font-mono tabular-nums text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="setting-est-items"
            className="block text-xs font-medium text-slate-700 mb-1.5"
          >
            Est. Total Items at Booth
          </label>
          <input
            id="setting-est-items"
            type="number"
            min="1"
            step="1"
            value={settings.estimatedItems}
            onChange={(e) => updateField('estimatedItems', e.target.value)}
            className="w-full min-h-[42px] px-3 py-2 text-sm font-mono tabular-nums text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div>
          <label
            htmlFor="setting-card-pct"
            className="block text-xs font-medium text-slate-700 mb-1.5"
          >
            Card Processor Fee (%)
          </label>
          <div className="relative">
            <input
              id="setting-card-pct"
              type="number"
              min="0"
              max="50"
              step="0.1"
              value={settings.cardFeePercent}
              onChange={(e) => updateField('cardFeePercent', e.target.value)}
              className="w-full min-h-[42px] pl-3 pr-7 py-2 text-sm font-mono tabular-nums text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-mono text-slate-500">
              %
            </span>
          </div>
        </div>

        <div>
          <label
            htmlFor="setting-card-flat"
            className="block text-xs font-medium text-slate-700 mb-1.5"
          >
            Card Processor Flat Fee ($)
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-mono text-slate-500">
              $
            </span>
            <input
              id="setting-card-flat"
              type="number"
              min="0"
              step="0.01"
              value={settings.cardFlatFee}
              onChange={(e) => updateField('cardFlatFee', e.target.value)}
              className="w-full min-h-[42px] pl-7 pr-3 py-2 text-sm font-mono tabular-nums text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="setting-target-margin"
            className="block text-xs font-medium text-slate-700 mb-1.5"
          >
            Target Net Profit Margin (%)
          </label>
          <div className="relative">
            <input
              id="setting-target-margin"
              type="number"
              min="0"
              max="95"
              step="1"
              value={settings.targetMarginPercent}
              onChange={(e) => updateField('targetMarginPercent', e.target.value)}
              className="w-full min-h-[42px] pl-3 pr-7 py-2 text-sm font-mono tabular-nums text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-mono text-slate-500">
              %
            </span>
          </div>
        </div>
      </div>

      {isInvalidLoad && (
        <div
          role="alert"
          className="mt-4 flex items-center gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800"
        >
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" aria-hidden="true" />
          <span>
            Card Processor Fee ({settings.cardFeePercent}%) plus Target Margin (
            {settings.targetMarginPercent}%) must total less than 100% to compute a valid price.
          </span>
        </div>
      )}

      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <span className="text-xs font-medium text-slate-600">
          Recommended Tag Rounding
        </span>
        <div
          role="group"
          aria-label="Price rounding mode"
          className="inline-flex flex-wrap sm:flex-nowrap items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto"
        >
          {ROUNDING_OPTIONS.map((option) => {
            const active = settings.roundingMode === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ ...settings, roundingMode: option.value })}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[34px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

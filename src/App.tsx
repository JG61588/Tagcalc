import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { ConversionModal } from './components/ConversionModal';
import { FaqSection } from './components/FaqSection';
import { ItemFormAndLedger } from './components/ItemFormAndLedger';
import { PrintTagSheet } from './components/PrintTagSheet';
import { SettingsPanel } from './components/SettingsPanel';
import { BoothSettings, PricingItem } from './types';
import {
  calculateItemPricing,
  DEFAULT_SETTINGS,
  expandTagInstances,
  FREE_ITEM_LIMIT,
  FREE_TAG_LIMIT,
  generateCsvContent,
  SAMPLE_ITEMS,
} from './utils/pricing';

const STORAGE_KEYS = {
  settings: 'tagcalc_settings_v1',
  items: 'tagcalc_items_v1',
  pro: 'tagcalc_pro_v1',
} as const;

type ModalReason = 'item_limit' | 'tag_limit' | 'csv_export' | 'upgrade';

function loadInitialSettings(): BoothSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<BoothSettings>;
    return {
      boothFee: Number.isFinite(Number(parsed.boothFee)) ? Number(parsed.boothFee) : DEFAULT_SETTINGS.boothFee,
      estimatedItems: Math.max(1, Number(parsed.estimatedItems) || DEFAULT_SETTINGS.estimatedItems),
      cardFeePercent: Number.isFinite(Number(parsed.cardFeePercent))
        ? Number(parsed.cardFeePercent)
        : DEFAULT_SETTINGS.cardFeePercent,
      cardFlatFee: Number.isFinite(Number(parsed.cardFlatFee))
        ? Number(parsed.cardFlatFee)
        : DEFAULT_SETTINGS.cardFlatFee,
      targetMarginPercent: Number.isFinite(Number(parsed.targetMarginPercent))
        ? Number(parsed.targetMarginPercent)
        : DEFAULT_SETTINGS.targetMarginPercent,
      roundingMode:
        parsed.roundingMode === 'half' ||
        parsed.roundingMode === 'quarter' ||
        parsed.roundingMode === 'exact'
          ? parsed.roundingMode
          : DEFAULT_SETTINGS.roundingMode,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function loadInitialItems(): PricingItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.items);
    if (raw === null) {
      return SAMPLE_ITEMS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SAMPLE_ITEMS;
    return parsed.filter(
      (item): item is PricingItem =>
        Boolean(item) &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        Number.isFinite(Number(item.materialCost)) &&
        Number.isFinite(Number(item.quantity))
    );
  } catch {
    return SAMPLE_ITEMS;
  }
}

function loadInitialProStatus(): { isPro: boolean; unlockedFromUrl: boolean } {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('pro') === 'unlocked') {
      localStorage.setItem(STORAGE_KEYS.pro, 'true');
      return { isPro: true, unlockedFromUrl: true };
    }
    return {
      isPro: localStorage.getItem(STORAGE_KEYS.pro) === 'true',
      unlockedFromUrl: false,
    };
  } catch {
    return { isPro: false, unlockedFromUrl: false };
  }
}

export default function App() {
  const initialPro = useMemo(() => loadInitialProStatus(), []);

  const [settings, setSettings] = useState<BoothSettings>(() => loadInitialSettings());
  const [items, setItems] = useState<PricingItem[]>(() => loadInitialItems());
  const [isPro, setIsPro] = useState<boolean>(initialPro.isPro);
  const [showProBanner, setShowProBanner] = useState<boolean>(initialPro.unlockedFromUrl);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    reason: ModalReason;
  }>({
    isOpen: false,
    reason: 'upgrade',
  });

  // Clean ?pro=unlocked from URL after persisting to localStorage
  useEffect(() => {
    if (initialPro.unlockedFromUrl) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('pro');
        window.history.replaceState({}, '', url.pathname + url.search + url.hash);
      } catch {
        // Ignore history API restrictions in embedded environments
      }
    }
  }, [initialPro.unlockedFromUrl]);

  // Persist settings automatically
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
    } catch {
      // Ignore storage quota errors
    }
  }, [settings]);

  // Persist items automatically
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.items, JSON.stringify(items));
    } catch {
      // Ignore storage quota errors
    }
  }, [items]);

  // Persist Pro status automatically
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.pro, isPro ? 'true' : 'false');
    } catch {
      // Ignore storage quota errors
    }
  }, [isPro]);

  const calculatedItems = useMemo(
    () => items.map((item) => calculateItemPricing(item, settings)),
    [items, settings]
  );

  const tagInstances = useMemo(() => expandTagInstances(calculatedItems), [calculatedItems]);

  const openModal = (reason: ModalReason) => {
    setModalState({ isOpen: true, reason });
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleAddItem = (newItem: Omit<PricingItem, 'id'>): boolean => {
    if (!isPro && items.length >= FREE_ITEM_LIMIT) {
      openModal('item_limit');
      return false;
    }

    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    setItems((prev) => [...prev, { ...newItem, id }]);
    return true;
  };

  const handleUpdateItem = (id: string, updates: Partial<Omit<PricingItem, 'id'>>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    setItems([]);
  };

  const handleLoadSamples = () => {
    setItems(SAMPLE_ITEMS);
  };

  const handleExportCsv = () => {
    if (!isPro) {
      openModal('csv_export');
      return;
    }

    const csv = generateCsvContent(calculatedItems, settings);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tagcalc-pricing-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintClick = () => {
    if (!isPro && tagInstances.length > FREE_TAG_LIMIT) {
      openModal('tag_limit');
      return;
    }
    window.print();
  };

  const handleUnlockWithKey = () => {
    setIsPro(true);
    setShowProBanner(true);
    closeModal();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navigation Bar (Strict 3-Zone Contract) */}
      <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            TagCalc
          </a>

          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            <a
              href="#calculator-settings"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Booth Rules
            </a>
            <a
              href="#item-ledger"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Item Ledger
            </a>
            <a
              href="#print-sheet"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Tag Sheet
            </a>
            <a
              href="#pricing-faq"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Pricing FAQ
            </a>
          </nav>

          <div className="shrink-0">
            {isPro ? (
              <button
                type="button"
                onClick={handlePrintClick}
                disabled={tagInstances.length === 0}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-45 transition-colors whitespace-nowrap shrink-0 min-h-[38px]"
              >
                Print Price Tags
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openModal('upgrade')}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0 min-h-[38px]"
              >
                Unlock Pro ($19)
              </button>
            )}
          </div>
        </div>
      </header>

      <main id="top" className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
        {/* Pro Unlocked Banner */}
        {showProBanner && (
          <div
            role="status"
            className="no-print flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950"
          >
            <div className="flex items-center gap-2.5 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" aria-hidden="true" />
              <span>
                <strong>Pro Unlocked!</strong> Unlimited items, full multi-page 2&quot; × 3&quot;
                tag sheets, and CSV exports are active in this browser.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowProBanner(false)}
              aria-label="Dismiss Pro Unlocked banner"
              className="p-1.5 text-emerald-800 hover:bg-emerald-100 rounded-md transition-colors shrink-0"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Hero / Workspace Intro */}
        <section className="no-print space-y-2.5 max-w-3xl">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 [text-wrap:balance]">
            Craft-Fair &amp; Flea-Market Price Tag Calculator
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Price every handmade or vintage item with exact booth fee splits, card processing
            gross-up math, and target profit margins—then print cut-ready 2&quot; × 3&quot; tags
            on standard paper.
          </p>
          <div className="pt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
            <span>{isPro ? 'Pro Lifetime Active' : 'Free up to 5 items & 5 tags'}</span>
            <span aria-hidden="true">·</span>
            <span>Auto-saved in browser</span>
            <span aria-hidden="true">·</span>
            <span>2&quot; × 3&quot; US Letter print layout</span>
          </div>
        </section>

        {/* 1. Booth Settings & Margin Panel */}
        <SettingsPanel settings={settings} onChange={setSettings} />

        {/* 2. Item Entry Form & Financial Ledger */}
        <ItemFormAndLedger
          items={calculatedItems}
          totalTagCount={tagInstances.length}
          isPro={isPro}
          onAddItem={handleAddItem}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          onClearAll={handleClearAll}
          onLoadSamples={handleLoadSamples}
          onExportCsv={handleExportCsv}
          onOpenProModal={() => openModal('upgrade')}
        />

        {/* 3. Print-Ready 2" x 3" Price Tag Sheet */}
        <PrintTagSheet
          tags={tagInstances}
          isPro={isPro}
          onPrintClick={handlePrintClick}
          onOpenProModal={() => openModal('tag_limit')}
        />

        {/* 4. Google SEO & Trust FAQ Section */}
        <FaqSection />
      </main>

      <footer className="no-print border-t border-slate-200 bg-white mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>TagCalc — Craft-Fair &amp; Flea-Market Price Tag Calculator</span>
          <div className="flex items-center gap-4">
            <span>All calculations saved locally on your device</span>
            {!isPro && (
              <button
                type="button"
                onClick={() => openModal('upgrade')}
                className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                Unlock Lifetime Pro ($19)
              </button>
            )}
          </div>
        </div>
      </footer>

      <ConversionModal
        isOpen={modalState.isOpen}
        triggerReason={modalState.reason}
        onClose={closeModal}
        onUnlockWithKey={handleUnlockWithKey}
      />
    </div>
  );
}

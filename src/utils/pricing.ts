import { BoothSettings, CalculatedItem, PricingItem, RoundingMode, TagInstance } from '../types';

// Stripe Checkout / Payment Link for the $19 Lifetime Unlock
export const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/bJe6oGgzr8ms8bu9bX6Zy00';

export const PRO_BACKUP_KEY = 'TAGCALC-PRO-2026';
export const FREE_ITEM_LIMIT = 5;
export const FREE_TAG_LIMIT = 5;

export const DEFAULT_SETTINGS: BoothSettings = {
  boothFee: 75,
  estimatedItems: 50,
  cardFeePercent: 2.6,
  cardFlatFee: 0.15,
  targetMarginPercent: 40,
  roundingMode: 'half',
};

export const SAMPLE_ITEMS: PricingItem[] = [
  {
    id: 'sample-ceramic-mug',
    name: 'Hand-Thrown Ceramic Mug',
    materialCost: 6.25,
    quantity: 2,
    sku: 'MUG-STONE-12',
  },
  {
    id: 'sample-lavender-candle',
    name: 'Soy Wax Lavender Candle (8 oz)',
    materialCost: 4.10,
    quantity: 2,
    sku: 'CND-LAV-08',
  },
];

export function roundTagPrice(rawPrice: number, mode: RoundingMode): number {
  if (!Number.isFinite(rawPrice) || rawPrice <= 0) return 0;

  if (mode === 'half') {
    // Round up to nearest $0.50 (.00 / .50 clean craft-fair pricing)
    return Math.ceil((rawPrice - 1e-9) * 2) / 2;
  }

  if (mode === 'quarter') {
    // Round up to nearest $0.25
    return Math.ceil((rawPrice - 1e-9) * 4) / 4;
  }

  // Exact cents
  return Math.round((rawPrice + Number.EPSILON) * 100) / 100;
}

export function calculateBoothSplit(settings: BoothSettings): number {
  const safeFee = Math.max(0, Number.isFinite(settings.boothFee) ? settings.boothFee : 0);
  const safeItems = Math.max(1, Number.isFinite(settings.estimatedItems) ? settings.estimatedItems : 1);
  return safeFee / safeItems;
}

export function calculateItemPricing(item: PricingItem, settings: BoothSettings): CalculatedItem {
  const safeMaterial = Math.max(0, Number.isFinite(item.materialCost) ? item.materialCost : 0);
  const safeFlatFee = Math.max(0, Number.isFinite(settings.cardFlatFee) ? settings.cardFlatFee : 0);
  const safeCardRate = Math.max(0, Number.isFinite(settings.cardFeePercent) ? settings.cardFeePercent : 0) / 100;
  const safeTargetMargin = Math.max(0, Number.isFinite(settings.targetMarginPercent) ? settings.targetMarginPercent : 0) / 100;

  const boothSplit = calculateBoothSplit(settings);
  const baseCost = safeMaterial + boothSplit;

  const breakEvenDenominator = 1 - safeCardRate;
  const targetDenominator = 1 - safeCardRate - safeTargetMargin;

  const isInvalidMath = breakEvenDenominator <= 0.001 || targetDenominator <= 0.001;

  const breakEvenPrice =
    breakEvenDenominator > 0.001 ? (baseCost + safeFlatFee) / breakEvenDenominator : 0;

  const rawRecommendedPrice =
    targetDenominator > 0.001 ? (baseCost + safeFlatFee) / targetDenominator : 0;

  const recommendedPrice = isInvalidMath
    ? 0
    : roundTagPrice(rawRecommendedPrice, settings.roundingMode);

  const cardFeeAtTagPrice =
    recommendedPrice > 0 ? recommendedPrice * safeCardRate + safeFlatFee : 0;

  const actualNetProfit =
    recommendedPrice > 0 ? recommendedPrice - baseCost - cardFeeAtTagPrice : 0;

  const actualNetMarginPercent =
    recommendedPrice > 0 ? (actualNetProfit / recommendedPrice) * 100 : 0;

  return {
    ...item,
    boothSplit,
    baseCost,
    breakEvenPrice,
    rawRecommendedPrice,
    recommendedPrice,
    cardFeeAtTagPrice,
    actualNetProfit,
    actualNetMarginPercent,
    isInvalidMath,
  };
}

export function expandTagInstances(items: CalculatedItem[]): TagInstance[] {
  const tags: TagInstance[] = [];
  for (const item of items) {
    const qty = Math.max(1, Math.min(200, Math.floor(item.quantity || 1)));
    for (let i = 0; i < qty; i++) {
      tags.push({
        tagId: `${item.id}-tag-${i + 1}`,
        itemId: item.id,
        name: item.name,
        recommendedPrice: item.recommendedPrice,
        sku: item.sku,
        indexInItem: i + 1,
        totalInItem: qty,
      });
    }
  }
  return tags;
}

export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return '$0.00';
  const sign = value < 0 ? '-' : '';
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}

function escapeCsvCell(value: string | number): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateCsvContent(items: CalculatedItem[], settings: BoothSettings): string {
  const headers = [
    'Item Name',
    'SKU / Note',
    'Tag Qty',
    'Material Cost ($)',
    'Booth Split ($)',
    'Base Cost ($)',
    'Break-Even Price ($)',
    'Recommended Tag Price ($)',
    `Card Fee (${settings.cardFeePercent}% + $${settings.cardFlatFee.toFixed(2)})`,
    'Actual Net Profit / Unit ($)',
    'Actual Net Margin (%)',
    'Total Batch Revenue ($)',
    'Total Batch Net Profit ($)',
  ];

  const rows = items.map((item) => [
    escapeCsvCell(item.name),
    escapeCsvCell(item.sku || ''),
    item.quantity,
    item.materialCost.toFixed(2),
    item.boothSplit.toFixed(2),
    item.baseCost.toFixed(2),
    item.breakEvenPrice.toFixed(2),
    item.recommendedPrice.toFixed(2),
    item.cardFeeAtTagPrice.toFixed(2),
    item.actualNetProfit.toFixed(2),
    item.actualNetMarginPercent.toFixed(1),
    (item.recommendedPrice * item.quantity).toFixed(2),
    (item.actualNetProfit * item.quantity).toFixed(2),
  ]);

  const totalTags = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalRevenue = items.reduce((acc, item) => acc + item.recommendedPrice * item.quantity, 0);
  const totalProfit = items.reduce((acc, item) => acc + item.actualNetProfit * item.quantity, 0);

  rows.push([
    'TOTALS',
    '',
    totalTags,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    totalRevenue.toFixed(2),
    totalProfit.toFixed(2),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

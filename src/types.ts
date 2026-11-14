export type RoundingMode = 'half' | 'quarter' | 'exact';

export interface BoothSettings {
  boothFee: number;
  estimatedItems: number;
  cardFeePercent: number;
  cardFlatFee: number;
  targetMarginPercent: number;
  roundingMode: RoundingMode;
}

export interface PricingItem {
  id: string;
  name: string;
  materialCost: number;
  quantity: number;
  sku?: string;
}

export interface CalculatedItem extends PricingItem {
  boothSplit: number;
  baseCost: number;
  breakEvenPrice: number;
  rawRecommendedPrice: number;
  recommendedPrice: number;
  cardFeeAtTagPrice: number;
  actualNetProfit: number;
  actualNetMarginPercent: number;
  isInvalidMath: boolean;
}

export interface TagInstance {
  tagId: string;
  itemId: string;
  name: string;
  recommendedPrice: number;
  sku?: string;
  indexInItem: number;
  totalInItem: number;
}

import React, { useState } from 'react';
import {
  ArrowUpRight,
  Check,
  Download,
  Lock,
  Minus,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { CalculatedItem, PricingItem } from '../types';
import { formatCurrency, FREE_ITEM_LIMIT } from '../utils/pricing';

interface ItemFormAndLedgerProps {
  items: CalculatedItem[];
  totalTagCount: number;
  isPro: boolean;
  onAddItem: (item: Omit<PricingItem, 'id'>) => boolean;
  onUpdateItem: (id: string, updates: Partial<Omit<PricingItem, 'id'>>) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
  onLoadSamples: () => void;
  onExportCsv: () => void;
  onOpenProModal: () => void;
}

export const ItemFormAndLedger: React.FC<ItemFormAndLedgerProps> = ({
  items,
  totalTagCount,
  isPro,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onClearAll,
  onLoadSamples,
  onExportCsv,
  onOpenProModal,
}) => {
  const [name, setName] = useState('');
  const [materialCost, setMaterialCost] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [sku, setSku] = useState('');
  const [formError, setFormError] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{
    name: string;
    materialCost: string;
    quantity: string;
    sku: string;
  }>({ name: '', materialCost: '', quantity: '1', sku: '' });

  const [confirmClear, setConfirmClear] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError('Please enter an item name.');
      return;
    }

    const parsedCost = parseFloat(materialCost);
    if (!Number.isFinite(parsedCost) || parsedCost < 0) {
      setFormError('Enter a valid material or unit cost ($0.00 or higher).');
      return;
    }

    const parsedQty = Math.max(1, Math.floor(parseFloat(quantity) || 1));

    const added = onAddItem({
      name: trimmedName,
      materialCost: parsedCost,
      quantity: parsedQty,
      sku: sku.trim() || undefined,
    });

    if (added) {
      setName('');
      setMaterialCost('');
      setQuantity('1');
      setSku('');
    }
  };

  const startEdit = (item: CalculatedItem) => {
    setEditingId(item.id);
    setEditDraft({
      name: item.name,
      materialCost: item.materialCost.toString(),
      quantity: item.quantity.toString(),
      sku: item.sku || '',
    });
  };

  const saveEdit = (id: string) => {
    const trimmedName = editDraft.name.trim();
    const parsedCost = parseFloat(editDraft.materialCost);
    const parsedQty = Math.max(1, Math.floor(parseFloat(editDraft.quantity) || 1));

    if (!trimmedName || !Number.isFinite(parsedCost) || parsedCost < 0) {
      return;
    }

    onUpdateItem(id, {
      name: trimmedName,
      materialCost: parsedCost,
      quantity: parsedQty,
      sku: editDraft.sku.trim() || undefined,
    });
    setEditingId(null);
  };

  const totalBatchRevenue = items.reduce(
    (sum, item) => sum + item.recommendedPrice * item.quantity,
    0
  );
  const totalBatchProfit = items.reduce(
    (sum, item) => sum + item.actualNetProfit * item.quantity,
    0
  );

  return (
    <section
      id="item-ledger"
      aria-labelledby="ledger-heading"
      className="no-print bg-white border border-slate-200 rounded-xl p-5 sm:p-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h2 id="ledger-heading" className="text-lg font-bold text-slate-900">
            Item Entry &amp; Pricing Ledger
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            {isPro ? (
              <span>
                Unlimited items unlocked ·{' '}
                <span className="font-mono tabular-nums font-medium text-slate-900">
                  {items.length}
                </span>{' '}
                {items.length === 1 ? 'item' : 'items'} ·{' '}
                <span className="font-mono tabular-nums font-medium text-slate-900">
                  {totalTagCount}
                </span>{' '}
                {totalTagCount === 1 ? 'tag' : 'tags'}
              </span>
            ) : (
              <span>
                Free tier:{' '}
                <span className="font-mono tabular-nums font-medium text-slate-900">
                  {items.length} of {FREE_ITEM_LIMIT}
                </span>{' '}
                items used ·{' '}
                <span className="font-mono tabular-nums font-medium text-slate-900">
                  {totalTagCount}
                </span>{' '}
                total {totalTagCount === 1 ? 'tag' : 'tags'}
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onExportCsv}
            disabled={items.length === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-45 disabled:pointer-events-none transition-colors whitespace-nowrap shrink-0 min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            {!isPro && <Lock className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />}
            <Download className="w-3.5 h-3.5 text-slate-700" aria-hidden="true" />
            Download CSV Spreadsheet
          </button>

          {items.length > 0 && !confirmClear && (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors whitespace-nowrap shrink-0 min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              Clear All Items
            </button>
          )}

          {confirmClear && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-xs font-medium text-red-800 whitespace-nowrap">
                Remove all {items.length} items?
              </span>
              <button
                type="button"
                onClick={() => {
                  onClearAll();
                  setConfirmClear(false);
                }}
                className="px-2.5 py-1 text-xs font-semibold text-white bg-red-600 rounded hover:bg-red-700 transition-colors whitespace-nowrap"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Item Entry Form */}
      <form onSubmit={handleSubmit} className="pt-5 pb-6 border-b border-slate-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
          <div className="lg:col-span-4">
            <label
              htmlFor="item-name"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Item Name
            </label>
            <input
              id="item-name"
              type="text"
              placeholder="e.g., Hand-Dyed Linen Tote"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full min-h-[42px] px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="item-cost"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Material / Unit Cost ($)
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-mono text-slate-500">
                $
              </span>
              <input
                id="item-cost"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={materialCost}
                onChange={(e) => setMaterialCost(e.target.value)}
                className="w-full min-h-[42px] pl-7 pr-3 py-2 text-sm font-mono tabular-nums text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="item-qty"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Tag Quantity
            </label>
            <input
              id="item-qty"
              type="number"
              min="1"
              max="200"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full min-h-[42px] px-3 py-2 text-sm font-mono tabular-nums text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="item-sku"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              SKU / Note (Optional)
            </label>
            <input
              id="item-sku"
              type="text"
              placeholder="e.g., TOT-04"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full min-h-[42px] px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>

          <div className="lg:col-span-2">
            <button
              type="submit"
              className="w-full min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              {!isPro && items.length >= FREE_ITEM_LIMIT ? 'Add Item (Pro)' : 'Add Item'}
            </button>
          </div>
        </div>

        {formError && (
          <p role="alert" className="mt-2.5 text-xs font-medium text-red-700">
            {formError}
          </p>
        )}
      </form>

      {/* Ledger Data View */}
      {items.length === 0 ? (
        <div className="py-12 px-4 text-center">
          <h3 className="text-base font-semibold text-slate-900">
            Your booth ledger is empty
          </h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto mt-1.5">
            Add your first handmade or vintage item above to compute break-even prices, recommended
            tags, and live 2&quot; × 3&quot; print sheets.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onLoadSamples}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors min-h-[40px]"
            >
              Load Sample Items
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                  <th className="py-3 pr-3">Item &amp; SKU</th>
                  <th className="py-3 px-3 text-center">Tags</th>
                  <th className="py-3 px-3 text-right">Material</th>
                  <th className="py-3 px-3 text-right">Booth Split</th>
                  <th className="py-3 px-3 text-right">Base Cost</th>
                  <th className="py-3 px-3 text-right">Break-Even</th>
                  <th className="py-3 px-3 text-right text-slate-900 font-semibold">
                    Tag Price
                  </th>
                  <th className="py-3 px-3 text-right">Net Profit</th>
                  <th className="py-3 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {items.map((item) => {
                  const isEditing = editingId === item.id;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors align-middle"
                    >
                      <td className="py-3 pr-3 min-w-[180px]">
                        {isEditing ? (
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              aria-label="Edit item name"
                              value={editDraft.name}
                              onChange={(e) =>
                                setEditDraft({ ...editDraft, name: e.target.value })
                              }
                              className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            />
                            <input
                              type="text"
                              aria-label="Edit SKU or note"
                              placeholder="SKU / Note"
                              value={editDraft.sku}
                              onChange={(e) =>
                                setEditDraft({ ...editDraft, sku: e.target.value })
                              }
                              className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            />
                          </div>
                        ) : (
                          <div>
                            <div className="font-semibold text-slate-900 leading-snug">
                              {item.name}
                            </div>
                            {item.sku && (
                              <div className="text-xs font-mono text-slate-500 mt-0.5">
                                {item.sku}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            min="1"
                            max="200"
                            aria-label="Edit quantity"
                            value={editDraft.quantity}
                            onChange={(e) =>
                              setEditDraft({ ...editDraft, quantity: e.target.value })
                            }
                            className="w-16 px-2 py-1 text-sm text-center font-mono tabular-nums border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-600"
                          />
                        ) : (
                          <div className="inline-flex items-center border border-slate-200 rounded-md bg-white">
                            <button
                              type="button"
                              aria-label={`Decrease quantity for ${item.name}`}
                              onClick={() =>
                                onUpdateItem(item.id, {
                                  quantity: Math.max(1, item.quantity - 1),
                                })
                              }
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-35"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-3 h-3" aria-hidden="true" />
                            </button>
                            <span className="px-2 text-xs font-mono font-semibold tabular-nums text-slate-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label={`Increase quantity for ${item.name}`}
                              onClick={() =>
                                onUpdateItem(item.id, {
                                  quantity: Math.min(200, item.quantity + 1),
                                })
                              }
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                            >
                              <Plus className="w-3 h-3" aria-hidden="true" />
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            aria-label="Edit material cost"
                            value={editDraft.materialCost}
                            onChange={(e) =>
                              setEditDraft({ ...editDraft, materialCost: e.target.value })
                            }
                            className="w-24 px-2 py-1 text-sm text-right font-mono tabular-nums border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-600"
                          />
                        ) : (
                          formatCurrency(item.materialCost)
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-500">
                        {formatCurrency(item.boothSplit)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                        {formatCurrency(item.baseCost)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600">
                        {formatCurrency(item.breakEvenPrice)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        {item.isInvalidMath ? (
                          <span className="text-xs font-medium text-red-700">Invalid %</span>
                        ) : (
                          <span className="text-base font-bold text-slate-900">
                            {formatCurrency(item.recommendedPrice)}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        {item.isInvalidMath ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : (
                          <div>
                            <div
                              className={`font-semibold ${
                                item.actualNetProfit > 0 ? 'text-emerald-700' : 'text-red-700'
                              }`}
                            >
                              {formatCurrency(item.actualNetProfit)}
                            </div>
                            <div className="text-xs text-slate-500">
                              {item.actualNetMarginPercent.toFixed(1)}%
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-3 pl-3 text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                aria-label={`Save changes for ${item.name}`}
                                onClick={() => saveEdit(item.id)}
                                className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                              >
                                <Check className="w-4 h-4" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                aria-label="Cancel edit"
                                onClick={() => setEditingId(null)}
                                className="p-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
                              >
                                <X className="w-4 h-4" aria-hidden="true" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                aria-label={`Edit ${item.name}`}
                                onClick={() => startEdit(item)}
                                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                              >
                                <Pencil className="w-4 h-4" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                aria-label={`Delete ${item.name}`}
                                onClick={() => onDeleteItem(item.id)}
                                className="p-2 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                              >
                                <Trash2 className="w-4 h-4" aria-hidden="true" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.id} className="py-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900">{item.name}</div>
                    {item.sku && (
                      <div className="text-xs font-mono text-slate-500 mt-0.5">{item.sku}</div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-mono font-bold tabular-nums text-slate-900">
                      {item.isInvalidMath ? 'Invalid' : formatCurrency(item.recommendedPrice)}
                    </div>
                    <div className="text-xs font-mono tabular-nums text-emerald-700 font-medium">
                      +{formatCurrency(item.actualNetProfit)} net (
                      {item.actualNetMarginPercent.toFixed(1)}%)
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg p-2.5">
                  <div>
                    <span className="block text-slate-500">Material</span>
                    <span className="font-mono tabular-nums font-medium text-slate-900">
                      {formatCurrency(item.materialCost)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-500">Base Cost</span>
                    <span className="font-mono tabular-nums font-medium text-slate-900">
                      {formatCurrency(item.baseCost)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-500">Break-Even</span>
                    <span className="font-mono tabular-nums font-medium text-slate-900">
                      {formatCurrency(item.breakEvenPrice)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center border border-slate-200 rounded-lg bg-white">
                    <button
                      type="button"
                      aria-label={`Decrease quantity for ${item.name}`}
                      onClick={() =>
                        onUpdateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })
                      }
                      disabled={item.quantity <= 1}
                      className="p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-35 min-h-[40px] min-w-[40px] flex items-center justify-center"
                    >
                      <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <span className="px-3 text-xs font-mono font-semibold tabular-nums text-slate-900">
                      {item.quantity} {item.quantity === 1 ? 'tag' : 'tags'}
                    </span>
                    <button
                      type="button"
                      aria-label={`Increase quantity for ${item.name}`}
                      onClick={() =>
                        onUpdateItem(item.id, { quantity: Math.min(200, item.quantity + 1) })
                      }
                      className="p-2 text-slate-600 hover:bg-slate-50 min-h-[40px] min-w-[40px] flex items-center justify-center"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteItem(item.id)}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 rounded-lg min-h-[40px]"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Batch Summary Footer */}
          <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
              <span className="text-slate-600">
                Total Tag Revenue:{' '}
                <strong className="font-mono tabular-nums text-slate-900">
                  {formatCurrency(totalBatchRevenue)}
                </strong>
              </span>
              <span className="text-slate-600">
                Projected Batch Net Profit:{' '}
                <strong className="font-mono tabular-nums text-emerald-700">
                  {formatCurrency(totalBatchProfit)}
                </strong>
              </span>
            </div>

            {!isPro && (
              <button
                type="button"
                onClick={onOpenProModal}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline self-start sm:self-auto"
              >
                Need more than 5 items? Unlock Pro ($19 once)
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
};

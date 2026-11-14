import React from 'react';
import { Lock, Printer, Scissors } from 'lucide-react';
import { TagInstance } from '../types';
import { formatCurrency, FREE_TAG_LIMIT } from '../utils/pricing';

interface PrintTagSheetProps {
  tags: TagInstance[];
  isPro: boolean;
  onPrintClick: () => void;
  onOpenProModal: () => void;
}

const TAGS_PER_LETTER_PAGE = 9; // 3 across (6in) x 3 down (9in) on 8.5" x 11" US Letter with 0.4" margins

function chunkPages<T>(list: T[], size: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < list.length; i += size) {
    pages.push(list.slice(i, i + size));
  }
  return pages;
}

const TagCardContent: React.FC<{ tag: TagInstance }> = ({ tag }) => (
  <div className="h-full w-full flex flex-col justify-between p-3 sm:p-4 text-center select-none">
    {/* Subtle Hang-Hole Punch Guide */}
    <div className="flex flex-col items-center">
      <div
        className="w-3 h-3 rounded-full border border-slate-300 mb-2 print:border-slate-400"
        aria-hidden="true"
      />
      <p className="text-xs sm:text-[13px] font-semibold text-slate-900 leading-tight line-clamp-3 break-words">
        {tag.name}
      </p>
    </div>

    <div className="my-auto py-2">
      <div className="text-xl sm:text-2xl font-mono font-bold tabular-nums tracking-tight text-slate-900">
        {formatCurrency(tag.recommendedPrice)}
      </div>
    </div>

    <div className="pt-1.5 border-t border-slate-200/80">
      <p className="text-[10px] font-mono text-slate-500 truncate min-h-[14px]">
        {tag.sku ? tag.sku : '\u00A0'}
      </p>
    </div>
  </div>
);

export const PrintTagSheet: React.FC<PrintTagSheetProps> = ({
  tags,
  isPro,
  onPrintClick,
  onOpenProModal,
}) => {
  const visibleTags = isPro ? tags : tags.slice(0, FREE_TAG_LIMIT);
  const hiddenTagCount = isPro ? 0 : Math.max(0, tags.length - FREE_TAG_LIMIT);
  const pages = chunkPages(visibleTags, TAGS_PER_LETTER_PAGE);

  return (
    <>
      {/* On-Screen Interactive Live Print Preview */}
      <section
        id="print-sheet"
        aria-labelledby="print-sheet-heading"
        className="no-print bg-white border border-slate-200 rounded-xl p-5 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h2 id="print-sheet-heading" className="text-lg font-bold text-slate-900">
              Print-Ready 2&quot; × 3&quot; Price Tag Sheet
            </h2>
            <p className="text-sm text-slate-600 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="inline-flex items-center gap-1">
                <Scissors className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                3 tags across on 8.5&quot; × 11&quot; US Letter
              </span>
              <span aria-hidden="true">·</span>
              <span>Dashed cut lines</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {visibleTags.length} {visibleTags.length === 1 ? 'tag' : 'tags'} ready
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={onPrintClick}
            disabled={tags.length === 0}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-45 disabled:pointer-events-none transition-colors whitespace-nowrap shrink-0 min-h-[42px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
          >
            {!isPro && tags.length > FREE_TAG_LIMIT ? (
              <Lock className="w-4 h-4 text-amber-300" aria-hidden="true" />
            ) : (
              <Printer className="w-4 h-4" aria-hidden="true" />
            )}
            Print Price Tags
          </button>
        </div>

        {hiddenTagCount > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-950">
            <span>
              Free tier previews and prints up to <strong>{FREE_TAG_LIMIT} tags</strong>. You
              currently have <strong>{tags.length} tags</strong> queued ({hiddenTagCount} beyond the
              free sheet).
            </span>
            <button
              type="button"
              onClick={onOpenProModal}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
            >
              Unlock Full Sheet ($19)
            </button>
          </div>
        )}

        {visibleTags.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Add an item above to preview your 2&quot; × 3&quot; cut-ready price tags.
          </div>
        ) : (
          <div className="mt-6 bg-slate-100/80 border border-slate-200 rounded-xl p-4 sm:p-8 space-y-6">
            {pages.map((pageTags, pageIndex) => (
              <div
                key={`preview-page-${pageIndex}`}
                className="max-w-[680px] mx-auto bg-white border border-slate-300 shadow-xs p-4 sm:p-8"
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-4">
                  <span>US Letter (8.5&quot; × 11&quot;) · 0.4&quot; Margin</span>
                  <span>
                    Page {pageIndex + 1} of {pages.length}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {pageTags.map((tag) => (
                    <div
                      key={tag.tagId}
                      className="aspect-[2/3] border border-dashed border-slate-400 bg-white flex flex-col"
                    >
                      <TagCardContent tag={tag} />
                    </div>
                  ))}
                </div>

                {!isPro && (
                  <div className="mt-6 pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
                    Printed free at TagCalc
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Strict 1:1 Physical Print Surface (visible only during window.print()) */}
      <div id="print-sheet-root" className="hidden print:block" aria-hidden="true">
        <div className="print-tag-grid">
          {visibleTags.map((tag) => (
            <div key={`print-${tag.tagId}`} className="price-tag-cell">
              <TagCardContent tag={tag} />
            </div>
          ))}
        </div>
        {!isPro && visibleTags.length > 0 && (
          <div className="print-free-footer">Printed free at TagCalc</div>
        )}
      </div>
    </>
  );
};

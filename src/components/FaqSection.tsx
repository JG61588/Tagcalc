import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'booth-split',
    question: 'How do I split a craft fair booth fee per item?',
    answer:
      'Divide your total booth or table fee by the realistic number of items you are bringing to sell—not just what you hope sells out. For example, a $75 table fee divided across 50 items adds $1.50 of overhead to each item’s base cost. Including that $1.50 before applying your profit margin ensures your booth rent is recovered steadily across your inventory.',
  },
  {
    id: 'square-fee',
    question: "How do I factor Square's 2.6% + $0.15 fee into my prices?",
    answer:
      'Card processors calculate their 2.6% cut on your final customer-facing tag price, not on your material cost. Simply adding 2.6% to your cost underprices the item. TagCalc uses the gross-up formula: (Base Cost + $0.15) ÷ (1 − 0.026 − Target Margin %). That guarantees your target net profit margin remains intact after Square deducts its percentage and $0.15 tap fee.',
  },
  {
    id: 'print-tags',
    question: 'How do I print price tags at home on standard paper?',
    answer:
      'Load standard 8.5" × 11" US Letter cardstock (65 lb to 110 lb cover stock works best for crisp hang tags) into your inkjet or laser printer. Click "Print Price Tags" above, make sure your printer dialog is set to 100% scale ("Actual Size") with default margins, and print. Each page fits nine 2" × 3" tags arranged three across with dashed cut lines for quick trimming with scissors or a paper cutter.',
  },
];

export const FaqSection: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>('booth-split');

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      id="pricing-faq"
      aria-labelledby="faq-heading"
      className="no-print bg-white border border-slate-200 rounded-xl p-5 sm:p-6"
    >
      <div className="pb-4 border-b border-slate-100">
        <h2 id="faq-heading" className="text-lg font-bold text-slate-900">
          Craft-Fair Pricing &amp; Printing Guide
        </h2>
        <p className="text-sm text-slate-600 mt-0.5">
          Exact booth math and home printing workflow for weekend markets and pop-ups.
        </p>
      </div>

      <div className="divide-y divide-slate-200">
        {FAQ_ITEMS.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div key={item.id} className="py-1">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${item.id}`}
                onClick={() => toggleItem(item.id)}
                className="w-full py-3.5 flex items-center justify-between gap-4 text-left text-sm sm:text-base font-semibold text-slate-900 hover:text-emerald-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-md"
              >
                <span>{item.question}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-emerald-700' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>
              {isOpen && (
                <div
                  id={`faq-panel-${item.id}`}
                  className="pb-4 pr-6 text-sm text-slate-600 leading-relaxed max-w-3xl"
                >
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

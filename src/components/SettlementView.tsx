import React from 'react';
import { Archive, FileDown, Image as ImageIcon } from 'lucide-react';
import { ExpenseRow } from '../types';
import {
  formatNumberWithCommas,
  parseFormattedNumber,
  sanitizeCurrencyString,
} from '../utils/format';

interface SettlementViewProps {
  rows: ExpenseRow[];
  fundMonth: string;
  onFundMonthChange: (month: string) => void;
  fundInput: string;
  onFundInputChange: (val: string) => void;
  actualInput: string;
  onActualInputChange: (val: string) => void;
  notes: string[];
  onNoteChange: (index: number, val: string) => void;
  onArchiveSave: () => void;
  onExportPdf: () => void;
  onExportPng: () => void;
  isExportingPng: boolean;
}

export const SettlementView: React.FC<SettlementViewProps> = ({
  rows,
  fundMonth,
  onFundMonthChange,
  fundInput,
  onFundInputChange,
  actualInput,
  onActualInputChange,
  notes,
  onNoteChange,
  onArchiveSave,
  onExportPdf,
  onExportPng,
  isExportingPng,
}) => {
  let totalExpense = 0;
  let bapTotal = 0;
  let kieuTotal = 0;
  let hungTotal = 0;

  rows.forEach((row) => {
    const val = parseFormattedNumber(row.amount);
    totalExpense += val;
    if (row.person === 'Bắp') bapTotal += val;
    else if (row.person === 'Kiều') kieuTotal += val;
    else if (row.person === 'Hưng') hungTotal += val;
  });

  const fundAmount = parseFormattedNumber(fundInput);
  const remainingAmount = fundAmount - totalExpense;
  const actualAmount = parseFormattedNumber(actualInput);
  const differenceAmount = actualAmount - remainingAmount;
  const afterDebtTotal = kieuTotal + hungTotal;

  const months = Array.from({ length: 12 }, (_, i) => String(i + 1));

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start">
        {/* Table 1: Tổng kết quỹ & chênh lệch */}
        <div className="rounded-2xl border border-slate-300/90 overflow-hidden shadow-xs bg-white/80">
          <div className="hidden sm:grid sm:grid-cols-[140px_170px_1fr] bg-slate-100/90 text-slate-700 text-xs font-bold border-b border-slate-300">
            <div className="py-2.5 px-3 text-left border-r border-slate-300">Khoản mục</div>
            <div className="py-2.5 px-3.5 text-right border-r border-slate-300">Số tiền</div>
            <div className="py-2.5 px-3.5 text-left">Ghi chú</div>
          </div>

          <div className="divide-y divide-slate-200/90 text-sm">
            {/* Tổng tiền */}
            <div className="grid grid-cols-1 sm:grid-cols-[140px_170px_1fr] items-center bg-white/70 p-2.5 sm:p-0 gap-2 sm:gap-0">
              <div className="sm:py-2.5 sm:px-3 font-semibold text-slate-800 sm:border-r border-slate-200 sm:h-full flex items-center justify-between sm:justify-start">
                <span>Tổng tiền</span>
                <span className="sm:hidden font-bold text-red-600 font-mono-num text-base">
                  {formatNumberWithCommas(totalExpense)}
                </span>
              </div>
              <div className="hidden sm:flex py-2.5 px-3.5 text-right font-bold text-red-600 font-mono-num border-r border-slate-200 h-full items-center justify-end select-all">
                {formatNumberWithCommas(totalExpense)}
              </div>
              <div className="sm:p-1.5">
                <input
                  type="text"
                  value={notes[0] || ''}
                  onChange={(e) => onNoteChange(0, e.target.value)}
                  placeholder="Ghi chú tổng tiền..."
                  className="liquid-glass-input w-full min-h-[44px] sm:min-h-[36px] px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 rounded-xl"
                />
              </div>
            </div>

            {/* Quỹ tháng */}
            <div className="grid grid-cols-1 sm:grid-cols-[140px_170px_1fr] items-center bg-white/50 p-2.5 sm:p-0 gap-2 sm:gap-0">
              <div className="sm:py-2 sm:px-2.5 font-semibold text-slate-800 sm:border-r border-slate-200 sm:h-full flex items-center justify-between gap-2">
                <span className="whitespace-nowrap">Quỹ tháng</span>
                <select
                  value={fundMonth}
                  onChange={(e) => onFundMonthChange(e.target.value)}
                  aria-label="Chọn tháng quỹ"
                  className="liquid-glass-input min-h-[38px] sm:min-h-[30px] text-blue-700 font-bold text-xs px-2 py-1 rounded-lg cursor-pointer shrink-0"
                >
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:p-1.5 sm:border-r border-slate-200">
                <input
                  type="text"
                  inputMode="numeric"
                  value={fundInput}
                  onChange={(e) =>
                    onFundInputChange(sanitizeCurrencyString(e.target.value, true))
                  }
                  placeholder="Nhập quỹ tháng..."
                  aria-label="Số tiền quỹ tháng"
                  className="liquid-glass-input w-full min-h-[44px] sm:min-h-[36px] px-3 py-1.5 text-right font-bold text-slate-900 font-mono-num rounded-xl"
                />
              </div>
              <div className="sm:p-1.5">
                <input
                  type="text"
                  value={notes[1] || ''}
                  onChange={(e) => onNoteChange(1, e.target.value)}
                  placeholder="Ghi chú quỹ tháng..."
                  className="liquid-glass-input w-full min-h-[44px] sm:min-h-[36px] px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 rounded-xl"
                />
              </div>
            </div>

            {/* Còn lại */}
            <div className="grid grid-cols-1 sm:grid-cols-[140px_170px_1fr] items-center bg-white/70 p-2.5 sm:p-0 gap-2 sm:gap-0">
              <div className="sm:py-2.5 sm:px-3 font-semibold text-slate-800 sm:border-r border-slate-200 sm:h-full flex items-center justify-between sm:justify-start">
                <span>Còn lại</span>
                <span className="sm:hidden font-bold text-slate-900 font-mono-num text-base">
                  {formatNumberWithCommas(remainingAmount)}
                </span>
              </div>
              <div className="hidden sm:flex py-2.5 px-3.5 text-right font-bold text-slate-900 font-mono-num border-r border-slate-200 h-full items-center justify-end select-all">
                {formatNumberWithCommas(remainingAmount)}
              </div>
              <div className="sm:p-1.5">
                <input
                  type="text"
                  value={notes[2] || ''}
                  onChange={(e) => onNoteChange(2, e.target.value)}
                  placeholder="Ghi chú số tiền còn lại..."
                  className="liquid-glass-input w-full min-h-[44px] sm:min-h-[36px] px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 rounded-xl"
                />
              </div>
            </div>

            {/* Thực tế */}
            <div className="grid grid-cols-1 sm:grid-cols-[140px_170px_1fr] items-center bg-white/50 p-2.5 sm:p-0 gap-2 sm:gap-0">
              <div className="sm:py-2.5 sm:px-3 font-semibold text-slate-800 sm:border-r border-slate-200 sm:h-full flex items-center">
                <span>Thực tế</span>
              </div>
              <div className="sm:p-1.5 sm:border-r border-slate-200">
                <input
                  type="text"
                  inputMode="numeric"
                  value={actualInput}
                  onChange={(e) =>
                    onActualInputChange(sanitizeCurrencyString(e.target.value, true))
                  }
                  placeholder="Nhập số dư thực tế..."
                  aria-label="Số tiền thực tế"
                  className="liquid-glass-input w-full min-h-[44px] sm:min-h-[36px] px-3 py-1.5 text-right font-bold text-slate-900 font-mono-num rounded-xl"
                />
              </div>
              <div className="sm:p-1.5">
                <input
                  type="text"
                  value={notes[3] || ''}
                  onChange={(e) => onNoteChange(3, e.target.value)}
                  placeholder="Ghi chú thực tế..."
                  className="liquid-glass-input w-full min-h-[44px] sm:min-h-[36px] px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 rounded-xl"
                />
              </div>
            </div>

            {/* Chênh lệch */}
            <div className="grid grid-cols-1 sm:grid-cols-[140px_170px_1fr] items-center bg-white/70 p-2.5 sm:p-0 gap-2 sm:gap-0">
              <div className="sm:py-2.5 sm:px-3 font-semibold text-slate-800 sm:border-r border-slate-200 sm:h-full flex items-center justify-between sm:justify-start">
                <span>Chênh lệch</span>
                <span className="sm:hidden font-bold text-slate-900 font-mono-num text-base">
                  {formatNumberWithCommas(differenceAmount)}
                </span>
              </div>
              <div className="hidden sm:flex py-2.5 px-3.5 text-right font-bold text-slate-900 font-mono-num border-r border-slate-200 h-full items-center justify-end select-all">
                {formatNumberWithCommas(differenceAmount)}
              </div>
              <div className="sm:p-1.5">
                <input
                  type="text"
                  value={notes[4] || ''}
                  onChange={(e) => onNoteChange(4, e.target.value)}
                  placeholder="Ghi chú chênh lệch..."
                  className="liquid-glass-input w-full min-h-[44px] sm:min-h-[36px] px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table 2: Số tiền phải trả */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-300/90 overflow-hidden shadow-xs bg-white/85">
            <div className="bg-slate-800 text-white text-xs font-bold py-2.5 px-3 text-center border-b border-slate-700">
              Số tiền phải trả
            </div>

            <div className="divide-y divide-slate-200 text-sm">
              <div className="summary-table-2-grid bg-[#dcfce7]">
                <div className="py-3 px-3.5 font-semibold text-slate-900 border-r border-[#86efac] whitespace-nowrap">
                  Bắp tiêu
                </div>
                <div className="py-3 px-3.5 text-right font-bold text-slate-900 font-mono-num whitespace-nowrap select-all">
                  {formatNumberWithCommas(bapTotal)}
                </div>
              </div>

              <div className="summary-table-2-grid bg-[#fef9c3]">
                <div className="py-3 px-3.5 font-semibold text-slate-900 border-r border-[#fde047] whitespace-nowrap">
                  Kiều tiêu
                </div>
                <div className="py-3 px-3.5 text-right font-bold text-slate-900 font-mono-num whitespace-nowrap select-all">
                  {formatNumberWithCommas(kieuTotal)}
                </div>
              </div>

              <div className="summary-table-2-grid bg-white">
                <div className="py-3 px-3.5 font-semibold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                  Hưng tiêu
                </div>
                <div className="py-3 px-3.5 text-right font-bold text-slate-900 font-mono-num whitespace-nowrap select-all">
                  {formatNumberWithCommas(hungTotal)}
                </div>
              </div>

              <div className="summary-table-2-grid bg-rose-50/70">
                <div className="py-3 px-3.5 font-bold text-red-600 border-r border-slate-200 whitespace-nowrap">
                  Tiền sau trả nợ
                </div>
                <div className="py-3 px-3.5 text-right font-bold text-red-600 font-mono-num whitespace-nowrap select-all">
                  {formatNumberWithCommas(afterDebtTotal)}
                </div>
              </div>
            </div>
          </div>

          {/* Actions: Lưu trữ, Xuất PDF, Xuất PNG */}
          <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2">
            <button
              type="button"
              onClick={onArchiveSave}
              className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-sm transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Archive className="w-4 h-4 shrink-0" />
              <span>Lưu trữ</span>
            </button>

            <button
              type="button"
              onClick={onExportPdf}
              className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-sm transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileDown className="w-4 h-4 shrink-0" />
              <span>Xuất PDF</span>
            </button>

            <button
              type="button"
              onClick={onExportPng}
              disabled={isExportingPng}
              className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-60 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-sm transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 shrink-0" />
              <span>{isExportingPng ? 'Đang xuất...' : 'Xuất PNG'}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

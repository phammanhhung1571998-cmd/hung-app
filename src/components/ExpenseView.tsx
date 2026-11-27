import React, { useState } from 'react';
import { Calculator, Check, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { ExpenseRow, PersonName } from '../types';
import { formatNumberWithCommas, parseFormattedNumber, sanitizeCurrencyString } from '../utils/format';

interface ExpenseViewProps {
  month: string;
  onMonthChange: (month: string) => void;
  rows: ExpenseRow[];
  onUpdateRow: (id: string, patch: Partial<ExpenseRow>) => void;
  onAddRow: () => void;
  onDeleteSelected: () => void;
  onClearAll: () => void;
  onSaveDraft: () => void;
  onSettle: () => void;
  onOpenArchive?: () => void;
}

const PERSON_OPTIONS: PersonName[] = ['Bắp', 'Hưng', 'Kiều'];

export const ExpenseView: React.FC<ExpenseViewProps> = ({
  month,
  onMonthChange,
  rows,
  onUpdateRow,
  onAddRow,
  onDeleteSelected,
  onClearAll,
  onSaveDraft,
  onSettle,
  onOpenArchive,
}) => {
  const [clearArmed, setClearArmed] = useState(false);

  const months = Array.from({ length: 12 }, (_, i) => String(i + 1));

  // Auto-STT only for rows with digits in Số tiền
  let sttCounter = 1;
  const sttMap = new Map<string, string>();
  let totalAmount = 0;
  let activeCount = 0;

  rows.forEach((row) => {
    const hasDigits = row.amount.replace(/[^\d]/g, '').length > 0;
    if (hasDigits) {
      sttMap.set(row.id, String(sttCounter++));
      activeCount++;
      totalAmount += parseFormattedNumber(row.amount);
    } else {
      sttMap.set(row.id, '');
    }
  });

  const selectedDeleteCount = rows.filter((r) => r.selectedForDelete).length;

  const handleClearClick = () => {
    if (!clearArmed) {
      setClearArmed(true);
      setTimeout(() => setClearArmed(false), 3500);
      return;
    }
    setClearArmed(false);
    onClearAll();
  };

  const getRowColorClass = (person: PersonName) => {
    if (person === 'Bắp') return 'row-bap';
    if (person === 'Kiều') return 'row-kieu';
    return 'row-default';
  };

  const getSelectTextClass = (person: PersonName) => {
    if (person === 'Bắp') return 'text-emerald-800 font-bold';
    if (person === 'Kiều') return 'text-amber-900 font-bold';
    if (person === 'Hưng') return 'text-slate-900 font-bold';
    return 'text-slate-400 italic font-normal';
  };

  return (
    <div className="space-y-4">
      {/* Header Month + Legend */}
      <div className="pb-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <span>Sao kê tháng</span>
            <select
              value={month}
              onChange={(e) => onMonthChange(e.target.value)}
              aria-label="Chọn tháng sao kê"
              className="liquid-glass-input text-blue-700 font-extrabold text-xl sm:text-2xl px-3.5 py-1.5 rounded-xl cursor-pointer min-h-[44px]"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </h1>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>{activeCount} khoản có số tiền</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num font-bold text-slate-800">
              {formatNumberWithCommas(totalAmount)}
            </span>
          </div>
        </div>

        {/* Clean color legend (no circular decorative dots per design spec) */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-700">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#dcfce7] border border-[#86efac] text-green-950">
            <span className="w-2.5 h-2.5 rounded-xs bg-green-600" />
            Bắp
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#fef9c3] border border-[#fde047] text-yellow-950">
            <span className="w-2.5 h-2.5 rounded-xs bg-yellow-500" />
            Kiều
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800">
            <span className="w-2.5 h-2.5 rounded-xs bg-slate-400" />
            Hưng
          </span>
        </div>
      </div>

      {/* DESKTOP TABLE VIEW (md and above) */}
      <div className="hidden md:block overflow-x-auto pb-1">
        <div className="min-w-[743px] rounded-2xl border border-slate-300/90 overflow-hidden shadow-xs bg-white/55">
          <div className="statement-grid bg-[#0f172a] text-white font-semibold text-xs tracking-wider">
            <div className="py-3 px-3 text-center border-r border-slate-700">STT</div>
            <div className="py-3 px-3.5 text-right border-r border-slate-700">Số tiền</div>
            <div className="py-3 px-3.5 text-left border-r border-slate-700">Mục chi</div>
            <div className="py-3 px-3 text-center border-r border-slate-700">Người chi</div>
            <div className="py-3 px-2 text-center">Chọn xóa</div>
          </div>

          <div className="divide-y divide-slate-200/90">
            {rows.map((row) => (
              <div
                key={row.id}
                className={`statement-grid items-center transition-colors duration-150 ${getRowColorClass(row.person)} ${
                  row.selectedForDelete ? 'row-marked-delete' : ''
                }`}
              >
                <div className="py-2 px-3 text-center font-semibold text-slate-600 font-mono-num border-r border-slate-200/80 h-full flex items-center justify-center select-none">
                  {sttMap.get(row.id)}
                </div>

                <div className="p-1.5 border-r border-slate-200/80">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={row.amount}
                    onChange={(e) =>
                      onUpdateRow(row.id, {
                        amount: sanitizeCurrencyString(e.target.value, false),
                      })
                    }
                    placeholder="0"
                    aria-label="Số tiền"
                    className="liquid-glass-input w-full px-2.5 py-1.5 text-right font-bold text-slate-900 placeholder-slate-400/80 font-mono-num rounded-xl"
                  />
                </div>

                <div className="p-1.5 border-r border-slate-200/80">
                  <input
                    type="text"
                    value={row.desc}
                    onChange={(e) => onUpdateRow(row.id, { desc: e.target.value })}
                    placeholder="Nhập nội dung chi..."
                    aria-label="Mục chi"
                    className="liquid-glass-input w-full px-3 py-1.5 text-left text-slate-800 placeholder-slate-400 rounded-xl"
                  />
                </div>

                <div className="p-1.5 border-r border-slate-200/80">
                  <select
                    value={row.person}
                    onChange={(e) =>
                      onUpdateRow(row.id, { person: e.target.value as PersonName })
                    }
                    aria-label="Người chi"
                    className={`liquid-glass-input w-full px-2.5 py-1.5 text-center rounded-xl cursor-pointer ${getSelectTextClass(
                      row.person,
                    )}`}
                  >
                    <option value="" className="bg-white text-slate-400 italic font-normal">
                      -- Chọn --
                    </option>
                    {PERSON_OPTIONS.map((p) => (
                      <option
                        key={p}
                        value={p}
                        className="bg-white text-slate-900 not-italic font-semibold"
                      >
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="py-2 px-2 text-center h-full flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={!!row.selectedForDelete}
                    onChange={(e) =>
                      onUpdateRow(row.id, { selectedForDelete: e.target.checked })
                    }
                    aria-label="Chọn xóa hàng"
                    className="w-5 h-5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-600"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MOBILE ANDROID CARD VIEW (below md) */}
      <div className="md:hidden space-y-2.5">
        {rows.map((row, idx) => {
          const stt = sttMap.get(row.id);
          return (
            <div
              key={row.id}
              className={`rounded-2xl border p-3 transition-colors duration-150 ${getRowColorClass(
                row.person,
              )} ${row.selectedForDelete ? 'row-marked-delete border-rose-400' : 'border-slate-300/80'}`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <span className="font-mono-num">
                    {stt ? `#${stt}` : `Dòng ${idx + 1}`}
                  </span>
                  {row.person && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className={getSelectTextClass(row.person)}>{row.person}</span>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onUpdateRow(row.id, { selectedForDelete: !row.selectedForDelete })
                  }
                  aria-label="Chọn xóa mục này"
                  className={`min-h-[36px] min-w-[36px] px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 border transition-colors cursor-pointer ${
                    row.selectedForDelete
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-white/80 text-slate-600 border-slate-300'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{row.selectedForDelete ? 'Đã chọn' : 'Xóa'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={row.amount}
                  onChange={(e) =>
                    onUpdateRow(row.id, {
                      amount: sanitizeCurrencyString(e.target.value, false),
                    })
                  }
                  placeholder="Số tiền (VD: 150,000)"
                  aria-label="Số tiền"
                  className="liquid-glass-input w-full min-h-[44px] px-3 py-2 text-right text-base font-bold text-slate-900 placeholder-slate-400 font-mono-num rounded-xl"
                />

                <input
                  type="text"
                  value={row.desc}
                  onChange={(e) => onUpdateRow(row.id, { desc: e.target.value })}
                  placeholder="Mục chi (VD: Tiền điện, đi chợ...)"
                  aria-label="Mục chi"
                  className="liquid-glass-input w-full min-h-[44px] px-3 py-2 text-sm text-slate-800 placeholder-slate-400 rounded-xl"
                />

                {/* One-tap person selector buttons for Android thumb ergonomics */}
                <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                  {PERSON_OPTIONS.map((p) => {
                    const active = row.person === p;
                    const activeStyle =
                      p === 'Bắp'
                        ? 'bg-emerald-700 text-white border-emerald-800'
                        : p === 'Kiều'
                          ? 'bg-amber-600 text-white border-amber-700'
                          : 'bg-slate-900 text-white border-slate-900';
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() =>
                          onUpdateRow(row.id, { person: active ? '' : p })
                        }
                        className={`min-h-[44px] rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          active
                            ? activeStyle
                            : 'bg-white/85 text-slate-700 border-slate-300 hover:bg-white'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Toolbar */}
      <div className="pt-3 border-t border-slate-200/70 grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-2.5 sm:gap-2">
        <button
          type="button"
          onClick={onAddRow}
          className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-semibold text-sm shadow-xs transition-all whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Thêm hàng</span>
        </button>

        <button
          type="button"
          onClick={onDeleteSelected}
          className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-[0.98] text-rose-700 border border-rose-200 font-semibold text-sm transition-all whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Trash2 className="w-4 h-4 shrink-0" />
          <span>
            Xóa hàng{selectedDeleteCount > 0 ? ` (${selectedDeleteCount})` : ''}
          </span>
        </button>

        <button
          type="button"
          onClick={onSaveDraft}
          className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-sm shadow-xs transition-all whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Save className="w-4 h-4 shrink-0" />
          <span>Lưu nháp</span>
        </button>

        <button
          type="button"
          onClick={handleClearClick}
          className={`min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold text-sm border transition-all whitespace-nowrap shrink-0 cursor-pointer active:scale-[0.98] ${
            clearArmed
              ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600 shadow-xs'
              : 'bg-white/90 hover:bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          <RotateCcw className="w-4 h-4 shrink-0" />
          <span>{clearArmed ? 'Xác nhận xóa' : 'Xóa toàn bộ'}</span>
        </button>

        {onOpenArchive && (
          <button
            type="button"
            onClick={onOpenArchive}
            className="hidden md:inline-flex min-h-[44px] items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/90 hover:bg-white text-slate-800 border border-slate-300 font-semibold text-sm shadow-xs transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Kho lưu trữ</span>
          </button>
        )}

        <button
          type="button"
          onClick={onSettle}
          className="col-span-2 sm:col-span-1 sm:ml-auto min-h-[48px] sm:min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-all whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Calculator className="w-4 h-4 shrink-0" />
          <span>Tất toán</span>
        </button>
      </div>
    </div>
  );
};

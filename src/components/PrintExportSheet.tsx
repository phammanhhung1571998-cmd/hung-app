import React from 'react';
import { ExpenseRow } from '../types';
import { formatNumberWithCommas, parseFormattedNumber } from '../utils/format';

interface PrintExportSheetProps {
  sheetRef: React.RefObject<HTMLDivElement | null>;
  month: string;
  fundMonth: string;
  rows: ExpenseRow[];
  fundInput: string;
  actualInput: string;
  notes: string[];
  showSettlement: boolean;
}

export const PrintExportSheet: React.FC<PrintExportSheetProps> = ({
  sheetRef,
  month,
  fundMonth,
  rows,
  fundInput,
  actualInput,
  notes,
  showSettlement,
}) => {
  const nonEmptyRows = rows.filter(
    (r) => r.amount.trim() !== '' || r.desc.trim() !== '' || r.person !== '',
  );
  const displayRows = nonEmptyRows.length > 0 ? nonEmptyRows : rows.slice(0, 1);

  let sttCounter = 1;
  let totalExpense = 0;
  let bapTotal = 0;
  let kieuTotal = 0;
  let hungTotal = 0;

  displayRows.forEach((r) => {
    const val = parseFormattedNumber(r.amount);
    totalExpense += val;
    if (r.person === 'Bắp') bapTotal += val;
    else if (r.person === 'Kiều') kieuTotal += val;
    else if (r.person === 'Hưng') hungTotal += val;
  });

  const fundAmount = parseFormattedNumber(fundInput);
  const remainingAmount = fundAmount - totalExpense;
  const actualAmount = parseFormattedNumber(actualInput);
  const differenceAmount = actualAmount - remainingAmount;
  const afterDebtTotal = kieuTotal + hungTotal;

  const getRowBg = (person: string) => {
    if (person === 'Bắp') return '#dcfce7';
    if (person === 'Kiều') return '#fef9c3';
    return '#ffffff';
  };

  return (
    <div
      ref={sheetRef}
      className="print-only-sheet hidden bg-white text-slate-900 p-6"
      style={{ width: '980px' }}
    >
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
        <h1 className="text-2xl font-extrabold text-slate-900 whitespace-nowrap">
          Sao kê tháng <span className="text-blue-700">{month}</span>
        </h1>
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#dcfce7] border border-[#86efac] whitespace-nowrap">
            Bắp
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#fef9c3] border border-[#fde047] whitespace-nowrap">
            Kiều
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-300 whitespace-nowrap">
            Hưng
          </span>
        </div>
      </div>

      {/* Main 4-column table */}
      <div className="rounded-xl border border-slate-300 overflow-hidden mb-5">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[#0f172a] text-white text-xs uppercase tracking-wider">
              <th className="py-2.5 px-3 text-center w-[90px] border-r border-slate-700 whitespace-nowrap">STT</th>
              <th className="py-2.5 px-3.5 text-right w-[170px] border-r border-slate-700 whitespace-nowrap">Số tiền</th>
              <th className="py-2.5 px-3.5 text-left border-r border-slate-700">Mục chi</th>
              <th className="py-2.5 px-3 text-center w-[135px] whitespace-nowrap">Người chi</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row) => {
              const hasAmount = row.amount.replace(/[^\d]/g, '').length > 0;
              const stt = hasAmount ? String(sttCounter++) : '';
              return (
                <tr
                  key={row.id}
                  style={{ backgroundColor: getRowBg(row.person) }}
                  className="border-t border-slate-200"
                >
                  <td className="py-2 px-3 text-center font-semibold text-slate-600 tabular-nums border-r border-slate-200 whitespace-nowrap">
                    {stt}
                  </td>
                  <td className="py-2 px-3.5 text-right font-bold text-slate-900 tabular-nums border-r border-slate-200 whitespace-nowrap">
                    {row.amount || '0'}
                  </td>
                  <td className="py-2 px-3.5 text-left text-slate-800 border-r border-slate-200">
                    {row.desc}
                  </td>
                  <td className="py-2 px-3 text-center font-bold text-slate-900 whitespace-nowrap">
                    {row.person || ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showSettlement && (
        <div className="grid grid-cols-[1fr_320px] gap-4 items-start">
          {/* Table 1 */}
          <div className="rounded-xl border border-slate-300 overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-xs uppercase tracking-wider font-bold border-b border-slate-300">
                  <th className="py-2.5 px-3 text-left w-[140px] border-r border-slate-300 whitespace-nowrap">Khoản mục</th>
                  <th className="py-2.5 px-3.5 text-right w-[165px] border-r border-slate-300 whitespace-nowrap">Số tiền</th>
                  <th className="py-2.5 px-3.5 text-left">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-200">
                  <td className="py-2.5 px-3 font-semibold border-r border-slate-200 whitespace-nowrap">Tổng tiền</td>
                  <td className="py-2.5 px-3.5 text-right font-bold text-red-600 tabular-nums border-r border-slate-200 whitespace-nowrap">
                    {formatNumberWithCommas(totalExpense)}
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-700">{notes[0] || ''}</td>
                </tr>
                <tr className="border-t border-slate-200">
                  <td className="py-2.5 px-3 font-semibold border-r border-slate-200 whitespace-nowrap">Quỹ tháng {fundMonth}</td>
                  <td className="py-2.5 px-3.5 text-right font-bold tabular-nums border-r border-slate-200 whitespace-nowrap">
                    {formatNumberWithCommas(fundAmount)}
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-700">{notes[1] || ''}</td>
                </tr>
                <tr className="border-t border-slate-200">
                  <td className="py-2.5 px-3 font-semibold border-r border-slate-200 whitespace-nowrap">Còn lại</td>
                  <td className="py-2.5 px-3.5 text-right font-bold tabular-nums border-r border-slate-200 whitespace-nowrap">
                    {formatNumberWithCommas(remainingAmount)}
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-700">{notes[2] || ''}</td>
                </tr>
                <tr className="border-t border-slate-200">
                  <td className="py-2.5 px-3 font-semibold border-r border-slate-200 whitespace-nowrap">Thực tế</td>
                  <td className="py-2.5 px-3.5 text-right font-bold tabular-nums border-r border-slate-200 whitespace-nowrap">
                    {formatNumberWithCommas(actualAmount)}
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-700">{notes[3] || ''}</td>
                </tr>
                <tr className="border-t border-slate-200">
                  <td className="py-2.5 px-3 font-semibold border-r border-slate-200 whitespace-nowrap">Chênh lệch</td>
                  <td className="py-2.5 px-3.5 text-right font-bold tabular-nums border-r border-slate-200 whitespace-nowrap">
                    {formatNumberWithCommas(differenceAmount)}
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-700">{notes[4] || ''}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Table 2: Số tiền phải trả */}
          <div className="rounded-xl border border-slate-300 overflow-hidden bg-white">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider font-bold">
                  <th colSpan={2} className="py-2.5 px-3.5 text-center whitespace-nowrap">
                    Số tiền phải trả
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-200 bg-[#dcfce7]">
                  <td className="py-2.5 px-3.5 font-semibold text-slate-900 border-r border-[#86efac] whitespace-nowrap">
                    Bắp tiêu
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-bold text-slate-900 tabular-nums whitespace-nowrap">
                    {formatNumberWithCommas(bapTotal)}
                  </td>
                </tr>
                <tr className="border-t border-slate-200 bg-[#fef9c3]">
                  <td className="py-2.5 px-3.5 font-semibold text-slate-900 border-r border-[#fde047] whitespace-nowrap">
                    Kiều tiêu
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-bold text-slate-900 tabular-nums whitespace-nowrap">
                    {formatNumberWithCommas(kieuTotal)}
                  </td>
                </tr>
                <tr className="border-t border-slate-200 bg-white">
                  <td className="py-2.5 px-3.5 font-semibold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                    Hưng tiêu
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-bold text-slate-900 tabular-nums whitespace-nowrap">
                    {formatNumberWithCommas(hungTotal)}
                  </td>
                </tr>
                <tr className="border-t border-slate-200 bg-rose-50 text-red-600">
                  <td className="py-2.5 px-3.5 font-bold border-r border-slate-200 whitespace-nowrap">
                    Tiền sau trả nợ
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-bold tabular-nums whitespace-nowrap">
                    {formatNumberWithCommas(afterDebtTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

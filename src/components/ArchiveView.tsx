import React, { useState } from 'react';
import { ArrowLeft, Eye, FolderOpen, RotateCcw, Trash2 } from 'lucide-react';
import { ArchiveSnapshot } from '../types';
import { formatDateTime, formatNumberWithCommas } from '../utils/format';

interface ArchiveViewProps {
  items: ArchiveSnapshot[];
  onDelete: (id: string) => void;
  onRestoreToEditor: (item: ArchiveSnapshot) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  items,
  onDelete,
  onRestoreToEditor,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const selectedItem = items.find((x) => x.id === selectedId) || null;

  const handleDeleteClick = (id: string) => {
    if (pendingDeleteId === id) {
      setPendingDeleteId(null);
      if (selectedId === id) setSelectedId(null);
      onDelete(id);
      return;
    }
    setPendingDeleteId(id);
    setTimeout(() => {
      setPendingDeleteId((cur) => (cur === id ? null : cur));
    }, 3000);
  };

  if (selectedItem) {
    const bgMap: Record<string, string> = {
      'Bắp': '#dcfce7',
      'Kiều': '#fef9c3',
    };

    const n = selectedItem.notes || [];

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
          <div>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="min-h-[40px] inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại danh sách</span>
            </button>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1">
              Sao kê tháng {selectedItem.month}
            </h2>
            <p className="text-xs text-slate-500">
              Lưu lúc {formatDateTime(selectedItem.savedAt)} · {selectedItem.rows.length} khoản
            </p>
          </div>

          <button
            type="button"
            onClick={() => onRestoreToEditor(selectedItem)}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-xs cursor-pointer whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Mở lại vào bảng chính</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-300/80 bg-white/80">
          <table className="w-full text-sm">
            <thead className="bg-[#0f172a] text-white text-xs">
              <tr>
                <th className="px-3 py-2.5 text-center w-14">STT</th>
                <th className="px-3 py-2.5 text-right">Số tiền</th>
                <th className="px-3 py-2.5 text-left">Mục chi</th>
                <th className="px-3 py-2.5 text-center">Người chi</th>
              </tr>
            </thead>
            <tbody>
              {selectedItem.rows.map((r, i) => (
                <tr
                  key={i}
                  style={{ background: bgMap[r.person] || 'transparent' }}
                  className="border-t border-slate-200"
                >
                  <td className="px-3 py-2 text-center text-slate-600 font-mono-num">{i + 1}</td>
                  <td className="px-3 py-2 text-right font-bold font-mono-num">
                    {r.amount || '0'}
                  </td>
                  <td className="px-3 py-2 text-slate-800">{r.desc}</td>
                  <td className="px-3 py-2 text-center font-semibold">{r.person || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="overflow-x-auto rounded-2xl border border-slate-300/80 bg-white/80">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="px-3 py-2.5 font-semibold">Tổng tiền</td>
                  <td className="px-3 py-2.5 text-right font-bold font-mono-num text-red-600">
                    {formatNumberWithCommas(selectedItem.total)}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">{n[0] || ''}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2.5 font-semibold">
                    Quỹ tháng {selectedItem.fundMonth || selectedItem.month}
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold font-mono-num">
                    {formatNumberWithCommas(selectedItem.fund)}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">{n[1] || ''}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2.5 font-semibold">Còn lại</td>
                  <td className="px-3 py-2.5 text-right font-bold font-mono-num">
                    {formatNumberWithCommas(selectedItem.remaining)}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">{n[2] || ''}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2.5 font-semibold">Thực tế</td>
                  <td className="px-3 py-2.5 text-right font-bold font-mono-num">
                    {formatNumberWithCommas(selectedItem.actual)}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">{n[3] || ''}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2.5 font-semibold">Chênh lệch</td>
                  <td className="px-3 py-2.5 text-right font-bold font-mono-num">
                    {formatNumberWithCommas(selectedItem.diff)}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">{n[4] || ''}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-slate-300/80 overflow-hidden text-sm bg-white">
            <div className="bg-slate-800 text-white text-xs font-bold text-center py-2.5">
              Số tiền phải trả
            </div>
            <div className="divide-y divide-slate-200">
              <div className="flex justify-between px-3.5 py-2.5 bg-[#dcfce7]">
                <span className="font-semibold">Bắp tiêu</span>
                <b className="font-mono-num">{formatNumberWithCommas(selectedItem.bap)}</b>
              </div>
              <div className="flex justify-between px-3.5 py-2.5 bg-[#fef9c3]">
                <span className="font-semibold">Kiều tiêu</span>
                <b className="font-mono-num">{formatNumberWithCommas(selectedItem.kieu)}</b>
              </div>
              <div className="flex justify-between px-3.5 py-2.5 bg-white">
                <span className="font-semibold">Hưng tiêu</span>
                <b className="font-mono-num">{formatNumberWithCommas(selectedItem.hung)}</b>
              </div>
              <div className="flex justify-between px-3.5 py-2.5 bg-rose-50 text-red-600">
                <b>Tiền sau trả nợ</b>
                <b className="font-mono-num">{formatNumberWithCommas(selectedItem.afterDebt)}</b>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="pb-3 border-b border-slate-200/80">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Kho lưu trữ</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Các bảng sao kê đã tất toán và lưu trữ ngoại tuyến trên thiết bị
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white/70 p-10 text-center">
          <FolderOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Chưa có bản lưu nào</p>
          <p className="text-xs text-slate-500 mt-1">
            Sau khi nhập chi tiêu và bấm "Tất toán", hãy bấm "Lưu trữ" để lưu lại theo tháng.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((it) => (
            <div
              key={it.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-300/80 bg-white/80 px-4 py-3.5"
            >
              <div>
                <div className="font-bold text-slate-900">Sao kê tháng {it.month}</div>
                <div className="text-xs text-slate-600 mt-0.5 flex flex-wrap items-center gap-1.5">
                  <span>{formatDateTime(it.savedAt)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{it.rows.length} khoản</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-red-600 font-mono-num">
                    Tổng: {formatNumberWithCommas(it.total)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedId(it.id)}
                  className="min-h-[44px] flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer whitespace-nowrap"
                >
                  <Eye className="w-4 h-4" />
                  <span>Xem</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteClick(it.id)}
                  className={`min-h-[44px] flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                    pendingDeleteId === it.id
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{pendingDeleteId === it.id ? 'Xác nhận xóa' : 'Xóa'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

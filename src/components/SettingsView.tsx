import React, { useRef } from 'react';
import { Download, KeyRound, LogOut, Upload } from 'lucide-react';
import { ToastType } from '../types';
import { LS_ARCHIVE, LS_DRAFT, lsGet, lsSet } from '../utils/storage';

interface SettingsViewProps {
  onChangePassword: () => void;
  onLogout: () => void;
  onDataImported: () => void;
  showToast: (msg: string, type?: ToastType) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onChangePassword,
  onLogout,
  onDataImported,
  showToast,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExportBackup = () => {
    const payload = {
      app: 'vn.saoke.chitieu',
      exportedAt: new Date().toISOString(),
      draft: JSON.parse(lsGet(LS_DRAFT) || 'null'),
      archive: JSON.parse(lsGet(LS_ARCHIVE) || '[]'),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sao-ke-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống file sao lưu dữ liệu (.json).', 'success');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        if (parsed.draft) lsSet(LS_DRAFT, JSON.stringify(parsed.draft));
        if (Array.isArray(parsed.archive)) {
          lsSet(LS_ARCHIVE, JSON.stringify(parsed.archive));
        }
        onDataImported();
        showToast('Đã khôi phục dữ liệu từ file sao lưu.', 'success');
      } catch {
        showToast('File sao lưu không hợp lệ.', 'warning');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-5">
      <div className="pb-3 border-b border-slate-200/80">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Cài đặt</h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Quản lý bảo mật mật khẩu và sao lưu dữ liệu.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-300/80 bg-white/80 p-5 space-y-3">
          <h3 className="font-bold text-slate-900">Sao lưu & Khôi phục dữ liệu</h3>
          <p className="text-xs text-slate-600">
            Xuất hoặc nhập file <code>.json</code> để chuyển toàn bộ dữ liệu nháp và kho lưu trữ giữa các thiết bị.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExportBackup}
              className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Xuất sao lưu (.json)</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-sm font-semibold cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Nhập sao lưu</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-300/80 bg-white/80 p-5 space-y-3">
          <h3 className="font-bold text-slate-900">Bảo mật & Tài khoản</h3>
          <p className="text-xs text-slate-600">
            Đổi mật khẩu đăng nhập hoặc khóa màn hình ứng dụng.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onChangePassword}
              className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-sm font-semibold cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Đổi / xóa mật khẩu</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-sm font-semibold cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Khóa ứng dụng</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Download, Share2, X } from 'lucide-react';
import { ToastType } from '../types';
import { dataUrlToBlob, triggerBlobDownload } from '../utils/mediaGallery';

interface PngPreviewModalProps {
  dataUrl: string;
  filename: string;
  onClose: () => void;
  showToast: (msg: string, type?: ToastType) => void;
}

export const PngPreviewModal: React.FC<PngPreviewModalProps> = ({
  dataUrl,
  filename,
  onClose,
  showToast,
}) => {
  const handleDownload = () => {
    const blob = dataUrlToBlob(dataUrl);
    triggerBlobDownload(blob, filename);
    showToast('Đang tải xuống ảnh PNG.', 'success');
  };

  const handleSaveOrShare = async () => {
    const blob = dataUrlToBlob(dataUrl);
    const file = new File([blob], filename, { type: 'image/png' });

    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [file] })
    ) {
      try {
        await navigator.share({
          files: [file],
          title: filename,
        });
        showToast('Đã mở trình lưu / chia sẻ ảnh.', 'success');
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }

    // Fallback: File System Access API on supported Chromium browsers
    const win = window as unknown as {
      showSaveFilePicker?: (opts: unknown) => Promise<{
        createWritable: () => Promise<{
          write: (data: Blob) => Promise<void>;
          close: () => Promise<void>;
        }>;
      }>;
    };

    if (typeof win.showSaveFilePicker === 'function') {
      try {
        const handle = await win.showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: 'PNG Image',
              accept: { 'image/png': ['.png'] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        showToast('Đã lưu ảnh PNG vào máy.', 'success');
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }

    handleDownload();
  };

  return (
    <div
      className="no-print fixed inset-0 z-[75] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90dvh] rounded-3xl bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-slate-200">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Ảnh sao kê PNG
            </h3>
            <p className="text-xs text-slate-500">
              Trên điện thoại, bạn có thể nhấn giữ ảnh hoặc chọn Lưu / Chia sẻ để lưu vào Thư viện ảnh.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng xem trước ảnh"
            className="min-h-[40px] min-w-[40px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-slate-100 p-3 sm:p-4 flex items-start justify-center">
          <img
            src={dataUrl}
            alt={filename}
            className="max-w-full h-auto rounded-xl border border-slate-300 shadow-sm bg-white"
          />
        </div>

        <div className="px-4 sm:px-5 py-3.5 border-t border-slate-200 bg-white flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="min-h-[44px] flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Tải xuống PNG</span>
          </button>

          <button
            type="button"
            onClick={handleSaveOrShare}
            className="min-h-[44px] flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Lưu vào Thư viện / Chia sẻ</span>
          </button>
        </div>
      </div>
    </div>
  );
};

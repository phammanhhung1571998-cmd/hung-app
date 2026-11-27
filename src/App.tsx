import { useCallback, useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Archive, Calculator, Lock, ReceiptText, Settings } from 'lucide-react';
import { ArchiveSnapshot, AppTab, ExpenseRow, ToastItem, ToastType } from './types';
import {
  createEmptyRows,
  DEFAULT_MONTH,
  DEFAULT_ROW_COUNT,
  loadArchive,
  loadDraft,
  LS_DRAFT,
  LS_PW,
  lsGet,
  lsSet,
  saveArchive,
  ssDel,
  ssGet,
  SS_UNLOCKED,
} from './utils/storage';
import {
  createRowId,
  formatDateTime,
  parseFormattedNumber,
} from './utils/format';
import { LockMode, LockScreen } from './components/LockScreen';
import { ToastContainer } from './components/ToastContainer';
import { OfflineIndicator } from './components/PWAInstallButton';
import { ExpenseView } from './components/ExpenseView';
import { SettlementView } from './components/SettlementView';
import { ArchiveView } from './components/ArchiveView';
import { SettingsView } from './components/SettingsView';
import { PrintExportSheet } from './components/PrintExportSheet';
import { PngPreviewModal } from './components/PngPreviewModal';
import { savePngToGalleryOrDevice, triggerBlobDownload } from './utils/mediaGallery';

export default function App() {
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    return !(ssGet(SS_UNLOCKED) === '1' && !!lsGet(LS_PW));
  });
  const [lockMode, setLockMode] = useState<LockMode>(() => {
    return lsGet(LS_PW) ? 'login' : 'setup';
  });

  const [activeTab, setActiveTab] = useState<AppTab>('expenses');
  const [month, setMonth] = useState<string>(DEFAULT_MONTH);
  const [fundMonth, setFundMonth] = useState<string>(DEFAULT_MONTH);
  const [rows, setRows] = useState<ExpenseRow[]>(() => createEmptyRows(DEFAULT_ROW_COUNT));
  const [fundInput, setFundInput] = useState<string>('');
  const [actualInput, setActualInput] = useState<string>('');
  const [notes, setNotes] = useState<string[]>(['', '', '', '', '']);
  const [settlementOpen, setSettlementOpen] = useState<boolean>(false);
  const [archiveList, setArchiveList] = useState<ArchiveSnapshot[]>(() => loadArchive());
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isExportingPng, setIsExportingPng] = useState<boolean>(false);
  const [pngPreview, setPngPreview] = useState<{ dataUrl: string; filename: string } | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const printSheetRef = useRef<HTMLDivElement | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = createRowId();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2700);
  }, []);

  // Restore draft & archive from localStorage on mount
  const hydrateFromStorage = useCallback(() => {
    setArchiveList(loadArchive());
    const draft = loadDraft();
    if (!draft) return;

    if (draft.month) setMonth(draft.month);
    if (draft.fundMonth) setFundMonth(draft.fundMonth);

    const count = Math.max(draft.rows.length, DEFAULT_ROW_COUNT);
    const restoredRows: ExpenseRow[] = Array.from({ length: count }, (_, i) => {
      const r = draft.rows[i];
      return {
        id: createRowId(),
        amount: r?.amount || '',
        desc: r?.desc || '',
        person: r?.person || '',
        selectedForDelete: false,
      };
    });
    setRows(restoredRows);
    setFundInput(draft.fund || '');
    setActualInput(draft.actual || '');
    setNotes([0, 1, 2, 3, 4].map((i) => (draft.notes && draft.notes[i]) || ''));
    setSettlementOpen(!!draft.settlementOpen);
    setIsDirty(false);
  }, []);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    document.title = `Sao_ke_thang_${month}`;
  }, [month]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const handleMonthSync = (nextMonth: string) => {
    setMonth(nextMonth);
    setFundMonth(nextMonth);
    setIsDirty(true);
  };

  const handleUpdateRow = (id: string, patch: Partial<ExpenseRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    if (!('selectedForDelete' in patch) || Object.keys(patch).length > 1) {
      setIsDirty(true);
    }
  };

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      { id: createRowId(), amount: '', desc: '', person: '', selectedForDelete: false },
    ]);
    showToast('Đã thêm 1 hàng mới vào bảng.', 'info');
  };

  const handleDeleteSelected = () => {
    const checkedCount = rows.filter((r) => r.selectedForDelete).length;
    if (checkedCount === 0) {
      showToast('Vui lòng chọn ít nhất 1 hàng để xóa.', 'warning');
      return;
    }
    const remaining = rows.filter((r) => !r.selectedForDelete);
    setRows(remaining.length > 0 ? remaining : createEmptyRows(1));
    setIsDirty(true);
    showToast(`Đã xóa ${checkedCount} hàng và cập nhật lại số thứ tự.`, 'success');
  };

  const handleClearAll = () => {
    setRows(createEmptyRows(DEFAULT_ROW_COUNT));
    setFundInput('');
    setActualInput('');
    setNotes(['', '', '', '', '']);
    setSettlementOpen(false);
    setIsDirty(true);
    showToast('Đã xóa toàn bộ dữ liệu trang làm việc.', 'success');
  };

  const getCompactRows = () =>
    rows
      .filter((r) => r.amount.trim() !== '' || r.desc.trim() !== '' || r.person !== '')
      .map(({ amount, desc, person }) => ({
        amount: amount.trim(),
        desc: desc.trim(),
        person,
      }));

  const handleSaveDraft = () => {
    const savedAt = new Date().toISOString();
    const payload = {
      savedAt,
      month,
      fundMonth,
      rows: getCompactRows(),
      fund: fundInput,
      actual: actualInput,
      notes,
      settlementOpen,
    };
    if (lsSet(LS_DRAFT, JSON.stringify(payload))) {
      setIsDirty(false);
      showToast(
        `Đã lưu nháp lúc ${formatDateTime(savedAt).slice(11)}. Lần sau mở lại sẽ tự khôi phục.`,
        'success',
      );
    } else {
      showToast('Không lưu được (trình duyệt chặn lưu trữ).', 'warning');
    }
  };

  const handleSettle = () => {
    const nonEmpty = rows.filter(
      (r) => r.amount.trim() !== '' || r.desc.trim() !== '' || r.person !== '',
    );
    const removedCount = rows.length - nonEmpty.length;
    setRows(nonEmpty.length > 0 ? nonEmpty : createEmptyRows(1));
    setSettlementOpen(true);

    // On narrow mobile screens, switch directly to Settlement tab
    if (window.innerWidth < 768) {
      setActiveTab('settlement');
    }

    if (removedCount > 0) {
      showToast(
        `Đã dọn ${removedCount} hàng trống và hoàn tất bảng tổng hợp.`,
        'success',
      );
    } else {
      showToast('Đã cập nhật bảng tổng hợp tất toán.', 'success');
    }
  };

  const handleArchiveSave = () => {
    const compactRows = getCompactRows();
    if (compactRows.length === 0) {
      showToast('Bảng đang trống, chưa có gì để lưu.', 'warning');
      return;
    }
    const sumBy = (p: string) =>
      compactRows
        .filter((r) => !p || r.person === p)
        .reduce((s, r) => s + parseFormattedNumber(r.amount), 0);

    const total = sumBy('');
    const fund = parseFormattedNumber(fundInput);
    const actual = parseFormattedNumber(actualInput);
    const remaining = fund - total;
    const kieu = sumBy('Kiều');
    const hung = sumBy('Hưng');

    const snapshot: ArchiveSnapshot = {
      id: createRowId(),
      savedAt: new Date().toISOString(),
      month,
      fundMonth,
      rows: compactRows,
      notes: [...notes],
      total,
      fund,
      remaining,
      actual,
      diff: actual - remaining,
      bap: sumBy('Bắp'),
      kieu,
      hung,
      afterDebt: kieu + hung,
    };

    const nextList = [snapshot, ...archiveList];
    if (saveArchive(nextList)) {
      setArchiveList(nextList);
      showToast(`Đã lưu sao kê tháng ${month} vào kho lưu trữ.`, 'success');
    } else {
      showToast('Không lưu được (trình duyệt chặn lưu trữ).', 'warning');
    }
  };

  const handleDeleteArchive = (id: string) => {
    const nextList = archiveList.filter((x) => x.id !== id);
    saveArchive(nextList);
    setArchiveList(nextList);
    showToast('Đã xóa bản lưu.', 'success');
  };

  const handleRestoreArchive = (item: ArchiveSnapshot) => {
    const count = Math.max(item.rows.length, DEFAULT_ROW_COUNT);
    const restoredRows: ExpenseRow[] = Array.from({ length: count }, (_, i) => {
      const r = item.rows[i];
      return {
        id: createRowId(),
        amount: r?.amount || '',
        desc: r?.desc || '',
        person: r?.person || '',
        selectedForDelete: false,
      };
    });
    setMonth(item.month);
    setFundMonth(item.fundMonth || item.month);
    setRows(restoredRows);
    setFundInput(item.fund ? String(item.fund).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '');
    setActualInput(item.actual ? String(item.actual).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '');
    setNotes([0, 1, 2, 3, 4].map((i) => (item.notes && item.notes[i]) || ''));
    setSettlementOpen(true);
    setActiveTab('expenses');
    setIsDirty(true);
    showToast(`Đã mở sao kê tháng ${item.month} vào bảng làm việc.`, 'success');
  };

  const handleExportPdf = () => {
    document.title = `Sao_ke_thang_${month}`;
    window.print();
  };

  const handleExportPng = async () => {
    const node = printSheetRef.current;
    if (!node) return;
    setIsExportingPng(true);

    // Render inside a 0x0 overflow-hidden viewport wrapper so layout/fonts compute at (0,0) without flashing
    const holder = document.createElement('div');
    holder.style.cssText =
      'position:fixed;top:0;left:0;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none;z-index:-1;';
    const inner = document.createElement('div');
    inner.style.cssText = 'width:980px;background:#ffffff;';
    const clone = node.cloneNode(true) as HTMLElement;
    clone.classList.remove('hidden', 'print-only-sheet');
    clone.style.display = 'block';
    inner.appendChild(clone);
    holder.appendChild(inner);
    document.body.appendChild(holder);

    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );

      const height = Math.max(clone.scrollHeight, 200);
      const dataUrl = await toPng(clone, {
        pixelRatio: 2,
        width: 980,
        height,
        backgroundColor: '#ffffff',
        cacheBust: false,
      });

      const filename = `sao-ke-thang-${month}.png`;
      const result = await savePngToGalleryOrDevice(dataUrl, filename);

      if (result.savedNatively) {
        showToast('Đã lưu ảnh PNG vào Thư viện ảnh của máy.', 'success');
      } else {
        triggerBlobDownload(result.blob, filename);
        setPngPreview({ dataUrl, filename });
        showToast('Đã xuất ảnh PNG. Bạn có thể lưu vào Thư viện ảnh.', 'success');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      showToast(
        msg || 'Xuất PNG không thành công, vui lòng cấp quyền hoặc thử lại.',
        'warning',
      );
    } finally {
      holder.remove();
      setIsExportingPng(false);
    }
  };

  const handleLogout = () => {
    ssDel(SS_UNLOCKED);
    setLockMode(lsGet(LS_PW) ? 'login' : 'setup');
    setIsLocked(true);
  };

  const handleChangePassword = () => {
    setLockMode('secret');
    setIsLocked(true);
  };

  const handleNoteChange = (index: number, val: string) => {
    setNotes((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
    setIsDirty(true);
  };

  const navItems: { id: AppTab; label: string; shortLabel: string; icon: typeof ReceiptText }[] = [
    { id: 'expenses', label: 'Bảng chi tiêu', shortLabel: 'Chi tiêu', icon: ReceiptText },
    { id: 'settlement', label: 'Tất toán', shortLabel: 'Tất toán', icon: Calculator },
    { id: 'archive', label: 'Kho lưu trữ', shortLabel: 'Lưu trữ', icon: Archive },
    { id: 'settings', label: 'Cài đặt', shortLabel: 'Cài đặt', icon: Settings },
  ];

  return (
    <>
      {isLocked && (
        <LockScreen
          initialMode={lockMode}
          onUnlock={() => setIsLocked(false)}
          onCancelToApp={() => setIsLocked(false)}
          showToast={showToast}
        />
      )}

      {!isLocked && (
        <div className="no-print min-h-dvh flex flex-col pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:pb-8">
          {/* DESKTOP TOP BAR (3-Zone Contract: Brand — Nav Links — Primary Action) */}
          <header className="hidden md:flex items-center justify-between gap-8 max-w-6xl w-full mx-auto px-6 py-4">
            <span className="text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
              Sao Kê Chi Tiêu
            </span>

            <nav className="flex items-center gap-6 text-sm font-semibold">
              {navItems.map((item) => {
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`py-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                      active
                        ? 'text-blue-700 border-blue-600'
                        : 'text-slate-600 border-transparent hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleLogout}
                className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Khóa</span>
              </button>
            </div>
          </header>

          {/* MOBILE TOP APP BAR (Compact 48px to respect <= 15% sticky height cap) */}
          <header className="md:hidden sticky top-0 z-30 h-12 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-3.5 flex items-center justify-between gap-2">
            <span className="text-sm font-extrabold tracking-tight text-slate-900 truncate">
              Sao Kê Tháng {month}
            </span>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Khóa ứng dụng"
                className="min-h-[38px] min-w-[38px] rounded-xl bg-slate-900 text-white flex items-center justify-center cursor-pointer"
              >
                <Lock className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* MAIN WORKSPACE */}
          <main className="max-w-6xl w-full mx-auto px-3 sm:px-6 pt-3 md:pt-1 mb-2 md:mb-0 flex-1">
            <div className="glass-sheet-card rounded-3xl p-4 sm:p-7 space-y-6">
              {activeTab === 'expenses' && (
                <>
                  <ExpenseView
                    month={month}
                    onMonthChange={handleMonthSync}
                    rows={rows}
                    onUpdateRow={handleUpdateRow}
                    onAddRow={handleAddRow}
                    onDeleteSelected={handleDeleteSelected}
                    onClearAll={handleClearAll}
                    onSaveDraft={handleSaveDraft}
                    onSettle={handleSettle}
                    onOpenArchive={() => setActiveTab('archive')}
                  />

                  {settlementOpen && (
                    <div className="hidden md:block pt-4 border-t border-slate-200/80">
                      <SettlementView
                        rows={rows}
                        fundMonth={fundMonth}
                        onFundMonthChange={handleMonthSync}
                        fundInput={fundInput}
                        onFundInputChange={(val) => {
                          setFundInput(val);
                          setIsDirty(true);
                        }}
                        actualInput={actualInput}
                        onActualInputChange={(val) => {
                          setActualInput(val);
                          setIsDirty(true);
                        }}
                        notes={notes}
                        onNoteChange={handleNoteChange}
                        onArchiveSave={handleArchiveSave}
                        onExportPdf={handleExportPdf}
                        onExportPng={handleExportPng}
                        isExportingPng={isExportingPng}
                      />
                    </div>
                  )}
                </>
              )}

              {activeTab === 'settlement' && (
                <SettlementView
                  rows={rows}
                  fundMonth={fundMonth}
                  onFundMonthChange={handleMonthSync}
                  fundInput={fundInput}
                  onFundInputChange={(val) => {
                    setFundInput(val);
                    setIsDirty(true);
                  }}
                  actualInput={actualInput}
                  onActualInputChange={(val) => {
                    setActualInput(val);
                    setIsDirty(true);
                  }}
                  notes={notes}
                  onNoteChange={handleNoteChange}
                  onArchiveSave={handleArchiveSave}
                  onExportPdf={handleExportPdf}
                  onExportPng={handleExportPng}
                  isExportingPng={isExportingPng}
                />
              )}

              {activeTab === 'archive' && (
                <ArchiveView
                  items={archiveList}
                  onDelete={handleDeleteArchive}
                  onRestoreToEditor={handleRestoreArchive}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  onChangePassword={handleChangePassword}
                  onLogout={handleLogout}
                  onDataImported={hydrateFromStorage}
                  showToast={showToast}
                />
              )}
            </div>
          </main>

          {/* MOBILE FIXED BOTTOM TAB BAR (56px height, thumb zone) */}
          <nav
            aria-label="Điều hướng chính"
            className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe"
          >
            <div className="grid grid-cols-4 h-14">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] transition-colors cursor-pointer ${
                      active ? 'text-blue-700' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 2} />
                    <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
                      {item.shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      )}

      {/* Clean A4 Landscape Print & PNG Export Template */}
      <PrintExportSheet
        sheetRef={printSheetRef}
        month={month}
        fundMonth={fundMonth}
        rows={rows}
        fundInput={fundInput}
        actualInput={actualInput}
        notes={notes}
        showSettlement={settlementOpen || activeTab === 'settlement'}
      />

      {pngPreview && (
        <PngPreviewModal
          dataUrl={pngPreview.dataUrl}
          filename={pngPreview.filename}
          onClose={() => setPngPreview(null)}
          showToast={showToast}
        />
      )}

      <OfflineIndicator />
      <ToastContainer toasts={toasts} />
    </>
  );
}

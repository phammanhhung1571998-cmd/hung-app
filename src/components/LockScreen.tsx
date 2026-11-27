import React, { useEffect, useState } from 'react';
import { Lock, KeyRound, ShieldCheck } from 'lucide-react';
import { hashPassword } from '../utils/format';
import { LS_PW, lsDel, lsGet, lsSet, SECRET_CODE, ssDel, ssGet, ssSet, SS_UNLOCKED } from '../utils/storage';
import { ToastType } from '../types';

export type LockMode = 'setup' | 'login' | 'secret' | 'newpw';

interface LockScreenProps {
  initialMode: LockMode;
  onUnlock: () => void;
  onCancelToApp?: () => void;
  showToast: (msg: string, type?: ToastType) => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  initialMode,
  onUnlock,
  onCancelToApp,
  showToast,
}) => {
  const [mode, setMode] = useState<LockMode>(initialMode);
  const [secret, setSecret] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setMode(initialMode);
    setSecret('');
    setPw('');
    setPw2('');
    setError('');
  }, [initialMode]);

  const switchMode = (next: LockMode) => {
    setMode(next);
    setSecret('');
    setPw('');
    setPw2('');
    setError('');
  };

  const handleBack = () => {
    if (ssGet(SS_UNLOCKED) === '1' && onCancelToApp) {
      onCancelToApp();
    } else {
      switchMode(lsGet(LS_PW) ? 'login' : 'setup');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'setup' || mode === 'newpw') {
      if (pw.length < 4) {
        setError('Mật khẩu cần ít nhất 4 ký tự.');
        return;
      }
      if (pw !== pw2) {
        setError('Hai lần nhập mật khẩu chưa khớp.');
        return;
      }
      const hashed = await hashPassword(pw);
      if (!lsSet(LS_PW, hashed)) {
        setError('Không lưu được mật khẩu (trình duyệt chặn lưu trữ).');
        return;
      }
      ssSet(SS_UNLOCKED, '1');
      showToast(mode === 'newpw' ? 'Đã đổi mật khẩu.' : 'Đã lưu mật khẩu.', 'success');
      onUnlock();
      return;
    }

    if (mode === 'login') {
      const stored = lsGet(LS_PW);
      const hashed = await hashPassword(pw);
      if (stored && hashed === stored) {
        ssSet(SS_UNLOCKED, '1');
        onUnlock();
      } else {
        setError('Mật khẩu không đúng.');
      }
      return;
    }

    if (mode === 'secret') {
      if (secret === SECRET_CODE) {
        switchMode('newpw');
      } else {
        setError('Mật khẩu bí mật không đúng.');
      }
    }
  };

  const handleDeletePassword = () => {
    lsDel(LS_PW);
    ssDel(SS_UNLOCKED);
    switchMode('setup');
    showToast('Đã xóa mật khẩu. Hãy tạo mật khẩu mới.', 'info');
  };

  const titles: Record<LockMode, { title: string; desc: string; submit: string }> = {
    setup: {
      title: 'Tạo mật khẩu',
      desc: 'Lần đầu sử dụng: hãy đặt mật khẩu để bảo vệ dữ liệu sao kê.',
      submit: 'Lưu mật khẩu & vào',
    },
    login: {
      title: 'Đăng nhập',
      desc: 'Nhập mật khẩu để mở bảng sao kê chi tiêu.',
      submit: 'Đăng nhập',
    },
    secret: {
      title: 'Mật khẩu bí mật',
      desc: 'Nhập mật khẩu bí mật để đổi hoặc xóa mật khẩu đăng nhập.',
      submit: 'Xác nhận',
    },
    newpw: {
      title: 'Đổi mật khẩu',
      desc: 'Nhập mật khẩu mới, hoặc xóa mật khẩu hiện tại.',
      submit: 'Lưu mật khẩu mới',
    },
  };

  const meta = titles[mode];

  return (
    <div className="no-print fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#eef4fb]/90 backdrop-blur-md">
      <div className="glass-sheet-card rounded-3xl p-6 sm:p-8 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            {mode === 'secret' ? (
              <KeyRound className="w-5 h-5" />
            ) : mode === 'setup' || mode === 'newpw' ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <Lock className="w-5 h-5" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{meta.title}</h2>
            <p className="text-xs text-slate-500">Sao Kê Chi Tiêu</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-5 leading-relaxed">{meta.desc}</p>

        <form onSubmit={handleSubmit} className="space-y-3" autoComplete="off">
          {mode === 'secret' && (
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Mật khẩu bí mật"
              autoFocus
              className="liquid-glass-input w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-slate-900 text-base"
            />
          )}

          {(mode === 'setup' || mode === 'login' || mode === 'newpw') && (
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder={mode === 'newpw' ? 'Mật khẩu mới' : 'Mật khẩu'}
              autoFocus
              className="liquid-glass-input w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-slate-900 text-base"
            />
          )}

          {(mode === 'setup' || mode === 'newpw') && (
            <input
              type="password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              className="liquid-glass-input w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-slate-900 text-base"
            />
          )}

          <p className="text-sm font-semibold text-rose-600 min-h-[1.25rem]" role="alert">
            {error}
          </p>

          <button
            type="submit"
            className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            {meta.submit}
          </button>

          {mode === 'newpw' && (
            <button
              type="button"
              onClick={handleDeletePassword}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-sm transition-colors cursor-pointer"
            >
              Xóa mật khẩu
            </button>
          )}

          {mode !== 'setup' && (
            <button
              type="button"
              onClick={() => (mode === 'login' ? switchMode('secret') : handleBack())}
              className="w-full min-h-[40px] text-center text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
            >
              {mode === 'login' ? 'Đổi hoặc xóa mật khẩu' : '← Quay lại'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

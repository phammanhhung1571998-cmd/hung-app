import { ArchiveSnapshot, DraftData, ExpenseRow } from '../types';
import { createRowId } from './format';

export const LS_PW = 'sk_pw_hash';
export const LS_ARCHIVE = 'sk_archive';
export const LS_DRAFT = 'sk_draft';
export const SS_UNLOCKED = 'sk_unlocked';
export const SECRET_CODE = '190405';
export const DEFAULT_ROW_COUNT = 15;
export const DEFAULT_MONTH = '11';

export function lsGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function lsSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function lsDel(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function ssGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function ssSet(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export function ssDel(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function loadArchive(): ArchiveSnapshot[] {
  try {
    const raw = lsGet(LS_ARCHIVE);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveArchive(list: ArchiveSnapshot[]): boolean {
  return lsSet(LS_ARCHIVE, JSON.stringify(list));
}

export function loadDraft(): DraftData | null {
  try {
    const raw = lsGet(LS_DRAFT);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && Array.isArray(parsed.rows) ? parsed : null;
  } catch {
    return null;
  }
}

export function createEmptyRows(count = DEFAULT_ROW_COUNT): ExpenseRow[] {
  return Array.from({ length: count }, () => ({
    id: createRowId(),
    amount: '',
    desc: '',
    person: '',
    selectedForDelete: false,
  }));
}

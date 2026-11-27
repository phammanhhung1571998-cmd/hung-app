export type PersonName = '' | 'Bắp' | 'Hưng' | 'Kiều';

export interface ExpenseRow {
  id: string;
  amount: string;
  desc: string;
  person: PersonName;
  selectedForDelete?: boolean;
}

export interface ArchiveRow {
  amount: string;
  desc: string;
  person: PersonName;
}

export interface ArchiveSnapshot {
  id: string;
  savedAt: string;
  month: string;
  fundMonth?: string;
  rows: ArchiveRow[];
  notes: string[];
  total: number;
  fund: number;
  remaining: number;
  actual: number;
  diff: number;
  bap: number;
  kieu: number;
  hung: number;
  afterDebt: number;
}

export interface DraftData {
  savedAt: string;
  month: string;
  fundMonth: string;
  rows: ArchiveRow[];
  fund: string;
  actual: string;
  notes: string[];
  settlementOpen: boolean;
}

export type AppTab = 'expenses' | 'settlement' | 'archive' | 'settings';

export type ToastType = 'info' | 'warning' | 'success';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

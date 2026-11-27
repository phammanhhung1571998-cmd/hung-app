export function formatNumberWithCommas(num: number | null | undefined): string {
  if (num === null || num === undefined || Number.isNaN(num)) {
    return '0';
  }
  const rounded = Math.round(num);
  const isNegative = rounded < 0;
  const absDigits = Math.abs(rounded).toString();
  const formatted = absDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return isNegative ? `-${formatted}` : formatted;
}

export function parseFormattedNumber(str: string | undefined | null): number {
  if (!str || typeof str !== 'string') return 0;
  const cleaned = str.replace(/,/g, '').trim();
  if (cleaned === '' || cleaned === '-') return 0;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function sanitizeCurrencyString(rawValue: string, allowNegative = false): string {
  const isNeg = allowNegative && rawValue.trim().startsWith('-');
  const digitsOnly = rawValue.replace(/\D/g, '');

  if (digitsOnly === '') {
    return isNeg ? '-' : '';
  }

  const normalizedDigits = digitsOnly.replace(/^0+(?=\d)/, '');
  const formattedDigits = normalizedDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return isNeg ? `-${formattedDigits}` : formattedDigits;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fallbackHash(str: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 'b:' + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

export async function hashPassword(text: string): Promise<string> {
  try {
    if (window.crypto && window.crypto.subtle) {
      const buf = await window.crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode('sk|' + text),
      );
      return (
        'a:' +
        Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
      );
    }
  } catch {
    // Fallback for non-secure contexts
  }
  return fallbackHash('sk|' + text);
}

export function createRowId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

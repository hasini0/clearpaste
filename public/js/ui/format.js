// Locale-aware formatting helpers (dates are shown in the reader's language).

const parse = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

export function todayISO() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export const daysBetween = (fromISO, toISO) => Math.round((parse(toISO) - parse(fromISO)) / 86_400_000);

export function formatDate(iso, lang = 'en') {
  try {
    return new Intl.DateTimeFormat(lang, { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(parse(iso));
  } catch {
    return iso;
  }
}

export function relativeDays(days, lang = 'en') {
  try {
    return new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }).format(days, 'day');
  } catch {
    return days === 0 ? 'today' : days > 0 ? `in ${days} days` : `${-days} days ago`;
  }
}

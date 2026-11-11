// Transaction dates are stored as UTC midnight (e.g. "2026-11-11" -> 2026-11-11T00:00:00Z).
// Always read/format them in UTC so they don't shift by a day in the viewer's local timezone.

// Today's date in the user's local timezone, as "YYYY-MM-DD" (for <input type="date">).
export const todayLocalISO = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

// Stored transaction date -> "YYYY-MM-DD"
export const toDateInputValue = (date) => new Date(date).toISOString().split('T')[0];

// Format a stored transaction date for display without timezone shift.
export const formatTxDate = (date, options = {}, locale = undefined) =>
  new Date(date).toLocaleDateString(locale, { ...options, timeZone: 'UTC' });

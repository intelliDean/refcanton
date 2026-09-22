// frontend/js/formatters.js
// Number, currency, and date formatting utilities

export function formatUSD(amount) {
  if (amount === undefined || amount === null) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatUnits(units, symbol = 'COLLAT-TEST') {
  if (units === undefined || units === null) return `0 ${symbol}`;
  return `${Number(units).toLocaleString()} ${symbol}`;
}

export function formatPercent(rate) {
  if (rate === undefined || rate === null) return '0.0%';
  return `${(Number(rate) * 100).toFixed(1)}%`;
}

export function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(isoString) {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    return isNaN(d.getTime()) ? isoString : d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoString;
  }
}

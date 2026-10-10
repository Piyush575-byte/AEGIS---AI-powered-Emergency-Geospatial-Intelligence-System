/**
 * Format a number with locale-appropriate thousands separators.
 */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-IN');
}

/**
 * Calculate relative time string from a Date object.
 */
export function timeAgo(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;

  const diffHours = Math.floor(diffMin / 60);
  const remainingMin = diffMin % 60;

  if (diffHours < 24) {
    return remainingMin > 0
      ? `${diffHours}h ${remainingMin}m ago`
      : `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

/**
 * Format a Date object to a display-friendly time string.
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Format date and time together.
 */
export function formatDateTime(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) + ' ' + formatTime(date);
}

/**
 * Get current date/time in IST format for header display.
 */
export function getCurrentDateTime(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) + '  ' + new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }) + ' IST';
}

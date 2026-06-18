/**
 * Date utilities — pure native JS, no external dependency.
 * Drop-in replacements for date-fns format() and formatDistanceToNow()
 */

/**
 * format(date, 'MMM d, yyyy')        → "Jun 12, 2026"
 * format(date, 'MMM d, yyyy HH:mm')  → "Jun 12, 2026 09:34"
 */
export const format = (date, pattern) => {
  const d = new Date(date);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const pad = (n) => String(n).padStart(2, '0');

  return pattern
    .replace('MMM', months[d.getMonth()])
    .replace('yyyy', d.getFullYear())
    .replace('MM', pad(d.getMonth() + 1))
    .replace('dd', pad(d.getDate()))
    .replace('d', d.getDate())
    .replace('HH', pad(d.getHours()))
    .replace('mm', pad(d.getMinutes()))
    .replace('ss', pad(d.getSeconds()));
};

/**
 * formatDistanceToNow(date, { addSuffix: true }) → "3 days ago" / "in 5 minutes"
 */
export const formatDistanceToNow = (date, options = {}) => {
  const now = new Date();
  const d   = new Date(date);
  const diffMs = now - d;
  const abs = Math.abs(diffMs);
  const future = diffMs < 0;

  const seconds = Math.floor(abs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours   = Math.floor(minutes / 60);
  const days    = Math.floor(hours / 24);
  const months  = Math.floor(days / 30);
  const years   = Math.floor(days / 365);

  let label;
  if (seconds < 60)       label = 'less than a minute';
  else if (minutes < 60)  label = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  else if (hours < 24)    label = `${hours} hour${hours !== 1 ? 's' : ''}`;
  else if (days < 30)     label = `${days} day${days !== 1 ? 's' : ''}`;
  else if (months < 12)   label = `${months} month${months !== 1 ? 's' : ''}`;
  else                    label = `${years} year${years !== 1 ? 's' : ''}`;

  if (!options.addSuffix) return label;
  return future ? `in ${label}` : `${label} ago`;
};

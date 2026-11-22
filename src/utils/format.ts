let seq = 0;
export const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/** "now", "5m", "3h", "2d", "4w" — used in headers and comments. */
export function timeShort(iso: string): string {
  const d = Date.now() - new Date(iso).getTime();
  if (d < MIN) return 'now';
  if (d < HOUR) return `${Math.floor(d / MIN)}m`;
  if (d < DAY) return `${Math.floor(d / HOUR)}h`;
  if (d < WEEK) return `${Math.floor(d / DAY)}d`;
  return `${Math.floor(d / WEEK)}w`;
}

/** "5 minutes ago", "2 days ago", "November 3" — used under posts. */
export function timeLong(iso: string): string {
  const d = Date.now() - new Date(iso).getTime();
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'} ago`;
  if (d < MIN) return 'Just now';
  if (d < HOUR) return plural(Math.floor(d / MIN), 'minute');
  if (d < DAY) return plural(Math.floor(d / HOUR), 'hour');
  if (d < WEEK) return plural(Math.floor(d / DAY), 'day');
  const date = new Date(iso);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) });
}

/** Chat separators: "Today 14:05", "Mon 09:12", "Nov 3, 18:40". */
export function chatStamp(iso: string): string {
  const date = new Date(iso);
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const d = Date.now() - date.getTime();
  if (d < DAY && date.getDate() === new Date().getDate()) return `Today ${time}`;
  if (d < WEEK) return `${date.toLocaleDateString('en-US', { weekday: 'short' })} ${time}`;
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${time}`;
}

/** Full number with separators: 18,402 */
export const formatNumber = (n: number) => n.toLocaleString('en-US');

/** Compact for profile stats: 248K, 1.2M, 9,870 */
export function formatCompact(n: number): string {
  if (n < 10_000) return formatNumber(n);
  if (n < 1_000_000) return `${+(n / 1000).toFixed(n < 100_000 ? 1 : 0)}K`;
  return `${+(n / 1_000_000).toFixed(1)}M`;
}

export const plural = (n: number, one: string, many = `${one}s`) => `${formatNumber(n)} ${n === 1 ? one : many}`;

/** Resize an uploaded image so it fits in storage (max 1080px, JPEG). */
export function downscaleImage(file: File, max = 1080): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Unsupported image'));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

import type { SVGProps } from 'react';

/** Line icon set drawn for Glimpse. 24×24, inherits currentColor. */
type P = SVGProps<SVGSVGElement> & { size?: number; filled?: boolean };

const Svg = ({ size = 24, children, ...rest }: P & { children: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
    {children}
  </svg>
);

export const HomeIcon = ({ filled, ...p }: P) => (
  <Svg {...p}>
    <path d="M3 10.2 12 3l9 7.2V20a1 1 0 0 1-1 1h-5v-6.5h-6V21H4a1 1 0 0 1-1-1z" fill={filled ? 'currentColor' : 'none'} />
    {filled && <rect x="9.6" y="14.5" width="4.8" height="6.5" fill="var(--bg)" stroke="none" />}
  </Svg>
);
export const SearchIcon = ({ filled, ...p }: P) => (
  <Svg {...p} strokeWidth={filled ? 2.8 : 2}><circle cx="10.5" cy="10.5" r="7" /><path d="m16 16 5 5" /></Svg>
);
export const ExploreIcon = ({ filled, ...p }: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9.5" fill={filled ? 'currentColor' : 'none'} />
    <path d="m15.8 8.2-2.2 5.4-5.4 2.2 2.2-5.4z" fill={filled ? 'var(--bg)' : 'none'} stroke={filled ? 'var(--bg)' : 'currentColor'} />
  </Svg>
);
export const ReelsIcon = ({ filled, ...p }: P) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="5" fill={filled ? 'currentColor' : 'none'} />
    <path d="M3 8.5h18M9 3l2.5 5.5M15 3l2.5 5.5" stroke={filled ? 'var(--bg)' : 'currentColor'} />
    <path d="M10.2 12.3v5.2l4.4-2.6z" fill={filled ? 'var(--bg)' : 'currentColor'} stroke={filled ? 'var(--bg)' : 'currentColor'} strokeWidth={1.4} />
  </Svg>
);
export const SendIcon = ({ filled, ...p }: P) => (
  <Svg {...p}>
    <path d="M21.5 2.5 2.8 9.6l7.4 3.3 3.3 7.6z" fill={filled ? 'currentColor' : 'none'} />
    <path d="m21.5 2.5-11.3 10.4" stroke={filled ? 'var(--bg)' : 'currentColor'} />
  </Svg>
);
export const HeartIcon = ({ filled, ...p }: P) => (
  <Svg {...p}>
    <path d="M12 20.4s-8.5-5-8.5-11.1A4.8 4.8 0 0 1 8.3 4.5c1.6 0 2.9.8 3.7 2 .8-1.2 2.1-2 3.7-2a4.8 4.8 0 0 1 4.8 4.8C20.5 15.4 12 20.4 12 20.4z"
      fill={filled ? 'currentColor' : 'none'} />
  </Svg>
);
export const CreateIcon = (p: P) => (
  <Svg {...p}><rect x="3" y="3" width="18" height="18" rx="5" /><path d="M12 8v8M8 12h8" /></Svg>
);
export const MenuIcon = (p: P) => <Svg {...p}><path d="M4 6h16M4 12h16M4 18h16" /></Svg>;
export const CommentIcon = (p: P) => (
  <Svg {...p}><path d="M20.7 16.6A9.3 9.3 0 1 0 17 20.3l4 1z" /></Svg>
);
export const BookmarkIcon = ({ filled, ...p }: P) => (
  <Svg {...p}><path d="M19 21 12 15.2 5 21V4.5a1.5 1.5 0 0 1 1.5-1.5h11A1.5 1.5 0 0 1 19 4.5z" fill={filled ? 'currentColor' : 'none'} /></Svg>
);
export const DotsIcon = (p: P) => (
  <Svg {...p}><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" /></Svg>
);
export const CloseIcon = (p: P) => <Svg {...p}><path d="M5 5l14 14M19 5 5 19" /></Svg>;
export const ChevronLeft = (p: P) => <Svg {...p}><path d="m15 5-7 7 7 7" /></Svg>;
export const ChevronRight = (p: P) => <Svg {...p}><path d="m9 5 7 7-7 7" /></Svg>;
export const ChevronDown = (p: P) => <Svg {...p}><path d="m5 9 7 7 7-7" /></Svg>;
export const BackIcon = (p: P) => <Svg {...p}><path d="M20 12H4m6-7-7 7 7 7" /></Svg>;
export const GridIcon = (p: P) => (
  <Svg {...p}><rect x="3" y="3" width="18" height="18" rx="1" /><path d="M9 3v18M15 3v18M3 9h18M3 15h18" /></Svg>
);
export const TagIcon = (p: P) => (
  <Svg {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="12" cy="10" r="3" /><path d="M6.5 21a5.8 5.8 0 0 1 11 0" /></Svg>
);
export const SettingsIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </Svg>
);
export const EmojiIcon = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="9.5" /><path d="M8 14.5a5 5 0 0 0 8 0" /><circle cx="9" cy="9.5" r=".6" fill="currentColor" /><circle cx="15" cy="9.5" r=".6" fill="currentColor" /></Svg>
);
export const LocationIcon = (p: P) => (
  <Svg {...p}><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></Svg>
);
export const ImageIcon = (p: P) => (
  <Svg {...p}><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.8" /><path d="m21 15-5-5L5 21" /></Svg>
);
export const MediaDropIcon = (p: P) => (
  <svg width={p.size ?? 96} height={(p.size ?? 96) * 0.8} viewBox="0 0 120 96" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinejoin="round" aria-hidden="true">
    <rect x="34" y="6" width="68" height="58" rx="8" transform="rotate(10 68 35)" />
    <rect x="16" y="22" width="68" height="58" rx="8" transform="rotate(-8 50 51)" fill="var(--bg)" />
    <path d="m26 70 14-16 10 10 8-7 16 15" transform="rotate(-8 50 51)" />
    <circle cx="60" cy="40" r="5" transform="rotate(-8 50 51)" />
  </svg>
);
export const PlayIcon = ({ filled = true, ...p }: P) => (
  <Svg {...p}><path d="M7 4.5v15l12.5-7.5z" fill={filled ? 'currentColor' : 'none'} /></Svg>
);
export const PauseIcon = (p: P) => (
  <Svg {...p}><rect x="6" y="4.5" width="3.8" height="15" rx="1" fill="currentColor" /><rect x="14.2" y="4.5" width="3.8" height="15" rx="1" fill="currentColor" /></Svg>
);
export const VolumeIcon = ({ muted, ...p }: P & { muted?: boolean }) => (
  <Svg {...p}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
    {muted ? <path d="m16 9.5 5 5m0-5-5 5" /> : <path d="M16 8.5a5 5 0 0 1 0 7M18.8 6a8.5 8.5 0 0 1 0 12" />}
  </Svg>
);
export const VerifiedBadge = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Verified" role="img" className="verified">
    <path fill="#0095f6" d="M12 1.5l2.4 1.9 3-.3 1.1 2.8 2.8 1.1-.3 3 1.9 2.4-1.9 2.4.3 3-2.8 1.1-1.1 2.8-3-.3L12 22.5l-2.4-1.9-3 .3-1.1-2.8-2.8-1.1.3-3L1.1 12 3 9.6l-.3-3 2.8-1.1 1.1-2.8 3 .3z" />
    <path d="m7.5 12.2 3 3 6-6.2" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const LinkIcon = (p: P) => (
  <Svg {...p}><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" /><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" /></Svg>
);
export const PhoneIcon = (p: P) => (
  <Svg {...p}><path d="M21 16.5v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 2.5 5.2 2 2 0 0 1 4.5 3h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.4 11a16 16 0 0 0 4.6 4.6l1.4-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" /></Svg>
);
export const VideoIcon = (p: P) => (
  <Svg {...p}><rect x="2.5" y="6" width="13.5" height="12" rx="2.5" /><path d="m16 10.5 5.5-3.5v10l-5.5-3.5z" /></Svg>
);
export const InfoIcon = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="9.5" /><path d="M12 11v6" /><circle cx="12" cy="7.6" r=".6" fill="currentColor" /></Svg>
);
export const MicIcon = (p: P) => (
  <Svg {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></Svg>
);
export const CarouselBadge = (p: P) => (
  <svg width={p.size ?? 22} height={p.size ?? 22} viewBox="0 0 24 24" aria-label="Carousel" role="img">
    <rect x="7" y="2.5" width="14.5" height="14.5" rx="2.5" fill="#fff" />
    <path d="M4 7.5v11A2.5 2.5 0 0 0 6.5 21h11" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
export const ReelBadge = (p: P) => (
  <svg width={p.size ?? 20} height={p.size ?? 20} viewBox="0 0 24 24" aria-label="Reel" role="img">
    <rect x="3" y="3" width="18" height="18" rx="5" fill="#fff" />
    <path d="M10.2 9.5v6l5-3z" fill="#000" />
  </svg>
);
export const SunMoonIcon = (p: P) => (
  <Svg {...p}><path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a7 7 0 0 0 10.7 10.7z" /></Svg>
);
export const ActivityIcon = (p: P) => <Svg {...p}><path d="M3 12h4l3-8 4 16 3-8h4" /></Svg>;
export const CheckIcon = (p: P) => <Svg {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></Svg>;
export const CheckCircle = (p: P) => (
  <svg width={p.size ?? 96} height={p.size ?? 96} viewBox="0 0 96 96" fill="none" aria-hidden="true" className="check-circle">
    <defs>
      <linearGradient id="cg" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stopColor="#f9ce34" /><stop offset=".5" stopColor="#ee2a7b" /><stop offset="1" stopColor="#6228d7" />
      </linearGradient>
    </defs>
    <circle cx="48" cy="48" r="44" stroke="url(#cg)" strokeWidth="4" />
    <path d="m30 49 12 12 24-26" stroke="url(#cg)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const PlusIcon = (p: P) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const EditIcon = (p: P) => (
  <Svg {...p}><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z" /><path d="M5 21h14" /></Svg>
);
export const AudioIcon = (p: P) => (
  <Svg {...p}><path d="M9 18V5l11-2v13" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></Svg>
);
export const CropIcon = (p: P) => (
  <Svg {...p}><path d="M6 2v14a2 2 0 0 0 2 2h14M2 6h14a2 2 0 0 1 2 2v14" /></Svg>
);
export const ResetIcon = (p: P) => (
  <Svg {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></Svg>
);
export const LogoutIcon = (p: P) => (
  <Svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></Svg>
);
export const ArchiveIcon = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="9.5" /><path d="M12 7v5l3 2" /></Svg>
);
export const ShareOutIcon = (p: P) => (
  <Svg {...p}><path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></Svg>
);

/** Brand mark: an eye-shaped aperture ("a glimpse"). */
export const LogoMark = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-label="Glimpse" role="img">
    <path d="M2 12c2.6-4.6 6-7 10-7s7.4 2.4 10 7c-2.6 4.6-6 7-10 7s-7.4-2.4-10-7z" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3.6" />
    <circle cx="13.6" cy="10.4" r="1" fill="currentColor" stroke="none" />
  </svg>
);
export const Wordmark = ({ className = '' }: { className?: string }) => (
  <span className={`wordmark ${className}`} aria-label="Glimpse">Glimpse</span>
);

import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDb, useMe, useUI } from '../../store/AppStore';
import { unreadDmCount, unreadNotificationCount } from '../../store/selectors';
import {
  BackIcon, CreateIcon, ExploreIcon, HeartIcon, HomeIcon, ReelsIcon, SendIcon, Wordmark,
} from '../icons/Icons';
import { Avatar } from '../common/Avatar';

/** Bottom tab bar on phones. */
export function BottomNav() {
  const db = useDb();
  const me = useMe();
  const { pathname } = useLocation();
  const { setCreateOpen } = useUI();
  const at = (p: string) => (p === '/' ? pathname === '/' : pathname.startsWith(p));
  const onProfile = pathname === `/${me.username}` || pathname.startsWith(`/${me.username}/`);
  const dms = unreadDmCount(db);
  return (
    <nav className="bottom-nav" aria-label="Primary">
      <Link to="/" aria-label="Home"><HomeIcon filled={at('/')} /></Link>
      <Link to="/explore" aria-label="Explore"><ExploreIcon filled={at('/explore')} /></Link>
      <Link to="/reels" aria-label="Reels"><ReelsIcon filled={at('/reels')} /></Link>
      <button onClick={() => setCreateOpen(true)} aria-label="Create"><CreateIcon /></button>
      <Link to="/direct/inbox" aria-label="Messages" className="bn-badge-wrap">
        <SendIcon filled={at('/direct')} />
        {dms > 0 && <span className="badge-count">{dms}</span>}
      </Link>
      <Link to={`/${me.username}`} aria-label="Profile">
        <span className={`nav-avatar ${onProfile ? 'active' : ''}`}><Avatar user={me} size={26} /></span>
      </Link>
    </nav>
  );
}

/** Top bar on the mobile home feed. */
export function MobileHomeHeader() {
  const db = useDb();
  return (
    <header className="mobile-header">
      <Link to="/" className="mobile-logo"><Wordmark /></Link>
      <div className="mobile-header-actions">
        <Link to="/notifications" aria-label="Notifications" className="bn-badge-wrap">
          <HeartIcon />
          {unreadNotificationCount(db) > 0 && <span className="badge-dot" />}
        </Link>
      </div>
    </header>
  );
}

/** Generic mobile title bar with a back button. */
export function MobileTitleBar({ title, right, back = true }: { title: ReactNode; right?: ReactNode; back?: boolean }) {
  const navigate = useNavigate();
  return (
    <header className="mobile-header titled">
      {back ? <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Back"><BackIcon /></button> : <span className="icon-btn-spacer" />}
      <h1 className="mobile-title">{title}</h1>
      <div className="mobile-header-right">{right ?? <span className="icon-btn-spacer" />}</div>
    </header>
  );
}

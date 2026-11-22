import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useActions, useDb, useMe, useUI } from '../../store/AppStore';
import { unreadDmCount, unreadNotificationCount } from '../../store/selectors';
import { useClickOutside, useMediaQuery } from '../../hooks';
import {
  ActivityIcon, BookmarkIcon, CreateIcon, ExploreIcon, HeartIcon, HomeIcon, LogoMark, LogoutIcon,
  MenuIcon, ReelsIcon, ResetIcon, SearchIcon, SendIcon, SettingsIcon, SunMoonIcon, Wordmark,
} from '../icons/Icons';
import { Avatar } from '../common/Avatar';
import { SearchPanel } from '../panels/SearchPanel';
import { NotificationsPanel } from '../panels/NotificationsPanel';

interface ItemProps {
  icon: ReactNode;
  label: string;
  to?: string;
  onClick?(): void;
  active?: boolean;
  badge?: number | 'dot';
}

function NavItem({ icon, label, to, onClick, active, badge }: ItemProps) {
  const inner = (
    <>
      <span className="nav-icon">
        {icon}
        {badge === 'dot' && <span className="badge-dot" />}
        {typeof badge === 'number' && badge > 0 && <span className="badge-count">{badge}</span>}
      </span>
      <span className="nav-label">{label}</span>
    </>
  );
  const cls = `nav-item ${active ? 'active' : ''}`;
  return to ? (
    <Link to={to} className={cls} onClick={onClick} aria-current={active ? 'page' : undefined} title={label}>{inner}</Link>
  ) : (
    <button type="button" className={cls} onClick={onClick} title={label} aria-pressed={active}>{inner}</button>
  );
}

export function Sidebar() {
  const db = useDb();
  const me = useMe();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { panel, setPanel, setCreateOpen, toggleTheme, toast } = useUI();
  const { resetDemo } = useActions();
  const [moreOpen, setMoreOpen] = useState(false);
  const wide = useMediaQuery('(min-width: 1264px)');

  const onDirect = pathname.startsWith('/direct');
  const collapsed = !wide || panel !== null || onDirect;
  const at = (p: string) => panel === null && (p === '/' ? pathname === '/' : pathname.startsWith(p));
  const onProfile = panel === null && (pathname === `/${me.username}` || pathname.startsWith(`/${me.username}/`));
  const closePanel = () => setPanel(null);
  const togglePanel = (p: 'search' | 'notifications') => setPanel(panel === p ? null : p);
  const moreRef = useClickOutside<HTMLDivElement>(() => setMoreOpen(false), moreOpen);

  return (
    <>
      <nav className={`sidebar ${collapsed ? 'collapsed' : ''}`} aria-label="Primary">
        <Link to="/" className="sidebar-logo" onClick={closePanel} aria-label="Glimpse home">
          <span className="logo-full"><Wordmark /></span>
          <span className="logo-mark"><LogoMark size={26} /></span>
        </Link>
        <div className="nav-list">
          <NavItem to="/" label="Home" active={at('/')} onClick={closePanel} icon={<HomeIcon filled={at('/')} />} />
          <NavItem label="Search" active={panel === 'search'} onClick={() => togglePanel('search')} icon={<SearchIcon filled={panel === 'search'} />} />
          <NavItem to="/explore" label="Explore" active={at('/explore')} onClick={closePanel} icon={<ExploreIcon filled={at('/explore')} />} />
          <NavItem to="/reels" label="Reels" active={at('/reels')} onClick={closePanel} icon={<ReelsIcon filled={at('/reels')} />} />
          <NavItem to="/direct/inbox" label="Messages" active={at('/direct')} onClick={closePanel}
            badge={unreadDmCount(db)} icon={<SendIcon filled={at('/direct')} />} />
          <NavItem label="Notifications" active={panel === 'notifications'} onClick={() => togglePanel('notifications')}
            badge={unreadNotificationCount(db) > 0 ? 'dot' : undefined} icon={<HeartIcon filled={panel === 'notifications'} />} />
          <NavItem label="Create" onClick={() => { closePanel(); setCreateOpen(true); }} icon={<CreateIcon />} />
          <NavItem to={`/${me.username}`} label="Profile" active={onProfile} onClick={closePanel}
            icon={<span className={`nav-avatar ${onProfile ? 'active' : ''}`}><Avatar user={me} size={24} /></span>} />
        </div>
        <div className="nav-more" ref={moreRef}>
          {moreOpen && (
            <div className="more-menu" role="menu">
              <button role="menuitem" onClick={() => { setMoreOpen(false); navigate('/accounts/edit'); }}><SettingsIcon size={18} />Settings</button>
              <button role="menuitem" onClick={() => { setMoreOpen(false); setPanel('notifications'); }}><ActivityIcon size={18} />Your activity</button>
              <button role="menuitem" onClick={() => { setMoreOpen(false); navigate(`/${me.username}/saved`); }}><BookmarkIcon size={18} />Saved</button>
              <button role="menuitem" onClick={() => { setMoreOpen(false); toggleTheme(); }}><SunMoonIcon size={18} />Switch appearance</button>
              <div className="more-sep" />
              <button role="menuitem" onClick={() => { setMoreOpen(false); resetDemo(); }}><ResetIcon size={18} />Reset sample data</button>
              <div className="more-sep thin" />
              <button role="menuitem" onClick={() => { setMoreOpen(false); toast('This is a demo — you stay signed in as @' + me.username); }}><LogoutIcon size={18} />Log out</button>
            </div>
          )}
          <NavItem label="More" active={moreOpen} onClick={() => setMoreOpen((o) => !o)} icon={<MenuIcon />} />
        </div>
      </nav>
      <div className={`side-panel ${panel ? 'open' : ''}`} aria-hidden={!panel}>
        {panel === 'search' && <SearchPanel onClose={closePanel} />}
        {panel === 'notifications' && <NotificationsPanel onClose={closePanel} />}
      </div>
      {panel && <div className="panel-scrim" onClick={closePanel} />}
    </>
  );
}

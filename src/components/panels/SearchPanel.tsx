import { useEffect, useRef, useState } from 'react';
import { useActions, useDb } from '../../store/AppStore';
import { searchUsers } from '../../store/selectors';
import { formatCompact } from '../../utils/format';
import { CloseIcon, SearchIcon } from '../icons/Icons';
import { UserRow } from '../common/UserBits';

/** Search UI shared by the desktop slide-out panel and the mobile Explore page. */
export function SearchResults({ query, onNavigate }: { query: string; onNavigate?(): void }) {
  const db = useDb();
  const { addRecentSearch, removeRecentSearch, clearRecentSearches } = useActions();
  const results = searchUsers(db, query);
  const recent = db.recentSearchIds.map((id) => db.users[id]).filter(Boolean);
  const go = (id: string) => { addRecentSearch(id); onNavigate?.(); };
  const subtitle = (id: string) => {
    const u = db.users[id];
    const following = db.followingIds.includes(id);
    return `${u.fullName}${following ? ' • Following' : ` • ${formatCompact(u.followerCount)} followers`}`;
  };

  if (query.trim()) {
    return (
      <div className="search-results">
        {results.length === 0 && <p className="empty-note">No results found.</p>}
        {results.map((u) => (
          <UserRow key={u.id} user={u} subtitle={subtitle(u.id)} onNavigate={() => go(u.id)} />
        ))}
      </div>
    );
  }
  return (
    <div className="search-results">
      <div className="search-recent-head">
        <h3>Recent</h3>
        {recent.length > 0 && <button className="text-btn blue" onClick={clearRecentSearches}>Clear all</button>}
      </div>
      {recent.length === 0 && <p className="empty-note center">No recent searches.</p>}
      {recent.map((u) => (
        <UserRow key={u.id} user={u} subtitle={subtitle(u.id)} onNavigate={() => go(u.id)}
          right={(
            <button className="icon-btn muted" onClick={() => removeRecentSearch(u.id)} aria-label={`Remove ${u.username}`}>
              <CloseIcon size={18} />
            </button>
          )} />
      ))}
    </div>
  );
}

export function SearchInput({ value, onChange, autoFocus }: { value: string; onChange(v: string): void; autoFocus?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (autoFocus) ref.current?.focus(); }, [autoFocus]);
  return (
    <label className="search-input">
      {!value && <SearchIcon size={16} className="search-input-icon" />}
      <input ref={ref} type="search" placeholder="Search" value={value} onChange={(e) => onChange(e.target.value)} aria-label="Search users" />
      {value && (
        <button type="button" className="search-clear" onClick={() => onChange('')} aria-label="Clear search">
          <CloseIcon size={10} strokeWidth={3} />
        </button>
      )}
    </label>
  );
}

export function SearchPanel({ onClose }: { onClose(): void }) {
  const [q, setQ] = useState('');
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Search</h2>
        <SearchInput value={q} onChange={setQ} autoFocus />
      </div>
      <div className="panel-body"><SearchResults query={q} onNavigate={onClose} /></div>
    </div>
  );
}

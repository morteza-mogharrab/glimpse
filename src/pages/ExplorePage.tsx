import { useMemo, useState } from 'react';
import { useDb } from '../store/AppStore';
import { explorePosts, suggestedUsers } from '../store/selectors';
import { useInfiniteScroll, useIsMobile } from '../hooks';
import { PostGrid } from '../components/profile/PostGrid';
import { SearchInput, SearchResults } from '../components/panels/SearchPanel';
import { FollowButton, UserRow } from '../components/common/UserBits';
import { MobileTitleBar } from '../components/layout/MobileNav';
import { formatCompact } from '../utils/format';

export function ExplorePage() {
  const db = useDb();
  const isMobile = useIsMobile();
  const all = useMemo(() => explorePosts(db), [db]);
  const [count, setCount] = useState(30);
  const [q, setQ] = useState('');
  const [focused, setFocused] = useState(false);
  const sentinel = useInfiniteScroll(() => setCount((c) => c + 15), count < all.length);

  return (
    <div className="explore">
      {isMobile && (
        <div className="explore-search" onFocus={() => setFocused(true)}>
          <SearchInput value={q} onChange={setQ} />
          {focused && <button className="text-btn" onClick={() => { setFocused(false); setQ(''); }}>Cancel</button>}
        </div>
      )}
      {isMobile && focused ? (
        <SearchResults query={q} onNavigate={() => setFocused(false)} />
      ) : (
        <>
          <PostGrid posts={all.slice(0, count)} variant="explore" />
          <div ref={sentinel} />
        </>
      )}
    </div>
  );
}

/** "See all" suggestions page. */
export function PeoplePage() {
  const db = useDb();
  const isMobile = useIsMobile();
  const people = suggestedUsers(db, 50);
  const others = Object.values(db.users).filter((u) => u.id !== db.meId && db.followingIds.includes(u.id));
  return (
    <div className="narrow-page">
      {isMobile && <MobileTitleBar title="Discover people" />}
      <h2 className="section-title">Suggested</h2>
      {people.length === 0 && <p className="empty-note">You follow everyone here. 🎉</p>}
      {people.map((u) => (
        <UserRow key={u.id} user={u} subtitle={`${u.fullName} · ${u.followsMe ? 'Follows you' : `${formatCompact(u.followerCount)} followers`}`} right={<FollowButton user={u} small />} />
      ))}
      <h2 className="section-title">People you follow</h2>
      {others.map((u) => <UserRow key={u.id} user={u} right={<FollowButton user={u} small />} />)}
    </div>
  );
}

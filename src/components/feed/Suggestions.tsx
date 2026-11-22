import { Link } from 'react-router-dom';
import { useDb, useMe, useUI } from '../../store/AppStore';
import { suggestedUsers } from '../../store/selectors';
import { Avatar } from '../common/Avatar';
import { FollowButton, UserRow } from '../common/UserBits';

const FOOTER = ['About', 'Help', 'Press', 'API', 'Jobs', 'Privacy', 'Terms', 'Locations', 'Language'];

/** Right-hand rail on wide screens. */
export function Suggestions() {
  const db = useDb();
  const me = useMe();
  const { toast } = useUI();
  const suggested = suggestedUsers(db, 5);
  return (
    <aside className="rail">
      <div className="rail-me">
        <Link to={`/${me.username}`}><Avatar user={me} size={44} /></Link>
        <div className="user-row-text">
          <Link to={`/${me.username}`} className="user-row-name">{me.username}</Link>
          <span className="user-row-sub">{me.fullName}</span>
        </div>
        <button className="text-btn blue small" onClick={() => toast('Only one demo account is available')}>Switch</button>
      </div>
      {suggested.length > 0 && (
        <>
          <div className="rail-head">
            <span>Suggested for you</span>
            <Link to="/explore/people" className="text-btn small">See all</Link>
          </div>
          {suggested.map((u) => (
            <UserRow key={u.id} user={u} size={44}
              subtitle={u.followsMe ? 'Follows you' : `Followed by ${db.users[db.followingIds[(u.id.length) % db.followingIds.length]]?.username ?? 'people you know'}`}
              right={<FollowButton user={u} variant="link" />} />
          ))}
        </>
      )}
      <footer className="rail-footer">
        <p>{FOOTER.join(' · ')}</p>
        <p>© 2026 Glimpse · a demo app</p>
        <p className="sample-note">People, posts and messages here are sample content.</p>
      </footer>
    </aside>
  );
}

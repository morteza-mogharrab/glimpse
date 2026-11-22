import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { User } from '../../types';
import { useActions, useDb, useIsFollowing, useUI } from '../../store/AppStore';
import { VerifiedBadge } from '../icons/Icons';
import { Avatar } from './Avatar';
import { Confirm } from './Modal';

export function UsernameLink({ user, className = '' }: { user: User; className?: string }) {
  return (
    <Link to={`/${user.username}`} className={`username ${className}`}>
      {user.username}
      {user.verified && <VerifiedBadge />}
    </Link>
  );
}

type FollowVariant = 'button' | 'link';

/** Follow / Following toggle. Unfollowing asks for confirmation like the real app. */
export function FollowButton({ user, variant = 'button', small = false }: { user: User; variant?: FollowVariant; small?: boolean }) {
  const db = useDb();
  const following = useIsFollowing(user.id);
  const { toggleFollow } = useActions();
  const [confirm, setConfirm] = useState(false);
  if (user.id === db.meId) return null;

  const label = following ? 'Following' : user.followsMe ? 'Follow back' : 'Follow';
  const onClick = () => (following ? setConfirm(true) : toggleFollow(user.id));

  return (
    <>
      {variant === 'link' ? (
        <button className={`text-btn ${following ? 'muted' : 'blue'}`} onClick={onClick}>{label}</button>
      ) : (
        <button className={`btn ${following ? 'btn-secondary' : 'btn-primary'} ${small ? 'btn-sm' : ''}`} onClick={onClick}>
          {label}
        </button>
      )}
      {confirm && (
        <UnfollowConfirm user={user} onClose={() => setConfirm(false)} onConfirm={() => toggleFollow(user.id)} />
      )}
    </>
  );
}

export function UnfollowConfirm({ user, onClose, onConfirm }: { user: User; onClose(): void; onConfirm(): void }) {
  return (
    <Confirm onClose={onClose} onConfirm={onConfirm} confirmLabel="Unfollow"
      title={`Unfollow @${user.username}?`}
      body="Their posts will no longer show up in your home feed. You can follow them again anytime." />
  );
}

/** Avatar + username + subtitle row used in lists, search and suggestions. */
export function UserRow({ user, subtitle, right, size = 44, onNavigate, story = false }: {
  user: User; subtitle?: string; right?: React.ReactNode; size?: number; onNavigate?(): void; story?: boolean;
}) {
  return (
    <div className="user-row">
      <Link to={`/${user.username}`} className="user-row-main" onClick={onNavigate}>
        <span onClick={(e) => story && e.preventDefault()}><Avatar user={user} size={size} story={story} /></span>
        <span className="user-row-text">
          <span className="user-row-name">{user.username}{user.verified && <VerifiedBadge />}</span>
          <span className="user-row-sub">{subtitle ?? user.fullName}</span>
        </span>
      </Link>
      {right}
    </div>
  );
}

export function Toasts() {
  const { toasts } = useUI();
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => <div key={t.id} className="toast">{t.text}</div>)}
    </div>
  );
}

/** Renders text with @mentions and #hashtags as links. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/((?<=^|\s)[@#][\w.]*\w)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('@')) {
          const name = part.slice(1).replace(/\.$/, '');
          return <Link key={i} to={`/${name}`} className="mention">{part}</Link>;
        }
        if (part.startsWith('#')) return <Link key={i} to="/explore" className="mention">{part}</Link>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import type { User } from '../../types';
import { useDb, useUI } from '../../store/AppStore';
import { hasUnseenStory, storyOf } from '../../store/selectors';

interface Props {
  user: User;
  size?: number;
  /** Show the story ring when the user has a story; clicking opens it. */
  story?: boolean;
  /** Wrap in a link to the profile (ignored when a story opens instead). */
  link?: boolean;
  className?: string;
}

export function Avatar({ user, size = 32, story = false, link = false, className = '' }: Props) {
  const db = useDb();
  const { openStories } = useUI();
  const s = story ? storyOf(db, user.id) : undefined;
  const ring = s ? (hasUnseenStory(s) ? 'ring-unseen' : 'ring-seen') : '';
  const pad = size >= 120 ? 5 : size >= 56 ? 4 : 3;

  const img = (
    <img src={user.avatar} alt={`${user.username}'s profile picture`} width={size} height={size}
      className="avatar-img" draggable={false} loading="lazy" />
  );

  if (s) {
    const open = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      openStories({ storyIds: [s.id], startIndex: 0 });
    };
    return (
      <button type="button" className={`avatar ${ring} ${className}`} onClick={open}
        style={{ width: size + pad * 2, height: size + pad * 2, padding: pad }}
        aria-label={`Open ${user.username}'s story`}>
        <span className="avatar-inner">{img}</span>
      </button>
    );
  }
  const body = <span className={`avatar ${className}`} style={{ width: size, height: size }}>{img}</span>;
  return link ? <Link to={`/${user.username}`} className="avatar-link" aria-label={user.username}>{body}</Link> : body;
}

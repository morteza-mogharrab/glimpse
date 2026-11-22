import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { AppNotification } from '../../types';
import { useActions, useDb } from '../../store/AppStore';
import { useOpenPost } from '../../hooks';
import { suggestedUsers } from '../../store/selectors';
import { timeShort } from '../../utils/format';
import { Avatar } from '../common/Avatar';
import { FollowButton, UserRow } from '../common/UserBits';

const DAY = 86_400_000;
function bucket(n: AppNotification): string {
  const age = Date.now() - new Date(n.createdAt).getTime();
  if (!n.read) return 'New';
  if (age < DAY) return 'Today';
  if (age < 7 * DAY) return 'This week';
  if (age < 30 * DAY) return 'This month';
  return 'Earlier';
}
const ORDER = ['New', 'Today', 'This week', 'This month', 'Earlier'];

export function NotificationList({ onNavigate }: { onNavigate?(): void }) {
  const db = useDb();
  const { readAllNotifications } = useActions();
  const openPost = useOpenPost();

  // Mark as read shortly after the list is seen (keeps the "New" section visible this time).
  useEffect(() => {
    const t = setTimeout(readAllNotifications, 1500);
    return () => clearTimeout(t);
  }, [readAllNotifications]);

  const groups = new Map<string, AppNotification[]>();
  for (const n of db.notifications) {
    const k = bucket(n);
    groups.set(k, [...(groups.get(k) ?? []), n]);
  }

  const verb = (n: AppNotification) => {
    switch (n.type) {
      case 'like': return 'liked your post.';
      case 'comment': return <>commented: {n.text}</>;
      case 'follow': return 'started following you.';
      case 'mention': return <>mentioned you in a comment: {n.text}</>;
      case 'comment_like': return <>liked your comment: {n.text}</>;
    }
  };

  return (
    <div className="notif-list">
      {ORDER.filter((k) => groups.has(k)).map((k) => (
        <section key={k} className="notif-section">
          <h3>{k}</h3>
          {groups.get(k)!.map((n) => {
            const u = db.users[n.userId];
            const post = n.postId ? db.posts[n.postId] : undefined;
            if (!u) return null;
            return (
              <div key={n.id} className={`notif ${n.read ? '' : 'unread'}`}>
                <Link to={`/${u.username}`} onClick={onNavigate}><Avatar user={u} size={44} /></Link>
                <p className="notif-text">
                  <Link to={`/${u.username}`} className="username" onClick={onNavigate}>{u.username}</Link>{' '}
                  {verb(n)} <span className="muted">{timeShort(n.createdAt)}</span>
                </p>
                {n.type === 'follow' ? (
                  <FollowButton user={u} small />
                ) : post ? (
                  <button className="notif-thumb" onClick={() => { onNavigate?.(); openPost(post.id); }} aria-label="Open post">
                    <img src={post.media[0].thumb ?? post.media[0].src} alt="" style={{ filter: post.filter }} />
                  </button>
                ) : null}
              </div>
            );
          })}
        </section>
      ))}
      <section className="notif-section">
        <h3>Suggested for you</h3>
        {suggestedUsers(db, 4).map((u) => (
          <UserRow key={u.id} user={u} subtitle={u.followsMe ? 'Follows you' : 'Suggested for you'} onNavigate={onNavigate}
            right={<FollowButton user={u} small />} />
        ))}
      </section>
    </div>
  );
}

export function NotificationsPanel({ onClose }: { onClose(): void }) {
  return (
    <div className="panel">
      <div className="panel-head"><h2>Notifications</h2></div>
      <div className="panel-body"><NotificationList onNavigate={onClose} /></div>
    </div>
  );
}

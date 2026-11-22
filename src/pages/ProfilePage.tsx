import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { User } from '../types';
import { useActions, useDb, useIsFollowing, useUI } from '../store/AppStore';
import {
  followList, mutualFollowers, postsByUser, reelsByUser, savedPosts, taggedPosts,
} from '../store/selectors';
import { useIsMobile } from '../hooks';
import { formatCompact, formatNumber } from '../utils/format';
import {
  BookmarkIcon, ChevronDown, CloseIcon, DotsIcon, GridIcon, LinkIcon, PlusIcon, ReelsIcon, SettingsIcon, TagIcon, MediaDropIcon,
} from '../components/icons/Icons';
import { VerifiedBadge } from '../components/icons/Icons';
import { Avatar } from '../components/common/Avatar';
import { ActionSheet, Modal } from '../components/common/Modal';
import { FollowButton, RichText, UnfollowConfirm, UserRow } from '../components/common/UserBits';
import { PostGrid } from '../components/profile/PostGrid';
import { MobileTitleBar } from '../components/layout/MobileNav';

type Tab = 'posts' | 'reels' | 'saved' | 'tagged';

function FollowListModal({ user, kind, onClose }: { user: User; kind: 'followers' | 'following'; onClose(): void }) {
  const db = useDb();
  const { removeFollower } = useActions();
  const [q, setQ] = useState('');
  const list = followList(db, user.id, kind).filter((u) => !q || u.username.includes(q.toLowerCase()) || u.fullName.toLowerCase().includes(q.toLowerCase()));
  const mine = user.id === db.meId;
  return (
    <Modal onClose={onClose} className="list-modal" label={kind}>
      <header className="modal-head">
        <span className="icon-btn-spacer" />
        <h2>{kind === 'followers' ? 'Followers' : 'Following'}</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Close"><CloseIcon size={20} /></button>
      </header>
      <div className="share-search"><input className="search-plain" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="list-modal-body">
        {list.length === 0 && <p className="empty-note center">No users found.</p>}
        {list.map((u) => (
          <UserRow key={u.id} user={u} onNavigate={onClose} story
            right={mine && kind === 'followers'
              ? <button className="btn btn-secondary btn-sm" onClick={() => removeFollower(u.id)}>Remove</button>
              : <FollowButton user={u} small />} />
        ))}
      </div>
    </Modal>
  );
}

export function ProfilePage({ tab: initialTab = 'posts' }: { tab?: Tab }) {
  const { username } = useParams();
  const db = useDb();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { openStories, toast } = useUI();
  const { openConversation, toggleFollow } = useActions();
  const user = username ? db.users[username] : undefined;
  const following = useIsFollowing(user?.id ?? '');
  const [list, setList] = useState<'followers' | 'following' | null>(null);
  const [menu, setMenu] = useState(false);
  const [unfollow, setUnfollow] = useState(false);

  if (!user) {
    return (
      <div className="not-found">
        <h2>Sorry, this page isn&rsquo;t available.</h2>
        <p>The link you followed may be broken, or the page may have been removed. <Link to="/" className="blue">Go back to Glimpse.</Link></p>
      </div>
    );
  }

  const me = user.id === db.meId;
  const tab: Tab = initialTab === 'saved' && !me ? 'posts' : initialTab;
  const posts = postsByUser(db, user.id);
  const tabPosts = tab === 'posts' ? posts : tab === 'reels' ? reelsByUser(db, user.id) : tab === 'saved' ? savedPosts(db) : taggedPosts(db, user.id);
  const mutuals = me ? [] : mutualFollowers(db, user.id);
  const base = `/${user.username}`;

  const stats = (
    <ul className="profile-stats">
      <li><span className="bold">{formatNumber(posts.length)}</span> {posts.length === 1 ? 'post' : 'posts'}</li>
      <li><button onClick={() => setList('followers')}><span className="bold">{formatCompact(user.followerCount)}</span> followers</button></li>
      <li><button onClick={() => setList('following')}><span className="bold">{formatCompact(user.followingCount)}</span> following</button></li>
    </ul>
  );

  const actions = me ? (
    <div className="profile-actions">
      <Link to="/accounts/edit" className="btn btn-secondary">Edit profile</Link>
      <button className="btn btn-secondary" onClick={() => toast('Archive is empty')}>View archive</button>
      {!isMobile && <Link to="/accounts/edit" className="icon-btn" aria-label="Settings"><SettingsIcon /></Link>}
    </div>
  ) : (
    <div className="profile-actions">
      {following ? (
        <button className="btn btn-secondary" onClick={() => setUnfollow(true)}>Following <ChevronDown size={14} /></button>
      ) : (
        <button className="btn btn-primary" onClick={() => toggleFollow(user.id)}>{user.followsMe ? 'Follow back' : 'Follow'}</button>
      )}
      <button className="btn btn-secondary" onClick={() => navigate(`/direct/t/${openConversation(user.id)}`)}>Message</button>
      {!isMobile && <button className="icon-btn" onClick={() => setMenu(true)} aria-label="Options"><DotsIcon /></button>}
    </div>
  );

  const bio = (
    <div className="profile-bio">
      <p className="bold">{user.fullName}</p>
      {user.category && <p className="muted">{user.category}</p>}
      {user.bio && <p className="pre-line"><RichText text={user.bio} /></p>}
      {user.website && (
        <a className="profile-link" href={`https://${user.website}`} target="_blank" rel="noreferrer noopener"><LinkIcon size={12} strokeWidth={2.5} /> {user.website}</a>
      )}
      {mutuals.length > 0 && (
        <button className="profile-mutuals" onClick={() => setList('followers')}>
          <span className="mutual-avatars">{mutuals.slice(0, 3).map((u) => <img key={u.id} src={u.avatar} alt="" className="avatar-img" />)}</span>
          <span className="muted">
            Followed by <strong>{mutuals[0].username}</strong>
            {mutuals[1] && <>, <strong>{mutuals[1].username}</strong></>}
            {mutuals.length > 2 && <> and {mutuals.length - 2} more</>}
          </span>
        </button>
      )}
      {user.followsMe && !me && <p className="muted small follows-you">Follows you</p>}
    </div>
  );

  return (
    <div className="profile">
      {isMobile && (
        <MobileTitleBar back={!me} title={<>{user.username}{user.verified && <VerifiedBadge size={14} />}</>}
          right={me ? <Link to="/accounts/edit" className="icon-btn" aria-label="Settings"><SettingsIcon /></Link>
            : <button className="icon-btn" onClick={() => setMenu(true)} aria-label="Options"><DotsIcon /></button>} />
      )}
      <header className="profile-head">
        <div className="profile-avatar">
          <Avatar user={user} size={isMobile ? 77 : 150} story />
        </div>
        <section className="profile-info">
          <div className="profile-name-row">
            <h1 className="profile-username">{user.username}{user.verified && <VerifiedBadge size={18} />}</h1>
            {!isMobile && actions}
          </div>
          {!isMobile && stats}
          {!isMobile && bio}
        </section>
      </header>
      {isMobile && (
        <div className="profile-mobile">
          {bio}
          {actions}
        </div>
      )}

      {(user.highlights.length > 0 || me) && (
        <div className="highlights">
          {user.highlights.map((h) => (
            <button key={h.id} className="highlight" onClick={() => openStories({ highlight: { ...h, userId: user.id }, startIndex: 0 })}>
              <span className="highlight-ring"><img src={h.cover.thumb ?? h.cover.src} alt="" /></span>
              <span className="highlight-title">{h.title}</span>
            </button>
          ))}
          {me && (
            <button className="highlight" onClick={() => toast('Add a story first, then save it as a highlight')}>
              <span className="highlight-ring new"><PlusIcon size={isMobile ? 28 : 44} strokeWidth={1} /></span>
              <span className="highlight-title">New</span>
            </button>
          )}
        </div>
      )}

      {isMobile && <div className="mobile-stats">{stats}</div>}

      <nav className="profile-tabs" aria-label="Profile sections">
        <Link to={base} className={tab === 'posts' ? 'on' : ''}><GridIcon size={12} /> <span>Posts</span></Link>
        <Link to={`${base}/reels`} className={tab === 'reels' ? 'on' : ''}><ReelsIcon size={12} /> <span>Reels</span></Link>
        {me && <Link to={`${base}/saved`} className={tab === 'saved' ? 'on' : ''}><BookmarkIcon size={12} /> <span>Saved</span></Link>}
        <Link to={`${base}/tagged`} className={tab === 'tagged' ? 'on' : ''}><TagIcon size={12} /> <span>Tagged</span></Link>
      </nav>

      {tab === 'saved' && <p className="muted small saved-note">Only you can see what you&rsquo;ve saved</p>}
      {tabPosts.length > 0 ? <PostGrid posts={tabPosts} /> : (
        <div className="profile-empty">
          <span className="empty-icon">{tab === 'saved' ? <BookmarkIcon size={34} /> : tab === 'tagged' ? <TagIcon size={34} /> : tab === 'reels' ? <ReelsIcon size={34} /> : <MediaDropIcon size={44} />}</span>
          <h2>{tab === 'saved' ? 'Save' : tab === 'tagged' ? (me ? 'Photos of you' : 'No photos') : tab === 'reels' ? 'No reels yet' : me ? 'Share photos' : 'No posts yet'}</h2>
          <p>{tab === 'saved' ? 'Save photos that you want to see again. No one is notified, and only you can see what you’ve saved.'
            : tab === 'tagged' ? (me ? 'When people tag you in photos, they’ll appear here.' : '')
              : me ? 'When you share photos, they will appear on your profile.' : ''}</p>
        </div>
      )}

      {list && <FollowListModal user={user} kind={list} onClose={() => setList(null)} />}
      {unfollow && <UnfollowConfirm user={user} onClose={() => setUnfollow(false)} onConfirm={() => toggleFollow(user.id)} />}
      {menu && (
        <ActionSheet onClose={() => setMenu(false)} actions={me ? [
          { label: 'Settings', onClick: () => navigate('/accounts/edit') },
          { label: 'Copy profile URL', onClick: () => copyProfile(user.username, toast) },
        ] : [
          { label: 'Block', tone: 'danger', onClick: () => toast('Blocking isn’t available in the demo') },
          { label: 'Report', tone: 'danger', onClick: () => toast('Thanks for letting us know') },
          { label: 'Share to…', onClick: () => navigate(`/direct/t/${openConversation(user.id)}`) },
          { label: 'Copy profile URL', onClick: () => copyProfile(user.username, toast) },
          { label: 'About this account', onClick: () => toast(`${user.fullName} · on Glimpse since 2021`) },
        ]} />
      )}
    </div>
  );
}

async function copyProfile(username: string, toast: (t: string) => void) {
  try {
    await navigator.clipboard.writeText(`${location.origin}${location.pathname}#/${username}`);
    toast('Link copied to clipboard');
  } catch {
    toast('Couldn’t copy link');
  }
}

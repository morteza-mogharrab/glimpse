import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useActions, useDb, useMe, useUI } from '../store/AppStore';
import { postsByUser } from '../store/selectors';
import { useIsMobile } from '../hooks';
import { downscaleImage } from '../utils/format';
import { DEFAULT_AVATAR } from '../data/seed';
import { PostView } from '../components/post/PostView';
import { PostCard } from '../components/feed/PostCard';
import { GridTile } from '../components/profile/PostGrid';
import { NotificationList } from '../components/panels/NotificationsPanel';
import { MobileTitleBar } from '../components/layout/MobileNav';
import { Avatar } from '../components/common/Avatar';
import { ActionSheet } from '../components/common/Modal';

/** Standalone post page (/p/:id). Card layout on phones, two-pane on desktop. */
export function PostPage() {
  const { postId } = useParams();
  const db = useDb();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const post = postId ? db.posts[postId] : undefined;
  if (!post) {
    return (
      <div className="not-found">
        <h2>Sorry, this page isn&rsquo;t available.</h2>
        <p>The post may have been deleted. <Link to="/" className="blue">Go back to Glimpse.</Link></p>
      </div>
    );
  }
  const author = db.users[post.authorId];
  const more = postsByUser(db, author.id).filter((p) => p.id !== post.id).slice(0, 6);
  return (
    <div className="post-page">
      {isMobile ? (
        <>
          <MobileTitleBar title="Post" />
          <PostCard post={post} />
        </>
      ) : (
        <div className="post-page-card"><PostView post={post} onDeleted={() => navigate(`/${db.meId}`)} /></div>
      )}
      {more.length > 0 && (
        <section className="more-from">
          <h3 className="muted">More posts from <Link to={`/${author.username}`} className="username">{author.username}</Link></h3>
          <div className="grid profile-grid">{more.map((p) => <GridTile key={p.id} post={p} list={more.map((x) => x.id)} />)}</div>
        </section>
      )}
    </div>
  );
}

export function NotificationsPage() {
  return (
    <div className="narrow-page">
      <MobileTitleBar title="Notifications" />
      <NotificationList />
    </div>
  );
}

export function EditProfilePage() {
  const me = useMe();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { updateProfile, resetDemo } = useActions();
  const { toast, theme, toggleTheme } = useUI();
  const [form, setForm] = useState({ fullName: me.fullName, website: me.website ?? '', bio: me.bio, category: me.category ?? '' });
  const [photoMenu, setPhotoMenu] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dirty = form.fullName !== me.fullName || form.website !== (me.website ?? '') || form.bio !== me.bio || form.category !== (me.category ?? '');

  const onPhoto = async (f?: File) => {
    if (!f) return;
    try {
      updateProfile({ avatar: await downscaleImage(f, 320) });
    } catch {
      toast('That file couldn’t be used.');
    }
  };

  return (
    <div className="settings-page">
      {isMobile && <MobileTitleBar title="Edit profile" />}
      <form className="settings-form" onSubmit={(e) => { e.preventDefault(); updateProfile(form); navigate(`/${me.username}`); }}>
        <h1>Edit profile</h1>
        <div className="settings-photo">
          <Avatar user={me} size={56} />
          <div>
            <p className="bold">{me.username}</p>
            <p className="muted">{me.fullName}</p>
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setPhotoMenu(true)}>Change photo</button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onPhoto(e.target.files?.[0])} />
        </div>
        <label className="field">
          <span>Name</span>
          <input value={form.fullName} maxLength={30} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </label>
        <label className="field">
          <span>Website</span>
          <input value={form.website} placeholder="Website" onChange={(e) => setForm({ ...form, website: e.target.value.replace(/^https?:\/\//, '') })} />
        </label>
        <label className="field">
          <span>Bio</span>
          <textarea value={form.bio} maxLength={150} rows={3} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          <small className="muted right">{form.bio.length} / 150</small>
        </label>
        <label className="field">
          <span>Category</span>
          <input value={form.category} placeholder="e.g. Photographer" onChange={(e) => setForm({ ...form, category: e.target.value })} />
        </label>
        <div className="field-row">
          <span>Dark mode</span>
          <input type="checkbox" className="switch" checked={theme === 'dark'} onChange={toggleTheme} aria-label="Dark mode" />
        </div>
        <div className="settings-submit">
          <button type="button" className="text-btn muted" onClick={() => resetDemo()}>Reset sample data</button>
          <button className="btn btn-primary wide" disabled={!dirty}>Submit</button>
        </div>
      </form>
      {photoMenu && (
        <ActionSheet onClose={() => setPhotoMenu(false)} actions={[
          { label: 'Upload photo', tone: 'bold', onClick: () => fileRef.current?.click() },
          { label: 'Remove current photo', tone: 'danger', onClick: () => updateProfile({ avatar: DEFAULT_AVATAR }) },
        ]} />
      )}
    </div>
  );
}

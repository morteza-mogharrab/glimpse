import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Post } from '../types';
import { useActions, useDb, useUI } from '../store/AppStore';
import { allReels } from '../store/selectors';
import { useDoubleTap, useOpenPost } from '../hooks';
import { formatCompact } from '../utils/format';
import {
  AudioIcon, BookmarkIcon, CommentIcon, DotsIcon, HeartIcon, PlayIcon, SendIcon, VolumeIcon,
} from '../components/icons/Icons';
import { Avatar } from '../components/common/Avatar';
import { FollowButton, RichText, UsernameLink } from '../components/common/UserBits';
import { PostOptions } from '../components/post/PostParts';

/**
 * Reels are presented as photo "clips" with a slow pan, since the sample
 * library has no video. Swap <img> for <video> when real clips exist.
 */
function Reel({ post, active, muted, setMuted }: { post: Post; active: boolean; muted: boolean; setMuted(m: boolean): void }) {
  const db = useDb();
  const { toggleLike, like, toggleSave } = useActions();
  const { setShareTarget } = useUI();
  const openPost = useOpenPost();
  const [paused, setPaused] = useState(false);
  const [flash, setFlash] = useState(0);
  const [burst, setBurst] = useState(0);
  const [more, setMore] = useState(false);
  const [menu, setMenu] = useState(false);
  const author = db.users[post.authorId];

  const onTap = useDoubleTap(
    () => { like(post.id); setBurst((b) => b + 1); },
    () => { setPaused((p) => !p); setFlash((f) => f + 1); },
  );
  const running = active && !paused;

  return (
    <section className="reel" aria-label={`Reel by ${author.username}`}>
      <div className="reel-frame">
        <div className="reel-media" onClick={onTap}>
          <img src={post.media[0].src} alt={post.media[0].alt ?? ''} className={`reel-img ${running ? 'running' : ''}`} draggable={false} style={{ filter: post.filter }} />
          <div className="reel-progress"><span className={running ? 'running' : ''} key={post.id} /></div>
          {flash > 0 && paused && <span className="reel-flash" key={flash}><PlayIcon size={40} /></span>}
          {burst > 0 && <span key={burst} className="heart-burst"><HeartIcon filled size={96} strokeWidth={0} /></span>}
        </div>
        <button className="reel-mute" onClick={() => setMuted(!muted)} aria-label={muted ? 'Unmute' : 'Mute'}>
          <VolumeIcon size={14} muted={muted} />
        </button>
        <div className="reel-info">
          <div className="reel-user">
            <Avatar user={author} size={32} link />
            <UsernameLink user={author} />
            <span className="dot-sep">•</span>
            <FollowButton user={author} small />
          </div>
          <p className={`reel-caption ${more ? 'open' : ''}`} onClick={() => setMore((m) => !m)}><RichText text={post.caption} /></p>
          <div className="reel-audio"><AudioIcon size={12} /><span>{post.audio ?? `${author.username} · Original audio`}</span></div>
        </div>
      </div>
      <div className="reel-actions">
        <button className={`reel-act ${post.likedByMe ? 'liked' : ''}`} onClick={() => toggleLike(post.id)} aria-label="Like">
          <HeartIcon filled={post.likedByMe} /><span>{formatCompact(post.likeCount)}</span>
        </button>
        <button className="reel-act" onClick={() => openPost(post.id)} aria-label="Comments">
          <CommentIcon /><span>{formatCompact(post.commentCount)}</span>
        </button>
        <button className="reel-act" onClick={() => setShareTarget(post.id)} aria-label="Share"><SendIcon /></button>
        <button className="reel-act" onClick={() => toggleSave(post.id)} aria-label="Save"><BookmarkIcon filled={post.savedByMe} /></button>
        <button className="reel-act" onClick={() => setMenu(true)} aria-label="More"><DotsIcon /></button>
        <Link to={`/${author.username}`} className="reel-audio-thumb" aria-label="Audio"><img src={author.avatar} alt="" /></Link>
      </div>
      {menu && <PostOptions post={post} onClose={() => setMenu(false)} />}
    </section>
  );
}

export function ReelsPage() {
  const db = useDb();
  const [reels] = useState(() => allReels(db).map((p) => p.id));
  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(true);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
    }, { root, threshold: 0.6 });
    root.querySelectorAll('[data-index]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [reels.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'INPUT') return;
      const el = scroller.current;
      if (!el) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); el.scrollBy({ top: el.clientHeight, behavior: 'smooth' }); }
      if (e.key === 'ArrowUp') { e.preventDefault(); el.scrollBy({ top: -el.clientHeight, behavior: 'smooth' }); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="reels" ref={scroller}>
      {reels.map((id, k) => db.posts[id] && (
        <div key={id} data-index={k} className="reel-snap">
          <Reel post={db.posts[id]} active={k === active} muted={muted} setMuted={setMuted} />
        </div>
      ))}
    </div>
  );
}

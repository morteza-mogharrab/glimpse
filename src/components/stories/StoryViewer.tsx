import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import type { ID, MediaItem } from '../../types';
import { useActions, useDb, useUI } from '../../store/AppStore';
import { timeShort } from '../../utils/format';
import {
  ChevronLeft, ChevronRight, CloseIcon, DotsIcon, HeartIcon, PauseIcon, PlayIcon, SendIcon, VolumeIcon, Wordmark,
} from '../icons/Icons';
import { VerifiedBadge } from '../icons/Icons';

const DURATION = 5000;

interface Reel {
  key: string;
  userId: ID;
  storyId?: ID;
  title?: string;
  items: { id: ID; media: MediaItem; createdAt?: string; likedByMe?: boolean }[];
  startAt: number;
}

export function StoryViewer() {
  const db = useDb();
  const { storyViewer, closeStories, toast } = useUI();
  const { markStorySeen, likeStoryItem, openConversation, sendMessage } = useActions();

  const reels: Reel[] = useMemo(() => {
    if (!storyViewer) return [];
    if (storyViewer.highlight) {
      const h = storyViewer.highlight;
      return [{ key: h.id, userId: h.userId, title: h.title, startAt: 0, items: h.items.map((m, i) => ({ id: `${h.id}-${i}`, media: m })) }];
    }
    return (storyViewer.storyIds ?? [])
      .map((id) => db.stories.find((s) => s.id === id))
      .filter((s): s is NonNullable<typeof s> => !!s && s.items.length > 0)
      .map((s) => ({ key: s.id, userId: s.userId, storyId: s.id, items: s.items, startAt: s.seenUpTo < s.items.length ? s.seenUpTo : 0 }));
    // Snapshot when opened so "seen" updates don't reorder playback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyViewer]);

  const [r, setR] = useState(storyViewer?.startIndex ?? 0);
  const [i, setI] = useState(() => reels[storyViewer?.startIndex ?? 0]?.startAt ?? 0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const [muted, setMuted] = useState(true);
  const [reply, setReply] = useState('');
  const [typing, setTyping] = useState(false);
  const elapsed = useRef(0);

  const reel = reels[r];
  const item = reel?.items[i];
  const liveItem = reel?.storyId
    ? db.stories.find((s) => s.id === reel.storyId)?.items.find((x) => x.id === item?.id)
    : item;
  const user = reel ? db.users[reel.userId] : undefined;
  const isMine = reel?.userId === db.meId;
  const isPaused = paused || held || typing;

  const goReel = useCallback((next: number) => {
    if (next < 0 || next >= reels.length) { closeStories(); return; }
    setR(next);
    setI(reels[next].startAt);
    elapsed.current = 0;
    setProgress(0);
  }, [reels, closeStories]);

  const nextItem = useCallback(() => {
    if (!reel) return;
    elapsed.current = 0;
    setProgress(0);
    if (i < reel.items.length - 1) setI(i + 1);
    else goReel(r + 1);
  }, [reel, i, r, goReel]);

  const prevItem = useCallback(() => {
    elapsed.current = 0;
    setProgress(0);
    if (i > 0) setI(i - 1);
    else if (r > 0) { setR(r - 1); setI(0); }
  }, [i, r]);

  // Mark seen
  useEffect(() => {
    if (reel?.storyId) markStorySeen(reel.storyId, i + 1);
  }, [reel, i, markStorySeen]);

  // Timer
  useEffect(() => {
    if (!item || isPaused) return;
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      elapsed.current += t - last;
      last = t;
      const p = Math.min(1, elapsed.current / DURATION);
      setProgress(p);
      if (p >= 1) nextItem();
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [item, isPaused, nextItem]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') { if (e.key === 'Escape') closeStories(); return; }
      if (e.key === 'Escape') closeStories();
      if (e.key === 'ArrowRight') nextItem();
      if (e.key === 'ArrowLeft') prevItem();
      if (e.key === ' ') { e.preventDefault(); setPaused((p) => !p); }
    };
    window.addEventListener('keydown', onKey);
    document.body.classList.add('modal-open');
    return () => { window.removeEventListener('keydown', onKey); document.body.classList.remove('modal-open'); };
  }, [nextItem, prevItem, closeStories]);

  if (!reel || !item || !user) return null;

  const sendReply = (text: string) => {
    if (!text.trim()) return;
    const conv = openConversation(user.id);
    sendMessage(conv, `Replied to your story: ${text}`);
    setReply('');
    toast('Message sent');
  };
  const neighbours = [-2, -1, 1, 2]
    .map((d) => ({ d, idx: r + d }))
    .filter(({ idx }) => idx >= 0 && idx < reels.length);

  return createPortal(
    <div className="story-viewer" role="dialog" aria-modal="true" aria-label={`${user.username}'s story`}>
      <Link to="/" className="story-logo" onClick={closeStories}><Wordmark /></Link>
      <button className="story-close" onClick={closeStories} aria-label="Close"><CloseIcon size={28} /></button>

      <div className="story-stage">
        {neighbours.map(({ d, idx }) => {
          const nr = reels[idx];
          const nu = db.users[nr.userId];
          return (
            <button key={nr.key} className={`story-preview p${d < 0 ? 'l' : 'r'}${Math.abs(d)}`} onClick={() => goReel(idx)}
              aria-label={`Go to ${nu.username}'s story`}>
              <img src={nr.items[nr.startAt].media.src} alt="" />
              <span className="story-preview-info">
                <img src={nu.avatar} alt="" className="avatar-img" />
                <strong>{nu.username}</strong>
                <span>{timeShort(nr.items[0].createdAt ?? new Date().toISOString())}</span>
              </span>
            </button>
          );
        })}

        <div className="story-card">
          <div className="story-bars">
            {reel.items.map((_, k) => (
              <span key={k}><span style={{ width: `${k < i ? 100 : k === i ? progress * 100 : 0}%` }} /></span>
            ))}
          </div>
          <header className="story-head">
            <Link to={`/${user.username}`} onClick={closeStories} className="story-user">
              <img src={user.avatar} alt="" className="avatar-img" width={32} height={32} />
              <strong>{user.username}</strong>{user.verified && <VerifiedBadge size={12} />}
              <span className="story-time">{reel.title ?? (item.createdAt ? timeShort(item.createdAt) : '')}</span>
            </Link>
            <div className="story-controls">
              <button onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Play' : 'Pause'}>
                {paused ? <PlayIcon size={18} /> : <PauseIcon size={18} />}
              </button>
              <button onClick={() => setMuted((m) => !m)} aria-label={muted ? 'Unmute' : 'Mute'}><VolumeIcon size={18} muted={muted} /></button>
              <button onClick={() => toast('Story options are not available in the demo')} aria-label="More"><DotsIcon size={18} /></button>
            </div>
          </header>
          <img key={item.id} src={item.media.src} alt={`Story by ${user.username}`} className="story-img" draggable={false} />
          <div className="story-tap"
            onPointerDown={() => setHeld(true)}
            onPointerUp={() => setHeld(false)}
            onPointerLeave={() => setHeld(false)}>
            <button className="story-tap-zone left" onClick={prevItem} aria-label="Previous" />
            <button className="story-tap-zone right" onClick={nextItem} aria-label="Next" />
          </div>
          <footer className="story-foot">
            {isMine ? (
              <span className="story-seen">Seen by {12 + i * 7}</span>
            ) : (
              <>
                <form className="story-reply" onSubmit={(e) => { e.preventDefault(); sendReply(reply); }}>
                  <input value={reply} placeholder={`Reply to ${user.username}…`} onChange={(e) => setReply(e.target.value)}
                    onFocus={() => setTyping(true)} onBlur={() => setTyping(false)} aria-label="Reply" />
                  {reply && <button type="submit" className="text-btn bold">Send</button>}
                </form>
                {reel.storyId && liveItem && (
                  <button className={`story-like ${liveItem.likedByMe ? 'liked' : ''}`} aria-label="Like story"
                    onClick={() => likeStoryItem(reel.storyId!, item.id)}>
                    <HeartIcon size={24} filled={liveItem.likedByMe} />
                  </button>
                )}
                <button aria-label="Send story" onClick={() => sendReply('🔥')}><SendIcon size={24} /></button>
              </>
            )}
          </footer>
          {(r > 0 || i > 0) && (
            <button className="story-nav prev" onClick={prevItem} aria-label="Previous story"><ChevronLeft size={16} strokeWidth={3} /></button>
          )}
          <button className="story-nav next" onClick={nextItem} aria-label="Next story"><ChevronRight size={16} strokeWidth={3} /></button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

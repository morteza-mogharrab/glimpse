import { useRef, useState, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Post } from '../../types';
import { useActions, useDb, useIsFollowing, useUI } from '../../store/AppStore';
import { formatNumber } from '../../utils/format';
import { useClickOutside } from '../../hooks';
import { BookmarkIcon, CommentIcon, EmojiIcon, HeartIcon, SendIcon } from '../icons/Icons';
import { ActionSheet, Confirm, type SheetAction } from '../common/Modal';
import { UnfollowConfirm } from '../common/UserBits';

export function PostActions({ post, onComment }: { post: Post; onComment?(): void }) {
  const { toggleLike, toggleSave } = useActions();
  const { setShareTarget } = useUI();
  return (
    <div className="post-actions">
      <button className={`icon-btn like-btn ${post.likedByMe ? 'liked' : ''}`} onClick={() => toggleLike(post.id)}
        aria-label={post.likedByMe ? 'Unlike' : 'Like'} aria-pressed={post.likedByMe}>
        <HeartIcon filled={post.likedByMe} key={String(post.likedByMe)} />
      </button>
      {!post.commentsOff && (
        <button className="icon-btn" onClick={onComment} aria-label="Comment"><CommentIcon /></button>
      )}
      <button className="icon-btn" onClick={() => setShareTarget(post.id)} aria-label="Share"><SendIcon /></button>
      <button className="icon-btn push-right" onClick={() => toggleSave(post.id)}
        aria-label={post.savedByMe ? 'Remove from saved' : 'Save'} aria-pressed={post.savedByMe}>
        <BookmarkIcon filled={post.savedByMe} />
      </button>
    </div>
  );
}

export function LikesLine({ post }: { post: Post }) {
  const db = useDb();
  const preview = post.likedByPreviewId ? db.users[post.likedByPreviewId] : undefined;
  if (post.hideLikes && post.authorId !== db.meId) {
    return preview ? (
      <p className="likes">Liked by <Link to={`/${preview.username}`} className="username">{preview.username}</Link> and others</p>
    ) : null;
  }
  if (post.likeCount === 0) {
    return <p className="likes light">Be the first to <span className="bold">like this</span></p>;
  }
  return <p className="likes">{formatNumber(post.likeCount)} {post.likeCount === 1 ? 'like' : 'likes'}</p>;
}

const EMOJIS = ['😂', '😮', '😍', '😢', '👏', '🔥', '🎉', '💯', '❤️', '🤣', '🥰', '😘', '😭', '😊', '🙌', '✨', '📸', '🌿', '🌊', '🐾'];

export function EmojiPicker({ onPick, onClose }: { onPick(e: string): void; onClose(): void }) {
  const ref = useClickOutside<HTMLDivElement>(onClose);
  return (
    <div className="emoji-pop" ref={ref} role="dialog" aria-label="Emoji">
      <p className="emoji-pop-title">Most popular</p>
      <div className="emoji-grid">
        {EMOJIS.map((e) => <button key={e} onClick={() => onPick(e)}>{e}</button>)}
      </div>
    </div>
  );
}

/** "Add a comment…" box with emoji picker and Post button. */
export function CommentInput({ post, variant = 'feed', inputRef, prefill, onPosted }: {
  post: Post; variant?: 'feed' | 'modal';
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  prefill?: string; onPosted?(): void;
}) {
  const { addComment } = useActions();
  const [text, setText] = useState(prefill ?? '');
  const [emoji, setEmoji] = useState(false);
  const localRef = useRef<HTMLTextAreaElement>(null);
  const ref = inputRef ?? localRef;
  const [lastPrefill, setLastPrefill] = useState(prefill);
  if (prefill !== lastPrefill) { setLastPrefill(prefill); setText(prefill ?? ''); }

  if (post.commentsOff) {
    return <div className={`comment-input ci-${variant} disabled`}>Commenting has been turned off.</div>;
  }
  const submit = () => {
    if (!text.trim()) return;
    addComment(post.id, text);
    setText('');
    onPosted?.();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  };
  const grow = (el: HTMLTextAreaElement) => { el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 80)}px`; };

  return (
    <div className={`comment-input ci-${variant}`}>
      {variant === 'modal' && (
        <button className="icon-btn" onClick={() => setEmoji((x) => !x)} aria-label="Emoji"><EmojiIcon size={24} /></button>
      )}
      <textarea ref={ref} rows={1} placeholder="Add a comment…" value={text} maxLength={2200} aria-label="Add a comment"
        onChange={(e) => { setText(e.target.value); grow(e.target); }} onKeyDown={onKey} />
      {text.trim() && <button className="text-btn blue bold" onClick={submit}>Post</button>}
      {variant === 'feed' && (
        <button className="icon-btn muted small" onClick={() => setEmoji((x) => !x)} aria-label="Emoji"><EmojiIcon size={14} /></button>
      )}
      {emoji && (
        <EmojiPicker onClose={() => setEmoji(false)} onPick={(e) => { setText((t) => t + e); ref.current?.focus(); }} />
      )}
    </div>
  );
}

/** "…" menu for a post. */
export function PostOptions({ post, onClose, onDeleted }: { post: Post; onClose(): void; onDeleted?(): void }) {
  const db = useDb();
  const navigate = useNavigate();
  const { toast, closePost, setShareTarget } = useUI();
  const { deletePost, updatePost, toggleFollow } = useActions();
  const following = useIsFollowing(post.authorId);
  const [confirm, setConfirm] = useState<'delete' | 'unfollow' | null>(null);
  const mine = post.authorId === db.meId;
  const author = db.users[post.authorId];

  const copy = async () => {
    const url = `${location.origin}${location.pathname}#/p/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copied to clipboard');
    } catch {
      toast('Couldn’t copy link');
    }
  };
  const goTo = () => { closePost(); navigate(`/p/${post.id}`); };

  const actions: SheetAction[] = mine
    ? [
      { label: 'Delete', tone: 'danger', keepOpen: true, onClick: () => setConfirm('delete') },
      { label: post.hideLikes ? 'Unhide like count to others' : 'Hide like count to others', onClick: () => updatePost(post.id, { hideLikes: !post.hideLikes }) },
      { label: post.commentsOff ? 'Turn on commenting' : 'Turn off commenting', onClick: () => updatePost(post.id, { commentsOff: !post.commentsOff }) },
      { label: 'Go to post', onClick: goTo },
      { label: 'Share to…', onClick: () => setShareTarget(post.id) },
      { label: 'Copy link', onClick: copy },
    ]
    : [
      { label: 'Report', tone: 'danger', onClick: () => toast('Thanks for letting us know') },
      ...(following ? [{ label: 'Unfollow', tone: 'danger' as const, keepOpen: true, onClick: () => setConfirm('unfollow') }] : []),
      { label: 'Go to post', onClick: goTo },
      { label: 'Share to…', onClick: () => setShareTarget(post.id) },
      { label: 'Copy link', onClick: copy },
      { label: 'About this account', onClick: () => { closePost(); navigate(`/${author.username}`); } },
    ];

  if (confirm === 'delete') {
    return (
      <Confirm title="Delete post?" body="Are you sure you want to delete this post?" confirmLabel="Delete"
        onClose={onClose} onConfirm={() => { deletePost(post.id); onDeleted?.(); }} />
    );
  }
  if (confirm === 'unfollow') {
    return <UnfollowConfirm user={author} onClose={onClose} onConfirm={() => toggleFollow(author.id)} />;
  }
  return <ActionSheet actions={actions} onClose={onClose} />;
}

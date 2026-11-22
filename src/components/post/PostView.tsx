import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Comment, Post } from '../../types';
import { useActions, useDb, useUI } from '../../store/AppStore';
import { timeLong, timeShort, formatNumber } from '../../utils/format';
import { DotsIcon, HeartIcon } from '../icons/Icons';
import { Avatar } from '../common/Avatar';
import { ActionSheet } from '../common/Modal';
import { FollowButton, RichText, UsernameLink } from '../common/UserBits';
import { PostMedia } from './PostMedia';
import { CommentInput, LikesLine, PostActions, PostOptions } from './PostParts';

function CommentRow({ post, comment, onReply }: { post: Post; comment: Comment; onReply(u: string): void }) {
  const db = useDb();
  const { likeComment, deleteComment } = useActions();
  const [menu, setMenu] = useState(false);
  const author = db.users[comment.authorId];
  if (!author) return null;
  const canDelete = comment.authorId === db.meId || post.authorId === db.meId;
  return (
    <li className="comment">
      <Avatar user={author} size={32} story link />
      <div className="comment-main">
        <p><UsernameLink user={author} /> <RichText text={comment.text} /></p>
        <div className="comment-meta">
          <time dateTime={comment.createdAt}>{timeShort(comment.createdAt)}</time>
          {comment.likeCount > 0 && <span className="bold">{formatNumber(comment.likeCount)} {comment.likeCount === 1 ? 'like' : 'likes'}</span>}
          <button className="text-btn muted bold" onClick={() => onReply(author.username)}>Reply</button>
          {canDelete && (
            <button className="icon-btn comment-dots" onClick={() => setMenu(true)} aria-label="Comment options"><DotsIcon size={16} /></button>
          )}
        </div>
      </div>
      <button className={`icon-btn comment-like ${comment.likedByMe ? 'liked' : ''}`} onClick={() => likeComment(post.id, comment.id)}
        aria-label={comment.likedByMe ? 'Unlike comment' : 'Like comment'}>
        <HeartIcon size={12} filled={comment.likedByMe} />
      </button>
      {menu && (
        <ActionSheet onClose={() => setMenu(false)}
          actions={[{ label: 'Delete', tone: 'danger', onClick: () => deleteComment(post.id, comment.id) }]} />
      )}
    </li>
  );
}

/** Two-pane post viewer: used by the modal and the /p/:id page. */
export function PostView({ post, onDeleted }: { post: Post; onDeleted?(): void }) {
  const db = useDb();
  const { closePost } = useUI();
  const author = db.users[post.authorId];
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [menu, setMenu] = useState(false);
  const [prefill, setPrefill] = useState<string>();

  const reply = (u: string) => {
    setPrefill(`@${u} `);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
    });
  };
  const scrollToEnd = () => requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }));

  return (
    <div className="post-view">
      <div className="post-view-media" style={{ aspectRatio: post.aspect === '4:5' ? '4 / 5' : post.aspect === '16:9' ? '16 / 9' : '1 / 1' }}>
        <PostMedia post={post} fit="fill" />
      </div>
      <div className="post-view-side">
        <header className="post-head bordered">
          <Avatar user={author} size={32} story link />
          <div className="post-head-text">
            <div className="post-head-line">
              <UsernameLink user={author} />
              {author.id !== db.meId && !db.followingIds.includes(author.id) && (
                <><span className="dot-sep">•</span><FollowButton user={author} variant="link" /></>
              )}
            </div>
            {post.location && <div className="post-location">{post.location}</div>}
          </div>
          <button className="icon-btn" onClick={() => setMenu(true)} aria-label="More options"><DotsIcon /></button>
        </header>
        <ul className="comments" ref={listRef}>
          {post.caption && (
            <li className="comment caption-row">
              <Avatar user={author} size={32} story link />
              <div className="comment-main">
                <p><UsernameLink user={author} /> <span className="pre-line"><RichText text={post.caption} /></span></p>
                <div className="comment-meta"><time dateTime={post.createdAt}>{timeShort(post.createdAt)}</time></div>
              </div>
            </li>
          )}
          {post.comments.map((c) => <CommentRow key={c.id} post={post} comment={c} onReply={reply} />)}
          {post.commentCount > post.comments.length && (
            <li className="more-comments muted">
              + {formatNumber(post.commentCount - post.comments.length)} earlier comments are not loaded in this demo
            </li>
          )}
          {post.comments.length === 0 && !post.caption && (
            <li className="no-comments">
              <h3>No comments yet.</h3>
              <p className="muted">Start the conversation.</p>
            </li>
          )}
        </ul>
        <div className="post-view-footer">
          <PostActions post={post} onComment={() => inputRef.current?.focus()} />
          <div className="post-body">
            <LikesLine post={post} />
            <Link to={`/p/${post.id}`} className="post-date muted" onClick={closePost}>{timeLong(post.createdAt)}</Link>
          </div>
          <CommentInput post={post} variant="modal" inputRef={inputRef} prefill={prefill} onPosted={() => { setPrefill(undefined); scrollToEnd(); }} />
        </div>
      </div>
      {menu && <PostOptions post={post} onClose={() => setMenu(false)} onDeleted={onDeleted} />}
    </div>
  );
}

import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Post } from '../../types';
import { useDb } from '../../store/AppStore';
import { useOpenPost } from '../../hooks';
import { formatNumber, timeShort } from '../../utils/format';
import { DotsIcon, AudioIcon } from '../icons/Icons';
import { Avatar } from '../common/Avatar';
import { FollowButton, RichText, UsernameLink } from '../common/UserBits';
import { PostMedia } from '../post/PostMedia';
import { CommentInput, LikesLine, PostActions, PostOptions } from '../post/PostParts';

const CAPTION_LIMIT = 125;

export const PostCard = memo(function PostCard({ post }: { post: Post }) {
  const db = useDb();
  const openPost = useOpenPost();
  const [expanded, setExpanded] = useState(false);
  const [menu, setMenu] = useState(false);
  const author = db.users[post.authorId];
  if (!author) return null;

  const long = post.caption.length > CAPTION_LIMIT || post.caption.split('\n').length > 2;
  const caption = expanded || !long ? post.caption : post.caption.slice(0, Math.min(CAPTION_LIMIT, post.caption.indexOf('\n') > 0 ? post.caption.indexOf('\n') : CAPTION_LIMIT)).trimEnd();
  // Show comments the signed-in user left recently, like the real feed does.
  const myRecent = post.comments.filter((c) => c.authorId === db.meId).slice(-2);
  const following = db.followingIds.includes(author.id);

  return (
    <article className="post-card">
      <header className="post-head">
        <Avatar user={author} size={32} story link />
        <div className="post-head-text">
          <div className="post-head-line">
            <UsernameLink user={author} />
            <span className="dot-sep">•</span>
            <time className="muted" dateTime={post.createdAt} title={new Date(post.createdAt).toLocaleString()}>{timeShort(post.createdAt)}</time>
            {!following && author.id !== db.meId && (
              <><span className="dot-sep">•</span><FollowButton user={author} variant="link" /></>
            )}
          </div>
          {post.location && <div className="post-location">{post.location}</div>}
          {!post.location && post.audio && <div className="post-location"><AudioIcon size={10} /> {post.audio}</div>}
        </div>
        <button className="icon-btn" onClick={() => setMenu(true)} aria-label="More options"><DotsIcon /></button>
      </header>

      <PostMedia post={post} />

      <PostActions post={post} onComment={() => openPost(post.id)} />
      <div className="post-body">
        <LikesLine post={post} />
        {post.caption && (
          <p className="caption">
            <UsernameLink user={author} />{' '}
            <span className="caption-text"><RichText text={caption} /></span>
            {long && !expanded && (
              <>… <button className="text-btn muted" onClick={() => setExpanded(true)}>more</button></>
            )}
          </p>
        )}
        {post.commentCount > 0 && !post.commentsOff && (
          <button className="text-btn muted view-comments" onClick={() => openPost(post.id)}>
            {post.commentCount === 1 ? 'View 1 comment' : `View all ${formatNumber(post.commentCount)} comments`}
          </button>
        )}
        {myRecent.map((c) => (
          <p key={c.id} className="caption">
            <Link to={`/${db.meId}`} className="username">{db.meId}</Link> <RichText text={c.text} />
          </p>
        ))}
        <CommentInput post={post} />
      </div>
      {menu && <PostOptions post={post} onClose={() => setMenu(false)} />}
    </article>
  );
});

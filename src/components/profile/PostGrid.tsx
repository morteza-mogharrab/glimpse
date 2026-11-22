import type { Post } from '../../types';
import { useOpenPost } from '../../hooks';
import { formatCompact } from '../../utils/format';
import { CarouselBadge, CommentIcon, HeartIcon, ReelBadge } from '../icons/Icons';

/** Grid tile with hover counts and carousel / reel badges. */
export function GridTile({ post, list, tall = false, onOpen }: { post: Post; list: string[]; tall?: boolean; onOpen?(): void }) {
  const openPost = useOpenPost();
  const m = post.media[0];
  return (
    <button className={`grid-tile ${tall ? 'tall' : ''}`} onClick={() => (onOpen ? onOpen() : openPost(post.id, list))}
      aria-label={`Open post: ${post.caption.slice(0, 60)}`}>
      <img src={tall ? m.src : m.thumb ?? m.src} alt={m.alt ?? ''} loading="lazy" style={{ filter: post.filter }} />
      {post.isReel ? <span className="tile-badge"><ReelBadge /></span> : post.media.length > 1 && <span className="tile-badge"><CarouselBadge /></span>}
      <span className="tile-hover">
        {!post.hideLikes && <span><HeartIcon filled size={20} /> {formatCompact(post.likeCount)}</span>}
        {!post.commentsOff && <span><CommentIcon size={20} fill="currentColor" /> {formatCompact(post.commentCount)}</span>}
      </span>
    </button>
  );
}

export function PostGrid({ posts, variant = 'profile' }: { posts: Post[]; variant?: 'profile' | 'explore' }) {
  const list = posts.map((p) => p.id);
  if (variant === 'explore') {
    // Every 5-tile block puts a tall tile on alternating sides, like Explore.
    return (
      <div className="grid explore-grid">
        {posts.map((p, k) => {
          const block = Math.floor(k / 5);
          const pos = k % 5;
          const tall = (block % 2 === 0 && pos === 2) || (block % 2 === 1 && pos === 0);
          return <GridTile key={p.id} post={p} list={list} tall={tall} />;
        })}
      </div>
    );
  }
  return <div className="grid profile-grid">{posts.map((p) => <GridTile key={p.id} post={p} list={list} />)}</div>;
}

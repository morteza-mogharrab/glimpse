import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Post } from '../../types';
import { useActions, useDb } from '../../store/AppStore';
import { useDoubleTap } from '../../hooks';
import { ChevronLeft, ChevronRight, HeartIcon, TagIcon } from '../icons/Icons';

const ASPECT: Record<Post['aspect'], string> = { '1:1': '1 / 1', '4:5': '4 / 5', '16:9': '16 / 9' };

/** Post image(s) with carousel controls, double-tap to like and tagged-people chips. */
export function PostMedia({ post, fit = 'aspect', onSingleTap }: {
  post: Post;
  /** 'aspect' keeps the post's ratio (feed); 'fill' fills the parent (modal). */
  fit?: 'aspect' | 'fill';
  onSingleTap?(): void;
}) {
  const db = useDb();
  const { like } = useActions();
  const [index, setIndex] = useState(0);
  const [burst, setBurst] = useState(0);
  const [showTags, setShowTags] = useState(false);
  const count = post.media.length;

  const onTap = useDoubleTap(
    () => { like(post.id); setBurst((b) => b + 1); },
    () => (post.taggedUserIds?.length ? setShowTags((s) => !s) : onSingleTap?.()),
  );

  return (
    <div className={`post-media fit-${fit}`} style={fit === 'aspect' ? { aspectRatio: ASPECT[post.aspect] } : undefined}>
      <div className="carousel-track" style={{ transform: `translateX(-${index * 100}%)` }} onClick={onTap}>
        {post.media.map((m, i) => (
          <div className="carousel-slide" key={i}>
            <img src={m.src} alt={m.alt || `Photo by ${post.authorId}`} loading={i === 0 ? 'eager' : 'lazy'}
              draggable={false} style={{ filter: post.filter }} />
          </div>
        ))}
      </div>
      {burst > 0 && (
        <span key={burst} className="heart-burst" aria-hidden="true"><HeartIcon filled size={96} strokeWidth={0} /></span>
      )}
      {index > 0 && (
        <button className="carousel-btn prev" onClick={() => setIndex(index - 1)} aria-label="Previous photo"><ChevronLeft size={16} strokeWidth={3} /></button>
      )}
      {index < count - 1 && (
        <button className="carousel-btn next" onClick={() => setIndex(index + 1)} aria-label="Next photo"><ChevronRight size={16} strokeWidth={3} /></button>
      )}
      {count > 1 && (
        <>
          <span className="carousel-count">{index + 1}/{count}</span>
          <div className="carousel-dots" aria-hidden="true">
            {post.media.map((_, i) => <span key={i} className={i === index ? 'on' : ''} />)}
          </div>
        </>
      )}
      {!!post.taggedUserIds?.length && (
        <>
          <button className="tag-toggle" onClick={() => setShowTags((s) => !s)} aria-label="Show tagged people"><TagIcon size={14} /></button>
          {showTags && post.taggedUserIds.map((id, i) => db.users[id] && (
            <Link key={id} to={`/${id}`} className="tag-chip" style={{ top: `${38 + i * 14}%`, left: `${30 + i * 10}%` }}>
              {db.users[id].username}
            </Link>
          ))}
        </>
      )}
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDb } from '../store/AppStore';
import { feedPosts, suggestedUsers } from '../store/selectors';
import { useInfiniteScroll, useIsMobile } from '../hooks';
import { StoriesBar } from '../components/feed/StoriesBar';
import { PostCard } from '../components/feed/PostCard';
import { Suggestions } from '../components/feed/Suggestions';
import { MobileHomeHeader } from '../components/layout/MobileNav';
import { CheckCircle } from '../components/icons/Icons';
import { Avatar } from '../components/common/Avatar';
import { FollowButton } from '../components/common/UserBits';

const PAGE = 5;

function PostSkeleton() {
  return (
    <div className="post-card skeleton" aria-hidden="true">
      <div className="post-head"><span className="sk sk-circle" /><span className="sk sk-line" style={{ width: 140 }} /></div>
      <div className="sk sk-media" />
      <div className="sk sk-line" style={{ width: 120, margin: '12px 0' }} />
      <div className="sk sk-line" style={{ width: '80%' }} />
    </div>
  );
}

export function HomePage() {
  const db = useDb();
  const isMobile = useIsMobile();
  const posts = useMemo(() => feedPosts(db), [db]);
  const [count, setCount] = useState(PAGE);
  const [loading, setLoading] = useState(false);
  const hasMore = count < posts.length;

  // Simulated pagination: a real API would return a cursor.
  const sentinel = useInfiniteScroll(() => {
    if (loading || !hasMore) return;
    setLoading(true);
    setTimeout(() => { setCount((c) => c + PAGE); setLoading(false); }, 450);
  }, hasMore);

  // "Caught up" divider after posts from the last 3 days.
  const cutoff = Date.now() - 3 * 86_400_000;
  const visible = posts.slice(0, count);
  const caughtUpAt = visible.findIndex((p) => new Date(p.createdAt).getTime() < cutoff);
  const suggestions = suggestedUsers(db, 6);

  return (
    <div className="home">
      {isMobile && <MobileHomeHeader />}
      <div className="home-feed">
        <StoriesBar />
        <div className="feed">
          {visible.map((p, k) => (
            <div key={p.id}>
              {k === caughtUpAt && (
                <div className="caught-up">
                  <CheckCircle size={84} />
                  <h3>You&rsquo;re all caught up</h3>
                  <p className="muted">You&rsquo;ve seen all new posts from the past 3 days.</p>
                  <p className="muted small">Older posts</p>
                </div>
              )}
              {k === 3 && suggestions.length > 0 && (
                <section className="feed-suggest">
                  <div className="feed-suggest-head"><span className="bold">Suggested for you</span><Link to="/explore/people" className="text-btn blue small">See all</Link></div>
                  <div className="feed-suggest-row">
                    {suggestions.map((u) => (
                      <div key={u.id} className="suggest-card">
                        <Link to={`/${u.username}`}><Avatar user={u} size={56} /></Link>
                        <Link to={`/${u.username}`} className="bold ellipsis">{u.username}</Link>
                        <span className="muted small ellipsis">{u.followsMe ? 'Follows you' : 'Suggested for you'}</span>
                        <FollowButton user={u} small />
                      </div>
                    ))}
                  </div>
                </section>
              )}
              <PostCard post={p} />
            </div>
          ))}
          {loading && <PostSkeleton />}
          <div ref={sentinel} />
          {!hasMore && posts.length > 0 && (
            <div className="caught-up end">
              <CheckCircle size={64} />
              <h3>That&rsquo;s everything</h3>
              <p className="muted">Follow more accounts to see more posts. <Link to="/explore" className="blue">Explore</Link></p>
            </div>
          )}
          {posts.length === 0 && (
            <div className="caught-up">
              <h3>Welcome to Glimpse</h3>
              <p className="muted">Follow people to see their photos here.</p>
              <Link to="/explore/people" className="btn btn-primary">Find people</Link>
            </div>
          )}
        </div>
      </div>
      <Suggestions />
    </div>
  );
}

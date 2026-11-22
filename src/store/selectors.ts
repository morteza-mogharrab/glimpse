import type { Database, ID, Post, Story, User } from '../types';

const byNewest = (a: Post, b: Post) => b.createdAt.localeCompare(a.createdAt);

/** Home feed: posts by people I follow plus my own, newest first. */
export function feedPosts(db: Database): Post[] {
  const visible = new Set([...db.followingIds, db.meId]);
  return Object.values(db.posts).filter((p) => visible.has(p.authorId)).sort(byNewest);
}

export function postsByUser(db: Database, userId: ID): Post[] {
  return Object.values(db.posts).filter((p) => p.authorId === userId).sort(byNewest);
}

export function reelsByUser(db: Database, userId: ID): Post[] {
  return postsByUser(db, userId).filter((p) => p.isReel);
}

export function taggedPosts(db: Database, userId: ID): Post[] {
  return Object.values(db.posts).filter((p) => p.taggedUserIds?.includes(userId)).sort(byNewest);
}

export function savedPosts(db: Database): Post[] {
  return Object.values(db.posts).filter((p) => p.savedByMe).sort(byNewest);
}

/** Explore: posts from everyone except me, interleaved for variety. */
export function explorePosts(db: Database): Post[] {
  const others = Object.values(db.posts).filter((p) => p.authorId !== db.meId);
  // stable shuffle by id hash
  const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  return others.sort((a, b) => hash(a.id + 'x') - hash(b.id + 'x'));
}

export function allReels(db: Database): Post[] {
  return Object.values(db.posts).filter((p) => p.isReel).sort(byNewest);
}

export function storyOf(db: Database, userId: ID): Story | undefined {
  return db.stories.find((s) => s.userId === userId && s.items.length > 0);
}

export const hasUnseenStory = (s: Story | undefined) => !!s && s.seenUpTo < s.items.length;

/** Stories bar order: mine first, then unseen, then seen. */
export function orderedStories(db: Database): Story[] {
  const mine = db.stories.filter((s) => s.userId === db.meId);
  const others = db.stories.filter((s) => s.userId !== db.meId && s.items.length > 0);
  return [...mine, ...others.filter(hasUnseenStory), ...others.filter((s) => !hasUnseenStory(s))];
}

/** People I don't follow, people who follow me first. */
export function suggestedUsers(db: Database, limit = 5): User[] {
  return Object.values(db.users)
    .filter((u) => u.id !== db.meId && !db.followingIds.includes(u.id))
    .sort((a, b) => Number(!!b.followsMe) - Number(!!a.followsMe) || b.followerCount - a.followerCount)
    .slice(0, limit);
}

/** A plausible "followed by" line for someone's profile. */
export function mutualFollowers(db: Database, userId: ID): User[] {
  const seed = [...userId].reduce((h, c) => h + c.charCodeAt(0), 0);
  return db.followingIds
    .filter((id) => id !== userId)
    .filter((_, i) => (i + seed) % 3 === 0)
    .map((id) => db.users[id])
    .filter(Boolean);
}

/** Simulated follower / following lists for the modal. */
export function followList(db: Database, userId: ID, kind: 'followers' | 'following'): User[] {
  if (userId === db.meId) {
    return kind === 'following'
      ? db.followingIds.map((id) => db.users[id]).filter(Boolean)
      : Object.values(db.users).filter((u) => u.followsMe);
  }
  const all = Object.values(db.users).filter((u) => u.id !== userId);
  const seed = [...userId].reduce((h, c) => h + c.charCodeAt(0), 0) + (kind === 'followers' ? 1 : 2);
  return all.filter((_, i) => (i * 7 + seed) % 3 !== 0);
}

export function searchUsers(db: Database, q: string): User[] {
  const s = q.trim().toLowerCase().replace(/^@/, '');
  if (!s) return [];
  return Object.values(db.users)
    .filter((u) => u.username.includes(s) || u.fullName.toLowerCase().includes(s))
    .sort((a, b) => Number(b.username.startsWith(s)) - Number(a.username.startsWith(s)) || b.followerCount - a.followerCount);
}

export const unreadDmCount = (db: Database) => db.conversations.filter((c) => c.unread).length;
export const unreadNotificationCount = (db: Database) => db.notifications.filter((n) => !n.read).length;

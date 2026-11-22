import type {
  AppNotification, Comment, Conversation, Database, ID, Message, Post, StoryItem, User,
} from '../types';

/**
 * Every write the app can make, as a serialisable command.
 * The UI applies a mutation optimistically with `applyMutation`, then sends the same
 * command to the API. A real backend maps each `type` to an endpoint (see httpApi.ts).
 */
export type Mutation =
  | { type: 'post/like'; postId: ID }
  | { type: 'post/save'; postId: ID }
  | { type: 'post/create'; post: Post }
  | { type: 'post/delete'; postId: ID }
  | { type: 'post/update'; postId: ID; patch: Partial<Pick<Post, 'caption' | 'hideLikes' | 'commentsOff'>> }
  | { type: 'comment/add'; postId: ID; comment: Comment }
  | { type: 'comment/delete'; postId: ID; commentId: ID }
  | { type: 'comment/like'; postId: ID; commentId: ID }
  | { type: 'user/follow'; userId: ID }
  | { type: 'user/removeFollower'; userId: ID }
  | { type: 'profile/update'; patch: Partial<Pick<User, 'fullName' | 'bio' | 'website' | 'avatar' | 'category'>> }
  | { type: 'story/seen'; storyId: ID; upTo: number }
  | { type: 'story/like'; storyId: ID; itemId: ID }
  | { type: 'story/add'; item: StoryItem }
  | { type: 'dm/send'; conversationId: ID; message: Message }
  | { type: 'dm/receive'; conversationId: ID; message: Message }
  | { type: 'dm/start'; conversation: Conversation }
  | { type: 'dm/read'; conversationId: ID }
  | { type: 'dm/likeMessage'; conversationId: ID; messageId: ID }
  | { type: 'notifications/readAll' }
  | { type: 'notifications/push'; notification: AppNotification }
  | { type: 'search/addRecent'; userId: ID }
  | { type: 'search/removeRecent'; userId: ID }
  | { type: 'search/clearRecent' };

const mapPost = (db: Database, id: ID, fn: (p: Post) => Post): Database => {
  const p = db.posts[id];
  return p ? { ...db, posts: { ...db.posts, [id]: fn(p) } } : db;
};
const mapUser = (db: Database, id: ID, fn: (u: User) => User): Database => {
  const u = db.users[id];
  return u ? { ...db, users: { ...db.users, [id]: fn(u) } } : db;
};
const mapConversation = (db: Database, id: ID, fn: (c: Conversation) => Conversation): Database => ({
  ...db,
  conversations: db.conversations.map((c) => (c.id === id ? fn(c) : c)),
});

/** Pure reducer shared by the client store and the mock backend. */
export function applyMutation(db: Database, m: Mutation): Database {
  switch (m.type) {
    case 'post/like':
      return mapPost(db, m.postId, (p) => ({
        ...p, likedByMe: !p.likedByMe, likeCount: p.likeCount + (p.likedByMe ? -1 : 1),
      }));
    case 'post/save':
      return mapPost(db, m.postId, (p) => ({ ...p, savedByMe: !p.savedByMe }));
    case 'post/create':
      return { ...db, posts: { [m.post.id]: m.post, ...db.posts } };
    case 'post/delete': {
      const posts = { ...db.posts };
      delete posts[m.postId];
      return { ...db, posts };
    }
    case 'post/update':
      return mapPost(db, m.postId, (p) => ({ ...p, ...m.patch }));
    case 'comment/add':
      return mapPost(db, m.postId, (p) => ({
        ...p, comments: [...p.comments, m.comment], commentCount: p.commentCount + 1,
      }));
    case 'comment/delete':
      return mapPost(db, m.postId, (p) => ({
        ...p,
        comments: p.comments.filter((c) => c.id !== m.commentId),
        commentCount: Math.max(0, p.commentCount - 1),
      }));
    case 'comment/like':
      return mapPost(db, m.postId, (p) => ({
        ...p,
        comments: p.comments.map((c) => (c.id === m.commentId
          ? { ...c, likedByMe: !c.likedByMe, likeCount: c.likeCount + (c.likedByMe ? -1 : 1) }
          : c)),
      }));
    case 'user/follow': {
      const following = db.followingIds.includes(m.userId);
      const delta = following ? -1 : 1;
      let next: Database = {
        ...db,
        followingIds: following ? db.followingIds.filter((x) => x !== m.userId) : [...db.followingIds, m.userId],
      };
      next = mapUser(next, m.userId, (u) => ({ ...u, followerCount: u.followerCount + delta }));
      return mapUser(next, db.meId, (u) => ({ ...u, followingCount: u.followingCount + delta }));
    }
    case 'user/removeFollower': {
      const next = mapUser(db, m.userId, (u) => ({ ...u, followsMe: false }));
      return mapUser(next, db.meId, (u) => ({ ...u, followerCount: Math.max(0, u.followerCount - 1) }));
    }
    case 'profile/update':
      return mapUser(db, db.meId, (u) => ({ ...u, ...m.patch }));
    case 'story/seen':
      return {
        ...db,
        stories: db.stories.map((s) => (s.id === m.storyId ? { ...s, seenUpTo: Math.max(s.seenUpTo, m.upTo) } : s)),
      };
    case 'story/like':
      return {
        ...db,
        stories: db.stories.map((s) => (s.id !== m.storyId ? s : {
          ...s, items: s.items.map((it) => (it.id === m.itemId ? { ...it, likedByMe: !it.likedByMe } : it)),
        })),
      };
    case 'story/add': {
      const mine = db.stories.find((s) => s.userId === db.meId);
      if (mine) {
        return {
          ...db,
          stories: db.stories.map((s) => (s === mine ? { ...s, items: [...s.items, m.item], seenUpTo: s.items.length + 1 } : s)),
        };
      }
      return { ...db, stories: [{ id: `s-${db.meId}`, userId: db.meId, items: [m.item], seenUpTo: 1 }, ...db.stories] };
    }
    case 'dm/send':
    case 'dm/receive': {
      const moved = mapConversation(db, m.conversationId, (c) => ({
        ...c, messages: [...c.messages, m.message], unread: m.type === 'dm/receive',
      }));
      // Most recent conversation first.
      const conv = moved.conversations.find((c) => c.id === m.conversationId);
      return conv
        ? { ...moved, conversations: [conv, ...moved.conversations.filter((c) => c !== conv)] }
        : moved;
    }
    case 'dm/start':
      if (db.conversations.some((c) => c.id === m.conversation.id)) return db;
      return { ...db, conversations: [m.conversation, ...db.conversations] };
    case 'dm/read':
      return mapConversation(db, m.conversationId, (c) => ({ ...c, unread: false }));
    case 'dm/likeMessage':
      return mapConversation(db, m.conversationId, (c) => ({
        ...c, messages: c.messages.map((x) => (x.id === m.messageId ? { ...x, likedByMe: !x.likedByMe } : x)),
      }));
    case 'notifications/readAll':
      return { ...db, notifications: db.notifications.map((n) => (n.read ? n : { ...n, read: true })) };
    case 'notifications/push':
      return { ...db, notifications: [m.notification, ...db.notifications] };
    case 'search/addRecent':
      return { ...db, recentSearchIds: [m.userId, ...db.recentSearchIds.filter((x) => x !== m.userId)].slice(0, 12) };
    case 'search/removeRecent':
      return { ...db, recentSearchIds: db.recentSearchIds.filter((x) => x !== m.userId) };
    case 'search/clearRecent':
      return { ...db, recentSearchIds: [] };
    default:
      return db;
  }
}

/**
 * Domain model. These shapes are what the API layer returns, so a real backend
 * only needs to serve the same JSON (see src/services/api.ts).
 */

export type ID = string;
export type ISODate = string;
export type AspectRatio = '1:1' | '4:5' | '16:9';

export interface MediaItem {
  src: string;
  /** Smaller version used in grids. Falls back to `src`. */
  thumb?: string;
  alt?: string;
}

export interface Highlight {
  id: ID;
  title: string;
  cover: MediaItem;
  items: MediaItem[];
}

export interface User {
  id: ID;
  username: string;
  fullName: string;
  avatar: string;
  bio: string;
  website?: string;
  category?: string;
  verified?: boolean;
  isPrivate?: boolean;
  followerCount: number;
  followingCount: number;
  /** Whether this user follows the signed-in user. */
  followsMe?: boolean;
  highlights: Highlight[];
}

export interface Comment {
  id: ID;
  authorId: ID;
  text: string;
  createdAt: ISODate;
  likeCount: number;
  likedByMe: boolean;
}

export interface Post {
  id: ID;
  authorId: ID;
  media: MediaItem[];
  aspect: AspectRatio;
  caption: string;
  location?: string;
  createdAt: ISODate;
  likeCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  /** A followed user shown in "Liked by x and others". */
  likedByPreviewId?: ID;
  comments: Comment[];
  /** Total comments on the server; may exceed comments.length. */
  commentCount: number;
  isReel?: boolean;
  /** CSS filter chosen in the editor when the post was created. */
  filter?: string;
  audio?: string;
  hideLikes?: boolean;
  commentsOff?: boolean;
  taggedUserIds?: ID[];
}

export interface StoryItem {
  id: ID;
  media: MediaItem;
  createdAt: ISODate;
  likedByMe?: boolean;
}

export interface Story {
  id: ID;
  userId: ID;
  items: StoryItem[];
  /** Index of the first unseen item; equals items.length when fully seen. */
  seenUpTo: number;
}

export interface Message {
  id: ID;
  senderId: ID;
  text: string;
  createdAt: ISODate;
  /** Post shared into the chat. */
  postId?: ID;
  likedByMe?: boolean;
}

export interface Conversation {
  id: ID;
  participantId: ID;
  messages: Message[];
  unread: boolean;
  muted?: boolean;
}

export type NotificationType = 'like' | 'comment' | 'follow' | 'mention' | 'comment_like';

export interface AppNotification {
  id: ID;
  type: NotificationType;
  userId: ID;
  postId?: ID;
  text?: string;
  createdAt: ISODate;
  read: boolean;
}

/** Everything the client holds; the mock backend persists the same shape. */
export interface Database {
  version: number;
  meId: ID;
  users: Record<ID, User>;
  /** IDs the signed-in user follows. */
  followingIds: ID[];
  posts: Record<ID, Post>;
  stories: Story[];
  conversations: Conversation[];
  notifications: AppNotification[];
  recentSearchIds: ID[];
}

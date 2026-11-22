import {
  createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState,
  type ReactNode,
} from 'react';
import type {
  AspectRatio, Comment, Conversation, Database, Highlight, ID, MediaItem, Message, Post, User,
} from '../types';
import { api } from '../services/api';
import { applyMutation, type Mutation } from '../services/mutations';
import { storage } from '../services/storage';
import { uid } from '../utils/format';

// ---------------------------------------------------------------- data store
type Action = { type: 'load'; db: Database } | { type: 'mutate'; mutation: Mutation };

function reducer(state: Database | null, action: Action): Database | null {
  if (action.type === 'load') return action.db;
  return state ? applyMutation(state, action.mutation) : state;
}

// ---------------------------------------------------------------- UI state
export type Theme = 'light' | 'dark';
export type Panel = 'search' | 'notifications' | null;

export interface StoryViewerState {
  /** Story ids in playback order (stories bar) … */
  storyIds?: ID[];
  /** … or a single highlight owned by `userId`. */
  highlight?: Highlight & { userId: ID };
  startIndex: number;
}

export interface PostModalState {
  postId: ID;
  /** Sibling posts for previous / next arrows (e.g. a profile grid). */
  list?: ID[];
}

interface Toast { id: number; text: string }

interface UIValue {
  theme: Theme;
  toggleTheme(): void;
  panel: Panel;
  setPanel(p: Panel): void;
  postModal: PostModalState | null;
  openPost(postId: ID, list?: ID[]): void;
  closePost(): void;
  storyViewer: StoryViewerState | null;
  openStories(state: StoryViewerState): void;
  closeStories(): void;
  createOpen: boolean;
  setCreateOpen(open: boolean): void;
  shareTarget: ID | null;
  setShareTarget(postId: ID | null): void;
  toasts: Toast[];
  toast(text: string): void;
  typing: Record<ID, boolean>;
}

// ---------------------------------------------------------------- contexts
const DbContext = createContext<Database | null>(null);
const ActionsContext = createContext<ReturnType<typeof buildActions> | null>(null);
const UIContext = createContext<UIValue | null>(null);

function buildActions(
  getDb: () => Database | null,
  commit: (m: Mutation) => void,
  reload: (db: Database) => void,
  toast: (t: string) => void,
) {
  const me = () => getDb()!.meId;
  const now = () => new Date().toISOString();

  return {
    toggleLike: (postId: ID) => commit({ type: 'post/like', postId }),
    /** Double-tap: only ever likes. */
    like: (postId: ID) => {
      if (!getDb()?.posts[postId]?.likedByMe) commit({ type: 'post/like', postId });
    },
    toggleSave: (postId: ID) => {
      const saved = getDb()?.posts[postId]?.savedByMe;
      commit({ type: 'post/save', postId });
      toast(saved ? 'Removed from saved' : 'Saved to your collection');
    },
    addComment: (postId: ID, text: string) => {
      const comment: Comment = {
        id: uid('c'), authorId: me(), text: text.trim(), createdAt: now(), likeCount: 0, likedByMe: false,
      };
      if (comment.text) commit({ type: 'comment/add', postId, comment });
    },
    deleteComment: (postId: ID, commentId: ID) => commit({ type: 'comment/delete', postId, commentId }),
    likeComment: (postId: ID, commentId: ID) => commit({ type: 'comment/like', postId, commentId }),
    toggleFollow: (userId: ID) => commit({ type: 'user/follow', userId }),
    removeFollower: (userId: ID) => {
      commit({ type: 'user/removeFollower', userId });
      toast('Follower removed');
    },
    createPost: (input: { media: MediaItem[]; caption: string; location?: string; aspect: AspectRatio; filter?: string; hideLikes?: boolean; commentsOff?: boolean }) => {
      const post: Post = {
        id: uid('p'), authorId: me(), createdAt: now(), likeCount: 0, likedByMe: false, savedByMe: false,
        comments: [], commentCount: 0, ...input,
      };
      commit({ type: 'post/create', post });
      return post.id;
    },
    deletePost: (postId: ID) => {
      commit({ type: 'post/delete', postId });
      toast('Post deleted');
    },
    updatePost: (postId: ID, patch: Partial<Pick<Post, 'caption' | 'hideLikes' | 'commentsOff'>>) =>
      commit({ type: 'post/update', postId, patch }),
    updateProfile: (patch: Partial<Pick<User, 'fullName' | 'bio' | 'website' | 'avatar' | 'category'>>) => {
      commit({ type: 'profile/update', patch });
      toast('Profile saved');
    },
    markStorySeen: (storyId: ID, upTo: number) => {
      const s = getDb()?.stories.find((x) => x.id === storyId);
      if (s && upTo > s.seenUpTo) commit({ type: 'story/seen', storyId, upTo });
    },
    likeStoryItem: (storyId: ID, itemId: ID) => commit({ type: 'story/like', storyId, itemId }),
    addStory: (media: MediaItem) => {
      commit({ type: 'story/add', item: { id: uid('si'), media, createdAt: now() } });
      toast('Added to your story');
    },
    /** Finds or creates the 1:1 conversation with a user and returns its id. */
    openConversation: (userId: ID): ID => {
      const db = getDb()!;
      const existing = db.conversations.find((c) => c.participantId === userId);
      if (existing) return existing.id;
      const conversation: Conversation = { id: uid('dm'), participantId: userId, messages: [], unread: false };
      commit({ type: 'dm/start', conversation });
      return conversation.id;
    },
    sendMessage: (conversationId: ID, text: string, postId?: ID) => {
      const message: Message = { id: uid('m'), senderId: me(), text: text.trim(), createdAt: now(), postId };
      if (message.text || postId) commit({ type: 'dm/send', conversationId, message });
    },
    markConversationRead: (conversationId: ID) => {
      if (getDb()?.conversations.find((c) => c.id === conversationId)?.unread) {
        commit({ type: 'dm/read', conversationId });
      }
    },
    likeMessage: (conversationId: ID, messageId: ID) => commit({ type: 'dm/likeMessage', conversationId, messageId }),
    readAllNotifications: () => {
      if (getDb()?.notifications.some((n) => !n.read)) commit({ type: 'notifications/readAll' });
    },
    addRecentSearch: (userId: ID) => commit({ type: 'search/addRecent', userId }),
    removeRecentSearch: (userId: ID) => commit({ type: 'search/removeRecent', userId }),
    clearRecentSearches: () => commit({ type: 'search/clearRecent' }),
    resetDemo: async () => {
      reload(await api.reset());
      toast('Sample data restored');
    },
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [db, dispatch] = useReducer(reducer, null);
  const dbRef = useRef(db);
  dbRef.current = db;

  // UI state
  const [theme, setTheme] = useState<Theme>(() => initialTheme());
  const [panel, setPanel] = useState<Panel>(null);
  const [postModal, setPostModal] = useState<PostModalState | null>(null);
  const [storyViewer, setStoryViewer] = useState<StoryViewerState | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<ID | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [typing, setTyping] = useState<Record<ID, boolean>>({});

  const toast = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    storage.set('glimpse.theme', theme);
  }, [theme]);

  // Bootstrap + server events
  useEffect(() => {
    let alive = true;
    api.bootstrap().then((data) => alive && dispatch({ type: 'load', db: data }));
    const off = api.subscribe((e) => {
      if (e.type === 'mutation') dispatch({ type: 'mutate', mutation: e.mutation });
      if (e.type === 'typing') setTyping((t) => ({ ...t, [e.conversationId]: e.typing }));
    });
    return () => {
      alive = false;
      off();
    };
  }, []);

  const actions = useMemo(() => {
    const commit = (mutation: Mutation) => {
      dispatch({ type: 'mutate', mutation }); // optimistic
      api.mutate(mutation).catch(async () => {
        toast('Couldn’t save that. Please try again.');
        dispatch({ type: 'load', db: await api.bootstrap() }); // resync from server
      });
    };
    return buildActions(() => dbRef.current, commit, (d) => dispatch({ type: 'load', db: d }), toast);
  }, [toast]);

  // Stable callbacks so effects that depend on them don't re-run on every UI change.
  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);
  const openPost = useCallback((postId: ID, list?: ID[]) => setPostModal({ postId, list }), []);
  const closePost = useCallback(() => setPostModal(null), []);
  const closeStories = useCallback(() => setStoryViewer(null), []);

  const ui = useMemo<UIValue>(() => ({
    theme,
    toggleTheme,
    panel,
    setPanel,
    postModal,
    openPost,
    closePost,
    storyViewer,
    openStories: setStoryViewer,
    closeStories,
    createOpen,
    setCreateOpen,
    shareTarget,
    setShareTarget,
    toasts,
    toast,
    typing,
  }), [theme, toggleTheme, panel, postModal, openPost, closePost, storyViewer, closeStories, createOpen, shareTarget, toasts, toast, typing]);

  return (
    <DbContext.Provider value={db}>
      <ActionsContext.Provider value={actions}>
        <UIContext.Provider value={ui}>{children}</UIContext.Provider>
      </ActionsContext.Provider>
    </DbContext.Provider>
  );
}

function initialTheme(): Theme {
  const saved = storage.get<Theme>('glimpse.theme');
  if (saved === 'light' || saved === 'dark') return saved;
  const attr = document.documentElement.dataset.theme;
  if (attr === 'light' || attr === 'dark') return attr;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// ---------------------------------------------------------------- hooks
/** Database, guaranteed loaded inside <AppShell>. */
export function useDb(): Database {
  const db = useContext(DbContext);
  if (!db) throw new Error('useDb used before data loaded');
  return db;
}
export const useMaybeDb = () => useContext(DbContext);
export function useActions() {
  const a = useContext(ActionsContext);
  if (!a) throw new Error('useActions outside AppProvider');
  return a;
}
export function useUI() {
  const u = useContext(UIContext);
  if (!u) throw new Error('useUI outside AppProvider');
  return u;
}
export const useMe = () => {
  const db = useDb();
  return db.users[db.meId];
};
export const useUser = (id: ID | undefined) => {
  const db = useDb();
  return id ? db.users[id] : undefined;
};
export const useIsFollowing = (id: ID) => useDb().followingIds.includes(id);

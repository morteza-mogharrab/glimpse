import type { Database, Message } from '../types';
import { createSeedDatabase, SEED_VERSION } from '../data/seed';
import type { ApiClient, ServerEvent } from './api';
import { applyMutation, type Mutation } from './mutations';
import { storage } from './storage';

const KEY = 'glimpse.db';
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const REPLIES = [
  'Haha yes 😂', 'Omg same', 'That sounds amazing!', 'Let’s do it 🙌', 'Wait really?? Tell me more',
  'Love that', 'Sending you the details in a sec', '❤️', 'Sounds good to me!', 'Can’t wait 😍',
  'You’re the best', 'Okay deal', 'Hahaha stop', 'Ooh good idea',
];

/**
 * In-browser stand-in for a backend: keeps its own copy of the database,
 * persists it to localStorage and simulates latency and push events.
 */
export function createMockApi(): ApiClient {
  let db: Database = load();
  const listeners = new Set<(e: ServerEvent) => void>();
  const emit = (e: ServerEvent) => listeners.forEach((l) => l(e));

  function load(): Database {
    const saved = storage.get<Database>(KEY);
    if (saved && saved.version === SEED_VERSION) return saved;
    const fresh = createSeedDatabase();
    storage.set(KEY, fresh);
    return fresh;
  }

  function commit(m: Mutation) {
    db = applyMutation(db, m);
    if (!storage.set(KEY, db)) console.warn('[mockApi] could not persist (storage full or unavailable)');
  }

  function simulateReply(conversationId: string) {
    const conv = db.conversations.find((c) => c.id === conversationId);
    if (!conv) return;
    setTimeout(() => emit({ type: 'typing', conversationId, typing: true }), 900);
    setTimeout(() => {
      emit({ type: 'typing', conversationId, typing: false });
      const message: Message = {
        id: `m-${Date.now()}`,
        senderId: conv.participantId,
        text: REPLIES[Math.floor(Math.random() * REPLIES.length)],
        createdAt: new Date().toISOString(),
      };
      const mutation: Mutation = { type: 'dm/receive', conversationId, message };
      commit(mutation);
      emit({ type: 'mutation', mutation });
    }, 2600 + Math.random() * 1500);
  }

  return {
    async bootstrap() {
      await delay(250);
      return structuredClone(db);
    },
    async mutate(m) {
      await delay(80 + Math.random() * 120);
      commit(m);
      if (m.type === 'dm/send') simulateReply(m.conversationId);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async reset() {
      storage.remove(KEY);
      db = load();
      return structuredClone(db);
    },
  };
}

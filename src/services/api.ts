import type { Database, ID } from '../types';
import type { Mutation } from './mutations';
import { createMockApi } from './mockApi';

/** Real-time events pushed by the server (a WebSocket in production). */
export type ServerEvent =
  | { type: 'mutation'; mutation: Mutation }
  | { type: 'typing'; conversationId: ID; typing: boolean };

/**
 * The only surface the UI talks to. Swap the implementation below for
 * `createHttpApi(baseUrl)` (see httpApi.ts) once a backend exists.
 */
export interface ApiClient {
  /** Initial payload for the signed-in user. */
  bootstrap(): Promise<Database>;
  /** Persist a write that the UI has already applied optimistically. */
  mutate(mutation: Mutation): Promise<void>;
  /** Subscribe to server-pushed events. Returns an unsubscribe function. */
  subscribe(listener: (event: ServerEvent) => void): () => void;
  /** Demo only: restore the sample data. */
  reset(): Promise<Database>;
}

export const api: ApiClient = createMockApi();

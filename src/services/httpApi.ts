import type { ApiClient, ServerEvent } from './api';
import type { Mutation } from './mutations';

/**
 * Reference implementation for a real REST + WebSocket backend.
 * Not used by the demo; switch `api` in api.ts to `createHttpApi(url)` when ready.
 *
 * Each mutation maps to one endpoint. The server is expected to return 2xx and
 * to broadcast mutations from other users over the socket as ServerEvents.
 */
export function createHttpApi(baseUrl: string, getToken: () => string | null): ApiClient {
  const request = async (method: string, path: string, body?: unknown) => {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`);
    return res.status === 204 ? null : res.json();
  };

  const route = (m: Mutation): [string, string, unknown?] => {
    switch (m.type) {
      case 'post/like': return ['POST', `/posts/${m.postId}/like`];
      case 'post/save': return ['POST', `/posts/${m.postId}/save`];
      case 'post/create': return ['POST', '/posts', m.post];
      case 'post/delete': return ['DELETE', `/posts/${m.postId}`];
      case 'post/update': return ['PATCH', `/posts/${m.postId}`, m.patch];
      case 'comment/add': return ['POST', `/posts/${m.postId}/comments`, m.comment];
      case 'comment/delete': return ['DELETE', `/posts/${m.postId}/comments/${m.commentId}`];
      case 'comment/like': return ['POST', `/posts/${m.postId}/comments/${m.commentId}/like`];
      case 'user/follow': return ['POST', `/users/${m.userId}/follow`];
      case 'user/removeFollower': return ['DELETE', `/me/followers/${m.userId}`];
      case 'profile/update': return ['PATCH', '/me', m.patch];
      case 'story/seen': return ['POST', `/stories/${m.storyId}/seen`, { upTo: m.upTo }];
      case 'story/like': return ['POST', `/stories/${m.storyId}/items/${m.itemId}/like`];
      case 'story/add': return ['POST', '/stories', m.item];
      case 'dm/send': return ['POST', `/conversations/${m.conversationId}/messages`, m.message];
      case 'dm/start': return ['POST', '/conversations', m.conversation];
      case 'dm/read': return ['POST', `/conversations/${m.conversationId}/read`];
      case 'dm/likeMessage': return ['POST', `/conversations/${m.conversationId}/messages/${m.messageId}/like`];
      case 'notifications/readAll': return ['POST', '/notifications/read'];
      case 'search/addRecent': return ['POST', '/me/recent-searches', { userId: m.userId }];
      case 'search/removeRecent': return ['DELETE', `/me/recent-searches/${m.userId}`];
      case 'search/clearRecent': return ['DELETE', '/me/recent-searches'];
      // Server-originated only:
      case 'dm/receive':
      case 'notifications/push':
        throw new Error(`${m.type} is server-originated`);
    }
  };

  return {
    bootstrap: () => request('GET', '/me/bootstrap'),
    async mutate(m) {
      const [method, path, body] = route(m);
      await request(method, path, body);
    },
    subscribe(listener) {
      const ws = new WebSocket(baseUrl.replace(/^http/, 'ws') + '/events');
      ws.onmessage = (e) => listener(JSON.parse(e.data) as ServerEvent);
      return () => ws.close();
    },
    async reset() {
      throw new Error('reset is only available in the mock API');
    },
  };
}

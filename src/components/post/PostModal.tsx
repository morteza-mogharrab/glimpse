import { useEffect } from 'react';
import { useDb, useUI } from '../../store/AppStore';
import { ChevronLeft, ChevronRight } from '../icons/Icons';
import { Modal } from '../common/Modal';
import { PostView } from './PostView';

/** Desktop post viewer with previous / next navigation through a list. */
export function PostModal() {
  const db = useDb();
  const { postModal, closePost, openPost } = useUI();
  const post = postModal ? db.posts[postModal.postId] : undefined;
  const list = postModal?.list ?? [];
  const i = post ? list.indexOf(post.id) : -1;
  const prev = i > 0 ? list[i - 1] : undefined;
  const next = i >= 0 && i < list.length - 1 ? list[i + 1] : undefined;

  useEffect(() => {
    if (!postModal) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT') return;
      if (e.key === 'ArrowLeft' && prev) openPost(prev, list);
      if (e.key === 'ArrowRight' && next) openPost(next, list);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [postModal, prev, next, list, openPost]);

  useEffect(() => {
    if (postModal && !post) closePost(); // deleted
  }, [postModal, post, closePost]);

  if (!post) return null;
  return (
    <Modal onClose={closePost} className="post-modal" closeButton dim="heavy" label="Post">
      <PostView key={post.id} post={post} onDeleted={closePost} />
      {prev && (
        <button className="modal-nav prev" onClick={() => openPost(prev, list)} aria-label="Previous post"><ChevronLeft size={16} strokeWidth={3} /></button>
      )}
      {next && (
        <button className="modal-nav next" onClick={() => openPost(next, list)} aria-label="Next post"><ChevronRight size={16} strokeWidth={3} /></button>
      )}
    </Modal>
  );
}

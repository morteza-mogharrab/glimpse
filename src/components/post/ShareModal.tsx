import { useState } from 'react';
import { useActions, useDb, useUI } from '../../store/AppStore';
import { searchUsers } from '../../store/selectors';
import { CheckIcon, CloseIcon, LinkIcon } from '../icons/Icons';
import { Avatar } from '../common/Avatar';
import { Modal } from '../common/Modal';
import { SearchInput } from '../panels/SearchPanel';

/** "Share" sheet: send a post to one or more people by direct message. */
export function ShareModal() {
  const db = useDb();
  const { shareTarget, setShareTarget, toast } = useUI();
  const { openConversation, sendMessage } = useActions();
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [note, setNote] = useState('');
  if (!shareTarget) return null;

  const close = () => { setShareTarget(null); setPicked([]); setQ(''); setNote(''); };
  const recent = db.conversations.map((c) => db.users[c.participantId]);
  const people = q ? searchUsers(db, q).filter((u) => u.id !== db.meId)
    : [...new Map([...recent, ...db.followingIds.map((id) => db.users[id])].filter(Boolean).map((u) => [u.id, u])).values()];
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const send = () => {
    for (const id of picked) {
      const conv = openConversation(id);
      sendMessage(conv, '', shareTarget);
      if (note.trim()) sendMessage(conv, note);
    }
    toast(picked.length === 1 ? `Sent to ${picked[0]}` : `Sent to ${picked.length} people`);
    close();
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${location.origin}${location.pathname}#/p/${shareTarget}`);
      toast('Link copied to clipboard');
    } catch {
      toast('Couldn’t copy link');
    }
  };

  return (
    <Modal onClose={close} className="share-modal" label="Share">
      <header className="modal-head">
        <span className="icon-btn-spacer" />
        <h2>Share</h2>
        <button className="icon-btn" onClick={close} aria-label="Close"><CloseIcon size={20} /></button>
      </header>
      <div className="share-search"><SearchInput value={q} onChange={setQ} /></div>
      <div className="share-grid">
        {people.slice(0, 24).map((u) => (
          <button key={u.id} className={`share-person ${picked.includes(u.id) ? 'picked' : ''}`} onClick={() => toggle(u.id)}>
            <span className="share-avatar">
              <Avatar user={u} size={72} />
              {picked.includes(u.id) && <span className="share-check"><CheckIcon size={14} strokeWidth={3} /></span>}
            </span>
            <span className="share-name">{u.fullName}</span>
          </button>
        ))}
        {people.length === 0 && <p className="empty-note">No account found.</p>}
      </div>
      <footer className="share-foot">
        {picked.length > 0 ? (
          <>
            <input className="plain-input" placeholder="Write a message…" value={note} onChange={(e) => setNote(e.target.value)} />
            <button className="btn btn-primary btn-block" onClick={send}>{picked.length > 1 ? 'Send separately' : 'Send'}</button>
          </>
        ) : (
          <button className="share-copy" onClick={copy}><span className="share-copy-icon"><LinkIcon size={22} /></span>Copy link</button>
        )}
      </footer>
    </Modal>
  );
}

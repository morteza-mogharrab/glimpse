import { Fragment, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Conversation, Message } from '../types';
import { useActions, useDb, useMe, useUI } from '../store/AppStore';
import { searchUsers } from '../store/selectors';
import { useIsMobile, useOpenPost } from '../hooks';
import { chatStamp, timeShort } from '../utils/format';
import {
  BackIcon, ChevronDown, CloseIcon, EditIcon, EmojiIcon, HeartIcon, ImageIcon, InfoIcon, MicIcon, PhoneIcon, SendIcon, VideoIcon,
} from '../components/icons/Icons';
import { Avatar } from '../components/common/Avatar';
import { Modal } from '../components/common/Modal';
import { EmojiPicker } from '../components/post/PostParts';
import { SearchInput } from '../components/panels/SearchPanel';
import { VerifiedBadge } from '../components/icons/Icons';

function lastLine(db: ReturnType<typeof useDb>, c: Conversation) {
  const m = c.messages[c.messages.length - 1];
  if (!m) return 'Start a conversation';
  const who = m.senderId === db.meId ? 'You: ' : '';
  return `${who}${m.postId && !m.text ? 'Sent a post' : m.text}`;
}

function NewMessageModal({ onClose }: { onClose(): void }) {
  const db = useDb();
  const navigate = useNavigate();
  const { openConversation } = useActions();
  const [q, setQ] = useState('');
  const people = (q ? searchUsers(db, q) : db.followingIds.map((id) => db.users[id])).filter((u) => u && u.id !== db.meId);
  return (
    <Modal onClose={onClose} className="share-modal" label="New message">
      <header className="modal-head">
        <span className="icon-btn-spacer" />
        <h2>New message</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Close"><CloseIcon size={20} /></button>
      </header>
      <div className="share-search"><SearchInput value={q} onChange={setQ} autoFocus /></div>
      <div className="new-msg-list">
        {people.map((u) => (
          <button key={u.id} className="user-row as-btn" onClick={() => { onClose(); navigate(`/direct/t/${openConversation(u.id)}`); }}>
            <span className="user-row-main">
              <Avatar user={u} size={44} />
              <span className="user-row-text">
                <span className="user-row-name">{u.fullName}</span>
                <span className="user-row-sub">{u.username}</span>
              </span>
            </span>
          </button>
        ))}
        {people.length === 0 && <p className="empty-note">No account found.</p>}
      </div>
    </Modal>
  );
}

function Inbox({ activeId, onNew }: { activeId?: string; onNew(): void }) {
  const db = useDb();
  const me = useMe();
  const { typing } = useUI();
  const [tab, setTab] = useState<'primary' | 'requests'>('primary');
  return (
    <aside className="inbox">
      <header className="inbox-head">
        <span className="inbox-me">{me.username} <ChevronDown size={16} /></span>
        <button className="icon-btn" onClick={onNew} aria-label="New message"><EditIcon /></button>
      </header>
      <div className="inbox-notes">
        <div className="note">
          <span className="note-bubble muted">Your note</span>
          <Avatar user={me} size={64} />
          <span className="muted small">Your note</span>
        </div>
        {db.conversations.slice(0, 3).map((c) => {
          const u = db.users[c.participantId];
          return (
            <div className="note" key={c.id}>
              <span className="note-bubble">{['🎞️ film day', 'need coffee', 'hike Sat?'][db.conversations.indexOf(c) % 3]}</span>
              <Avatar user={u} size={64} />
              <span className="small ellipsis">{u.fullName.split(' ')[0]}</span>
            </div>
          );
        })}
      </div>
      <div className="inbox-tabs">
        <button className={tab === 'primary' ? 'on' : ''} onClick={() => setTab('primary')}>Messages</button>
        <button className={tab === 'requests' ? 'on' : ''} onClick={() => setTab('requests')}>Requests</button>
      </div>
      <div className="inbox-list">
        {tab === 'requests' && <p className="empty-note center">No message requests.</p>}
        {tab === 'primary' && db.conversations.map((c) => {
          const u = db.users[c.participantId];
          const last = c.messages[c.messages.length - 1];
          return (
            <Link key={c.id} to={`/direct/t/${c.id}`} className={`inbox-row ${c.id === activeId ? 'active' : ''} ${c.unread ? 'unread' : ''}`}>
              <Avatar user={u} size={56} />
              <span className="inbox-text">
                <span className="inbox-name">{u.fullName}</span>
                <span className="inbox-last">
                  {typing[c.id] ? <em>Typing…</em> : <span className="ellipsis">{lastLine(db, c)}</span>}
                  {last && <span className="muted nowrap">{'\u00a0·\u00a0'}{timeShort(last.createdAt)}</span>}
                </span>
              </span>
              {c.unread && <span className="unread-dot" aria-label="Unread" />}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

function SharedPost({ postId }: { postId: string }) {
  const db = useDb();
  const openPost = useOpenPost();
  const p = db.posts[postId];
  if (!p) return <div className="dm-post missing">Post unavailable</div>;
  const a = db.users[p.authorId];
  return (
    <button className="dm-post" onClick={() => openPost(p.id)}>
      <span className="dm-post-head"><img src={a.avatar} alt="" className="avatar-img" width={24} height={24} />{a.username}</span>
      <img src={p.media[0].thumb ?? p.media[0].src} alt="" className="dm-post-img" style={{ filter: p.filter }} />
      {p.caption && <span className="dm-post-cap"><strong>{a.username}</strong> {p.caption}</span>}
    </button>
  );
}

function Thread({ conv }: { conv: Conversation }) {
  const db = useDb();
  const isMobile = useIsMobile();
  const { sendMessage, markConversationRead, likeMessage } = useActions();
  const { typing } = useUI();
  const [text, setText] = useState('');
  const [emoji, setEmoji] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const u = db.users[conv.participantId];

  useEffect(() => { markConversationRead(conv.id); }, [conv.id, conv.messages.length, markConversationRead]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [conv.messages.length, typing[conv.id]]);

  const send = (t = text) => { if (!t.trim()) return; sendMessage(conv.id, t); setText(''); };

  const rows: (Message & { stamp?: string })[] = conv.messages.map((m, k) => {
    const prev = conv.messages[k - 1];
    const gap = !prev || new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() > 60 * 60_000;
    return { ...m, stamp: gap ? chatStamp(m.createdAt) : undefined };
  });
  const lastMine = [...conv.messages].reverse().find((m) => m.senderId === db.meId);

  return (
    <section className="thread">
      <header className="thread-head">
        {isMobile && <Link to="/direct/inbox" className="icon-btn" aria-label="Back"><BackIcon /></Link>}
        <Link to={`/${u.username}`} className="thread-user">
          <Avatar user={u} size={44} />
          <span>
            <strong>{u.fullName}</strong>{u.verified && <VerifiedBadge />}
            <span className="muted small block">{typing[conv.id] ? 'Typing…' : u.username}</span>
          </span>
        </Link>
        <div className="thread-icons">
          <button className="icon-btn" aria-label="Audio call"><PhoneIcon /></button>
          <button className="icon-btn" aria-label="Video call"><VideoIcon /></button>
          <button className="icon-btn" aria-label="Conversation info"><InfoIcon /></button>
        </div>
      </header>
      <div className="thread-body">
        <div className="thread-intro">
          <Avatar user={u} size={96} />
          <h3>{u.fullName}</h3>
          <p className="muted">{u.username} · Glimpse</p>
          <Link to={`/${u.username}`} className="btn btn-secondary btn-sm">View profile</Link>
        </div>
        {rows.map((m, k) => {
          const mine = m.senderId === db.meId;
          const next = rows[k + 1];
          const tail = !next || next.senderId !== m.senderId || !!next.stamp;
          return (
            <Fragment key={m.id}>
              {m.stamp && <div className="thread-stamp">{m.stamp}</div>}
              <div className={`msg-row ${mine ? 'mine' : 'theirs'}`}>
                {!mine && <span className="msg-avatar">{tail && <img src={u.avatar} alt="" className="avatar-img" />}</span>}
                <div className="msg-stack" onDoubleClick={() => likeMessage(conv.id, m.id)}>
                  {m.postId && <SharedPost postId={m.postId} />}
                  {m.text && <div className={`bubble ${tail ? 'tail' : ''}`} title={chatStamp(m.createdAt)}>{m.text}</div>}
                  {m.likedByMe && <span className="msg-heart">❤️</span>}
                </div>
              </div>
              {m.id === lastMine?.id && k === rows.length - 1 && <div className="seen muted small">Seen</div>}
            </Fragment>
          );
        })}
        {typing[conv.id] && (
          <div className="msg-row theirs">
            <span className="msg-avatar"><img src={u.avatar} alt="" className="avatar-img" /></span>
            <div className="bubble typing" aria-label="Typing"><i /><i /><i /></div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <form className="thread-input" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <button type="button" className="icon-btn" onClick={() => setEmoji((x) => !x)} aria-label="Emoji"><EmojiIcon /></button>
        {emoji && <EmojiPicker onClose={() => setEmoji(false)} onPick={(e) => setText((t) => t + e)} />}
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message…" aria-label="Message" />
        {text.trim() ? (
          <button type="submit" className="text-btn blue bold">Send</button>
        ) : (
          <>
            <button type="button" className="icon-btn" aria-label="Voice message"><MicIcon /></button>
            <button type="button" className="icon-btn" aria-label="Send photo"><ImageIcon /></button>
            <button type="button" className="icon-btn" aria-label="Send a heart" onClick={() => send('❤️')}><HeartIcon /></button>
          </>
        )}
      </form>
    </section>
  );
}

export function MessagesPage() {
  const db = useDb();
  const { threadId } = useParams();
  const isMobile = useIsMobile();
  const [newOpen, setNewOpen] = useState(false);
  const conv = threadId ? db.conversations.find((c) => c.id === threadId) : undefined;

  return (
    <div className={`messages ${conv ? 'has-thread' : ''}`}>
      {(!isMobile || !conv) && <Inbox activeId={conv?.id} onNew={() => setNewOpen(true)} />}
      {conv ? <Thread key={conv.id} conv={conv} /> : !isMobile && (
        <section className="thread empty">
          <span className="empty-icon"><SendIcon size={48} strokeWidth={1.5} /></span>
          <h2>Your messages</h2>
          <p className="muted">Send private photos and messages to a friend or group.</p>
          <button className="btn btn-primary" onClick={() => setNewOpen(true)}>Send message</button>
        </section>
      )}
      {newOpen && <NewMessageModal onClose={() => setNewOpen(false)} />}
    </div>
  );
}

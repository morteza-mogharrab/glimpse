import { useMemo, useRef, useState, type DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AspectRatio, MediaItem } from '../../types';
import { useActions, useMe, useUI } from '../../store/AppStore';
import { SAMPLE_UPLOADS } from '../../data/seed';
import { downscaleImage } from '../../utils/format';
import {
  BackIcon, CheckCircle, ChevronDown, ChevronLeft, ChevronRight, CropIcon, EmojiIcon, LocationIcon, MediaDropIcon,
} from '../icons/Icons';
import { Avatar } from '../common/Avatar';
import { Confirm, Modal } from '../common/Modal';
import { EmojiPicker } from '../post/PostParts';

type Step = 'select' | 'crop' | 'edit' | 'caption' | 'sharing' | 'done';

const FILTERS: { name: string; css: string }[] = [
  { name: 'Original', css: '' },
  { name: 'Vivid', css: 'saturate(1.45) contrast(1.08)' },
  { name: 'Warm', css: 'sepia(.25) saturate(1.3) hue-rotate(-8deg)' },
  { name: 'Cool', css: 'saturate(1.1) hue-rotate(12deg) brightness(1.03)' },
  { name: 'Fade', css: 'contrast(.82) brightness(1.1) saturate(.85)' },
  { name: 'Golden', css: 'sepia(.35) brightness(1.06) contrast(1.05)' },
  { name: 'Mono', css: 'grayscale(1)' },
  { name: 'Noir', css: 'grayscale(1) contrast(1.35) brightness(.92)' },
  { name: 'Retro', css: 'sepia(.5) contrast(.9) saturate(1.2)' },
  { name: 'Bloom', css: 'brightness(1.12) saturate(1.2) contrast(.95)' },
  { name: 'Dusk', css: 'hue-rotate(-14deg) saturate(1.25) brightness(.95)' },
  { name: 'Crisp', css: 'contrast(1.25) saturate(1.15)' },
];

const ASPECTS: { key: AspectRatio | 'original'; label: string }[] = [
  { key: 'original', label: 'Original' }, { key: '1:1', label: '1:1' }, { key: '4:5', label: '4:5' }, { key: '16:9', label: '16:9' },
];
const RATIO: Record<AspectRatio, string> = { '1:1': '1 / 1', '4:5': '4 / 5', '16:9': '16 / 9' };

interface Adjust { brightness: number; contrast: number; saturate: number; warmth: number; fade: number }
const ZERO: Adjust = { brightness: 0, contrast: 0, saturate: 0, warmth: 0, fade: 0 };

function adjustCss(a: Adjust) {
  const parts: string[] = [];
  if (a.brightness) parts.push(`brightness(${1 + a.brightness / 200})`);
  if (a.contrast || a.fade) parts.push(`contrast(${1 + a.contrast / 200 - a.fade / 300})`);
  if (a.saturate) parts.push(`saturate(${1 + a.saturate / 100})`);
  if (a.warmth > 0) parts.push(`sepia(${a.warmth / 250})`);
  if (a.warmth < 0) parts.push(`hue-rotate(${a.warmth / 6}deg)`);
  if (a.fade) parts.push(`brightness(${1 + a.fade / 400})`);
  return parts.join(' ');
}

export function CreatePostModal() {
  const me = useMe();
  const navigate = useNavigate();
  const { setCreateOpen, toast } = useUI();
  const { createPost } = useActions();
  const [step, setStep] = useState<Step>('select');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [aspect, setAspect] = useState<AspectRatio | 'original'>('1:1');
  const [aspectMenu, setAspectMenu] = useState(false);
  const [filter, setFilter] = useState(0);
  const [tab, setTab] = useState<'filters' | 'adjust'>('filters');
  const [adj, setAdj] = useState<Adjust>(ZERO);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [alt, setAlt] = useState('');
  const [hideLikes, setHideLikes] = useState(false);
  const [commentsOff, setCommentsOff] = useState(false);
  const [emoji, setEmoji] = useState(false);
  const [drag, setDrag] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [newId, setNewId] = useState<string>();
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const css = useMemo(() => [FILTERS[filter].css, adjustCss(adj)].filter(Boolean).join(' '), [filter, adj]);
  const resolvedAspect: AspectRatio = aspect === 'original' ? '4:5' : aspect;
  const close = () => setCreateOpen(false);
  const requestClose = () => (media.length && step !== 'done' ? setDiscard(true) : close());

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/')).slice(0, 10);
    if (!list.length) { setError('This file is not supported. Please choose a photo.'); return; }
    setError('');
    try {
      const srcs = await Promise.all(list.map((f) => downscaleImage(f)));
      setMedia(srcs.map((src) => ({ src, thumb: src })));
      setIdx(0);
      setStep('crop');
    } catch {
      setError('Something went wrong reading that file.');
    }
  };
  const onDrop = (e: DragEvent) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); };

  const share = () => {
    setStep('sharing');
    setTimeout(() => {
      const id = createPost({
        media: media.map((m) => ({ ...m, alt: alt || undefined })),
        caption: caption.trim(), location: location.trim() || undefined, aspect: resolvedAspect,
        filter: css || undefined, hideLikes, commentsOff,
      });
      setNewId(id);
      setStep('done');
    }, 1100);
  };

  const back = () => setStep(step === 'caption' ? 'edit' : step === 'edit' ? 'crop' : 'select');
  const next = () => setStep(step === 'crop' ? 'edit' : 'caption');
  const titles: Record<Step, string> = {
    select: 'Create new post', crop: 'Crop', edit: 'Edit', caption: 'Create new post', sharing: 'Sharing', done: 'Post shared',
  };
  const wide = step === 'edit' || step === 'caption';

  const preview = media[idx] && (
    <div className="create-preview">
      <div className={`create-frame ${resolvedAspect === '16:9' ? 'landscape' : ''}`} style={{ aspectRatio: RATIO[resolvedAspect] }}>
        <img src={media[idx].src} alt="" style={{ filter: step === 'crop' ? undefined : css, objectFit: aspect === 'original' ? 'contain' : 'cover' }} />
        {step === 'crop' && <div className="crop-grid" aria-hidden="true" />}
      </div>
      {idx > 0 && <button className="carousel-btn prev" onClick={() => setIdx(idx - 1)} aria-label="Previous"><ChevronLeft size={16} strokeWidth={3} /></button>}
      {idx < media.length - 1 && <button className="carousel-btn next" onClick={() => setIdx(idx + 1)} aria-label="Next"><ChevronRight size={16} strokeWidth={3} /></button>}
      {media.length > 1 && <div className="carousel-dots on-image">{media.map((_, k) => <span key={k} className={k === idx ? 'on' : ''} />)}</div>}
      {step === 'crop' && (
        <div className="crop-tools">
          <button className="crop-btn" onClick={() => setAspectMenu((x) => !x)} aria-label="Select crop"><CropIcon size={16} /></button>
          {aspectMenu && (
            <div className="aspect-menu">
              {ASPECTS.map((a) => (
                <button key={a.key} className={aspect === a.key ? 'on' : ''} onClick={() => { setAspect(a.key); setAspectMenu(false); }}>{a.label}</button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      <Modal onClose={requestClose} closeButton className={`create-modal ${wide ? 'wide' : ''}`} label="Create new post" dim="heavy">
        <header className="modal-head">
          {['crop', 'edit', 'caption'].includes(step)
            ? <button className="icon-btn" onClick={back} aria-label="Back"><BackIcon /></button>
            : <span className="icon-btn-spacer" />}
          <h2>{titles[step]}</h2>
          {step === 'crop' || step === 'edit' ? <button className="text-btn blue bold" onClick={next}>Next</button>
            : step === 'caption' ? <button className="text-btn blue bold" onClick={share}>Share</button>
              : <span className="icon-btn-spacer" />}
        </header>

        {step === 'select' && (
          <div className={`create-drop ${drag ? 'drag' : ''}`} onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)} onDrop={onDrop}>
            <MediaDropIcon size={96} />
            <p className="create-drop-title">{error || 'Drag photos here'}</p>
            <button className="btn btn-primary" onClick={() => fileRef.current?.click()}>Select from computer</button>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && addFiles(e.target.files)} />
            <div className="sample-picks">
              <p className="muted small">or try a sample photo</p>
              <div className="sample-row">
                {SAMPLE_UPLOADS.map((m) => (
                  <button key={m.src} onClick={() => { setMedia([m]); setIdx(0); setStep('crop'); }} aria-label="Use sample photo">
                    <img src={m.thumb} alt="" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'crop' && <div className="create-body">{preview}</div>}

        {step === 'edit' && (
          <div className="create-body split">
            {preview}
            <div className="create-side">
              <div className="edit-tabs">
                <button className={tab === 'filters' ? 'on' : ''} onClick={() => setTab('filters')}>Filters</button>
                <button className={tab === 'adjust' ? 'on' : ''} onClick={() => setTab('adjust')}>Adjustments</button>
              </div>
              {tab === 'filters' ? (
                <div className="filter-grid">
                  {FILTERS.map((f, k) => (
                    <button key={f.name} className={`filter-tile ${filter === k ? 'on' : ''}`} onClick={() => setFilter(k)}>
                      <img src={media[idx].thumb ?? media[idx].src} alt="" style={{ filter: f.css }} />
                      <span>{f.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="adjust-list">
                  {(Object.keys(ZERO) as (keyof Adjust)[]).map((k) => (
                    <label key={k} className="adjust-row">
                      <span className="adjust-head">
                        <span>{{ brightness: 'Brightness', contrast: 'Contrast', saturate: 'Saturation', warmth: 'Temperature', fade: 'Fade' }[k]}</span>
                        {adj[k] !== 0 && <button className="text-btn blue small" onClick={(e) => { e.preventDefault(); setAdj({ ...adj, [k]: 0 }); }}>Reset</button>}
                      </span>
                      <span className="adjust-slider">
                        <input type="range" min={k === 'fade' ? 0 : -100} max={100} value={adj[k]} onChange={(e) => setAdj({ ...adj, [k]: +e.target.value })} />
                        <span className="adjust-val">{adj[k]}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'caption' && (
          <div className="create-body split">
            {preview}
            <div className="create-side caption-side">
              <div className="caption-user"><Avatar user={me} size={28} /><strong>{me.username}</strong></div>
              <textarea className="caption-box" value={caption} onChange={(e) => setCaption(e.target.value.slice(0, 2200))}
                placeholder="Write a caption…" autoFocus aria-label="Caption" />
              <div className="caption-tools">
                <button className="icon-btn muted" onClick={() => setEmoji((x) => !x)} aria-label="Emoji"><EmojiIcon size={20} /></button>
                <span className="muted small">{caption.length.toLocaleString()}/2,200</span>
                {emoji && <EmojiPicker onClose={() => setEmoji(false)} onPick={(e) => setCaption((c) => c + e)} />}
              </div>
              <label className="caption-field">
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Add location" />
                <LocationIcon size={16} />
              </label>
              <details className="caption-field details">
                <summary>Accessibility <ChevronDown size={16} /></summary>
                <p className="muted small">Alt text describes your photos for people with visual impairments.</p>
                <input className="plain-input" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Write alt text…" />
              </details>
              <details className="caption-field details">
                <summary>Advanced settings <ChevronDown size={16} /></summary>
                <label className="switch-row">
                  <span>Hide like and view counts on this post</span>
                  <input type="checkbox" className="switch" checked={hideLikes} onChange={(e) => setHideLikes(e.target.checked)} />
                </label>
                <label className="switch-row">
                  <span>Turn off commenting</span>
                  <input type="checkbox" className="switch" checked={commentsOff} onChange={(e) => setCommentsOff(e.target.checked)} />
                </label>
              </details>
            </div>
          </div>
        )}

        {step === 'sharing' && (
          <div className="create-status"><span className="spinner-ring" aria-label="Sharing" /></div>
        )}
        {step === 'done' && (
          <div className="create-status">
            <CheckCircle size={96} />
            <p className="create-drop-title">Your post has been shared.</p>
            <button className="btn btn-primary" onClick={() => { close(); navigate(`/${me.username}`); if (newId) toast('Your post is live'); }}>View on profile</button>
          </div>
        )}
      </Modal>
      {discard && (
        <Confirm title="Discard post?" body="If you leave, your edits won't be saved." confirmLabel="Discard"
          onClose={() => setDiscard(false)} onConfirm={close} />
      )}
    </>
  );
}


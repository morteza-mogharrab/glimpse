import { useEffect, useRef, useState } from 'react';
import { useActions, useDb, useMe, useUI } from '../../store/AppStore';
import { hasUnseenStory, orderedStories } from '../../store/selectors';
import { downscaleImage } from '../../utils/format';
import { ChevronLeft, ChevronRight, PlusIcon } from '../icons/Icons';

/** Horizontal row of story avatars at the top of the home feed. */
export function StoriesBar() {
  const db = useDb();
  const me = useMe();
  const { openStories, toast } = useUI();
  const { addStory } = useActions();
  const stories = orderedStories(db);
  const mine = stories.find((s) => s.userId === me.id);
  const others = stories.filter((s) => s.userId !== me.id);
  const scroller = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [edges, setEdges] = useState({ left: false, right: true });

  const update = () => {
    const el = scroller.current;
    if (!el) return;
    setEdges({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  };
  useEffect(update, [stories.length]);
  const scroll = (dir: 1 | -1) => scroller.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });

  // Play every story in bar order starting from the clicked one.
  const playFrom = (storyId: string) => {
    const ids = stories.map((s) => s.id);
    openStories({ storyIds: ids, startIndex: ids.indexOf(storyId) });
  };

  const onFile = async (f?: File) => {
    if (!f) return;
    try {
      const src = await downscaleImage(f);
      addStory({ src, thumb: src });
    } catch {
      toast('That file couldn’t be used. Try a JPG or PNG.');
    }
  };

  return (
    <div className="stories-wrap">
      {edges.left && <button className="stories-arrow left" onClick={() => scroll(-1)} aria-label="Scroll stories left"><ChevronLeft size={14} strokeWidth={3} /></button>}
      <div className="stories" ref={scroller} onScroll={update}>
        <div className="story">
          {mine ? (
            <button className={`avatar ${hasUnseenStory(mine) ? 'ring-unseen' : 'ring-seen'}`} style={{ width: 66, height: 66, padding: 3 }}
              onClick={() => playFrom(mine.id)} aria-label="Your story">
              <span className="avatar-inner"><img className="avatar-img" src={me.avatar} alt="" width={58} height={58} /></span>
            </button>
          ) : (
            <button className="story-add" onClick={() => fileRef.current?.click()} aria-label="Add to your story">
              <img className="avatar-img" src={me.avatar} alt="" width={58} height={58} />
              <span className="story-plus"><PlusIcon size={12} strokeWidth={3} /></span>
            </button>
          )}
          <span className="story-name muted">Your story</span>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
        </div>
        {others.map((s) => {
          const u = db.users[s.userId];
          return (
            <div className="story" key={s.id}>
              <button className={`avatar ${hasUnseenStory(s) ? 'ring-unseen' : 'ring-seen'}`} style={{ width: 66, height: 66, padding: 3 }}
                onClick={() => playFrom(s.id)} aria-label={`Story by ${u.username}`}>
                <span className="avatar-inner"><img className="avatar-img" src={u.avatar} alt="" width={58} height={58} loading="lazy" /></span>
              </button>
              <span className={`story-name ${hasUnseenStory(s) ? '' : 'muted'}`}>{u.username}</span>
            </div>
          );
        })}
      </div>
      {edges.right && <button className="stories-arrow right" onClick={() => scroll(1)} aria-label="Scroll stories right"><ChevronRight size={14} strokeWidth={3} /></button>}
    </div>
  );
}

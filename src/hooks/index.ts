import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ID } from '../types';
import { useUI } from '../store/AppStore';

export function useMediaQuery(query: string): boolean {
  const get = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatches(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return matches;
}

export const useIsMobile = () => useMediaQuery('(max-width: 767px)');

/** Opens a post in the modal on larger screens, or as a page on phones. */
export function useOpenPost() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { openPost } = useUI();
  return useCallback((postId: ID, list?: ID[]) => {
    if (isMobile) navigate(`/p/${postId}`);
    else openPost(postId, list);
  }, [isMobile, navigate, openPost]);
}

/** Distinguishes single from double clicks/taps on media. */
export function useDoubleTap(onDouble: () => void, onSingle?: () => void, delay = 260) {
  const timer = useRef<number | undefined>(undefined);
  return useCallback(() => {
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = undefined;
      onDouble();
    } else {
      timer.current = window.setTimeout(() => {
        timer.current = undefined;
        onSingle?.();
      }, delay);
    }
  }, [onDouble, onSingle, delay]);
}

export function useClickOutside<T extends HTMLElement>(onOutside: () => void, active = true) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!active) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onOutside, active]);
  return ref;
}

/** Calls `onVisible` when the sentinel element scrolls into view. */
export function useInfiniteScroll(onVisible: () => void, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onVisible);
  cb.current = onVisible;
  useEffect(() => {
    if (!enabled || !ref.current) return;
    const io = new IntersectionObserver((entries) => entries[0].isIntersecting && cb.current(), { rootMargin: '600px' });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [enabled]);
  return ref;
}

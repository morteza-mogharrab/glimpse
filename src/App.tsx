import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider, useMaybeDb, useUI } from './store/AppStore';
import { useIsMobile } from './hooks';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/MobileNav';
import { PostModal } from './components/post/PostModal';
import { ShareModal } from './components/post/ShareModal';
import { StoryViewer } from './components/stories/StoryViewer';
import { CreatePostModal } from './components/create/CreatePostModal';
import { Toasts } from './components/common/UserBits';
import { LogoMark } from './components/icons/Icons';
import { HomePage } from './pages/HomePage';
import { ExplorePage, PeoplePage } from './pages/ExplorePage';
import { ReelsPage } from './pages/ReelsPage';
import { MessagesPage } from './pages/MessagesPage';
import { ProfilePage } from './pages/ProfilePage';
import { EditProfilePage, NotificationsPage, PostPage } from './pages/MiscPages';

function Splash() {
  return (
    <div className="splash" aria-label="Loading">
      <LogoMark size={72} />
      <p className="splash-from">sample app</p>
    </div>
  );
}

function ScrollReset() {
  const { pathname } = useLocation();
  const { setPanel, closePost } = useUI();
  useEffect(() => {
    window.scrollTo(0, 0);
    setPanel(null);
    closePost();
  }, [pathname, setPanel, closePost]);
  return null;
}

function Shell() {
  const db = useMaybeDb();
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const { storyViewer, createOpen } = useUI();
  if (!db) return <Splash />;

  return (
    <div className={`app ${pathname.startsWith('/direct') ? 'is-direct' : ''}`}>
      <ScrollReset />
      {!isMobile && <Sidebar />}
      <main className="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/explore/people" element={<PeoplePage />} />
          <Route path="/reels" element={<ReelsPage />} />
          <Route path="/direct" element={<Navigate to="/direct/inbox" replace />} />
          <Route path="/direct/inbox" element={<MessagesPage />} />
          <Route path="/direct/t/:threadId" element={<MessagesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/accounts/edit" element={<EditProfilePage />} />
          <Route path="/p/:postId" element={<PostPage />} />
          <Route path="/:username" element={<ProfilePage tab="posts" />} />
          <Route path="/:username/reels" element={<ProfilePage tab="reels" />} />
          <Route path="/:username/saved" element={<ProfilePage tab="saved" />} />
          <Route path="/:username/tagged" element={<ProfilePage tab="tagged" />} />
        </Routes>
      </main>
      {isMobile && !pathname.startsWith('/direct/t/') && <BottomNav />}
      <PostModal />
      <ShareModal />
      {createOpen && <CreatePostModal />}
      {storyViewer && <StoryViewer key={`${storyViewer.highlight?.id ?? storyViewer.storyIds?.join()}-${storyViewer.startIndex}`} />}
      <Toasts />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Shell />
      </HashRouter>
    </AppProvider>
  );
}

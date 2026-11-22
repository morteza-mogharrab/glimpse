import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/base.css';
import './styles/layout.css';
import './styles/feed.css';
import './styles/post.css';
import './styles/stories.css';
import './styles/pages.css';
import './styles/create.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

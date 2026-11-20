import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

(window as { __VIBE_CHECK_MOUNTED__?: boolean }).__VIBE_CHECK_MOUNTED__ = true;

createRoot(document.getElementById('root')!).render(<App />);

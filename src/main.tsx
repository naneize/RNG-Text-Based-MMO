import './utils/storageFallback' // ต้องนำหน้าทุก import — กัน crash ใน iframe แบบ sandbox (itch/CrazyGames) ที่ localStorage ถูกบล็อก
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { auth } from './firebase';
console.log('Firebase auth object:', auth);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

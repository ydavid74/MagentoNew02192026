import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Note: QueryClient is configured in App.tsx
// This file only handles the root DOM rendering

createRoot(document.getElementById("root")!).render(
    <App />
);

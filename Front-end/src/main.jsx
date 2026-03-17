import React from 'react'
import "./index.css";

import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: { background: '#0f172a', color: '#e2e8f0', border: '1px solid rgba(51, 65, 85, 0.8)' },
      }}
    />
  </React.StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './null.scss'
import App from './App.jsx'

import { configure } from 'mobx';

configure({
  enforceActions: 'never'
});


createRoot(document.getElementById('root')).render(
  // <StrictMode>
  <App />
  // </StrictMode>,
)

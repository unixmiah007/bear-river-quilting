import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import BackToTop from './components/BackToTop.jsx';
import FloatingCartWidget from './components/FloatingCartWidget.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { FavoritesProvider } from './context/FavoritesContext.jsx';
import RootErrorBoundary from './RootErrorBoundary.jsx';
import './index.css';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Missing #root element in index.html');
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <BrowserRouter>
        <CartProvider>
          <FavoritesProvider>
            <App />
            <FloatingCartWidget />
            <BackToTop />
          </FavoritesProvider>
        </CartProvider>
      </BrowserRouter>
    </RootErrorBoundary>
  </React.StrictMode>
);

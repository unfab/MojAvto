import React from 'react';
import ReactDOM from 'react-dom/client';
import AdvancedSearch from './pages/AdvancedSearch';

let root = null;

export function mountReactSearch(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Clear existing HTML content before mounting React
  container.innerHTML = '';
  
  // Unmount previous if exists to prevent memory leaks
  if (root) {
    root.unmount();
  }

  root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <AdvancedSearch />
    </React.StrictMode>
  );

  // Expose globally for synchronous unmounting by the router
  window.unmountReactSearch = () => {
    if (root) {
      root.unmount();
      root = null;
    }
  };
}

export function unmountReactSearch() {
  if (window.unmountReactSearch) {
    window.unmountReactSearch();
    delete window.unmountReactSearch;
  }
}

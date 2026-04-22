import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { onAuth } from './auth/auth';
import AdvancedSearch from './pages/AdvancedSearch';

// Ovojnica za komponente
const Layout = ({ children }) => {
  return (
    <>
      <header className="site-header" style={{ padding: '20px', background: '#333', color: 'white', display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>MojAvto.si</Link>
        <Link to="/search" style={{ color: 'white', textDecoration: 'none' }}>Iskalnik</Link>
        <Link to="/create" style={{ color: 'white', textDecoration: 'none' }}>Dodaj Oglas</Link>
      </header>
      <main>
        {children}
      </main>
      <footer style={{ padding: '40px 20px', background: '#f8f9fa', color: '#666', marginTop: '60px', textAlign: 'center', borderTop: '1px solid #eee' }}>
        &copy; 2026 MojAvto.si — Vse pravice pridržane.
      </footer>
    </>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Spremljanje Firebase avtentikacije (trenutni onAuth)
    onAuth((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>Nalaganje aplikacije...</div>;

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<div style={{ padding: '40px', textAlign: 'center' }}><h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Najdi svoj naslednji avto</h1><p style={{ color: '#666', fontSize: '1.2rem' }}>Dobrodošli na posodobljeni platformi MojAvto.si</p></div>} />
          <Route path="/search" element={<AdvancedSearch />} />
          <Route path="/create" element={<div style={{ padding: '40px' }}><h2>Dodaj Oglas</h2><p>Obrazec za vnos vozila prihaja kmalu.</p></div>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

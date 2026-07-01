import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { AuthCallback } from './pages/AuthCallback';
import { useApp } from './contexts/AppContext';
import { useEffect } from 'react';

function AppRoutes() {
  const { initializeApp } = useApp();
  
  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/*" element={<Layout />}>
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

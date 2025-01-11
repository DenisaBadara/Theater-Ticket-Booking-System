import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import LoginForm from './Components/LoginForm/LoginForm';
import RegisterForm from './Components/RegisterForm/RegisterForm';
import SpectacolePage from './Components/FirstPage/Spectacole'; // Asigură-te că importul este corect
import Rezervare from './Components/Rezervare/Rezervare';
import RezervariMele from './Components/RezervarileMele/RezervarileMele';
import DetaliiSpectacol from './Components/DetaliiSpectacol/DetaliiSpectacol';

import './App.css';

function AppWrapper() {
  const location = useLocation();
  const routeClassMap = {
    '/spectacole': 'spectacole-page',
    '/register': 'register-page',
    '/login': 'login-page',
    // Poți adăuga mai multe rute și clase dacă este necesar
  };

  const pageClass = routeClassMap[location.pathname] || 'default-page';

  return (
    <div className={pageClass}>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/spectacole" element={<SpectacolePage />} />
        <Route path="/rezervare/:spectacolId" element={<Rezervare />} />
        <Route path="/rezervarile-mele" element={<RezervariMele />} />
        <Route path="/spectacole/:id" element={<DetaliiSpectacol />} />
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}

export default App;

// src/FirstPage/FirstPage.jsx
import React, { useState } from 'react';
import LoginForm from '../LoginForm/LoginForm';
import Spectacole from '../FirstPage/Spectacole'; 

const FirstPage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);  // Setează utilizatorul ca logat
  };

  return (
    <div>
      {!isLoggedIn ? (
        <LoginForm onLoginSuccess={handleLoginSuccess} />  // Afișează formularul de login
      ) : (
        <Spectacole /> 
      )}
    </div>
  );
};

export default FirstPage;

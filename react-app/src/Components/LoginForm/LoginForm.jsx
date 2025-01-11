import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LoginForm.css';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('http://localhost:5001/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess('Autentificare reușită!');
        // Verifică dacă sesiunea a fost creată
        const sessionCheck = await fetch('http://localhost:5001/user-details', {
          credentials: 'include'
        });
        
        if (sessionCheck.ok) {
          navigate('/spectacole');
        } else {
          setError('Eroare la crearea sesiunii');
        }
      } else {
        setError(data.message || 'Username sau parola incorecte');
      }
    } catch (error) {
      console.error('Eroare la autentificare:', error);
      setError('Eroare la conectarea la server');
    }
  };

  return (
    <div className='wrapper'>
      <form onSubmit={handleSubmit}>
        <h1>Login</h1>
        <div className="input-box">
          <input
            type="text"
            placeholder="Username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="input-box">
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit">Login</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}

        <div className="register-link">
          <p>Nu ai un cont? <Link to="/register">Register</Link></p>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;

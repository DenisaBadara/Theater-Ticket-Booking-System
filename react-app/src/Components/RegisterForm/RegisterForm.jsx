
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../LoginForm/LoginForm.css'; 

const RegisterForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const response = await fetch('http://localhost:5001/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();
      console.log(result);

      if (response.ok) {
        setSuccess('Înregistrare reușită! Te poți autentifica acum.');
        setUsername('');
        setPassword('');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else if (response.status === 409) {
        setError('Utilizatorul există deja. Te rugăm să alegi alt nume.');
      } else {
        setError(result.message || 'Eroare la înregistrare');
      }
    } catch (error) {
      console.error('Eroare la înregistrare:', error);
      setError('A apărut o eroare la conectarea la server. Te rugăm să încerci din nou.');
    }
  };

  return (
    <div className='wrapper'>
      <form onSubmit={handleRegister}>
        <h1>Register</h1>
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
        <button type="submit">Register</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}
      </form>
    </div>
  );
};

export default RegisterForm;

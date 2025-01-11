import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../Contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import '../Cont/Cont.css';

const Cont = () => {
  const { user } = useContext(UserContext);
  const [contInfo, setContInfo] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [updatedDetails, setUpdatedDetails] = useState({
    username: '',
    password: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchContInfo = async () => {
      if (!user.token) {
        setError('Nu ești autentificat.');
        return;
      }

      try {
        const response = await fetch('http://localhost:5001/user-details', {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'x-access-token': user.token
          },
          credentials: 'include'
        });

        const result = await response.json();

        if (response.ok) {
          setContInfo(result);
          setUpdatedDetails({
            username: result.username || '',
            password: '' // Nu setăm parola din backend
          });
        } else {
          setError(result.message || 'Eroare la obținerea informațiilor contului.');
        }
      } catch (error) {
        console.error('Eroare la obținerea contului:', error);
        setError('A apărut o eroare la conectarea la server. Te rugăm să încerci din nou.');
      }
    };

    fetchContInfo();
  }, [user.token]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        username: updatedDetails.username
      };
      if (updatedDetails.password) {
        payload.password = updatedDetails.password;
      }

      const response = await fetch('http://localhost:5001/update-user', {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setSuccess('Datele au fost actualizate cu succes!');
        setError('');
        setTimeout(() => {
          navigate('/spectacole');
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.message || 'Eroare la actualizarea datelor');
        setSuccess('');
      }
    } catch (error) {
      console.error('Eroare la actualizare:', error);
      setError('Eroare la conectarea la server');
      setSuccess('');
    }
  };

  return (
    <div className="cont-container">
      <h2>Contul Meu</h2>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      {contInfo ? (
        <form onSubmit={handleUpdate}>
          <div className="input-group">
            <label>Username</label>
            <input
              type="text"
              value={updatedDetails.username}
              onChange={(e) => setUpdatedDetails({
                ...updatedDetails,
                username: e.target.value
              })}
              required
            />
          </div>
          <div className="input-group">
            <label>Parola (lăsați golă dacă nu doriți să o schimbați)</label>
            <input
              type="password"
              value={updatedDetails.password}
              onChange={(e) => setUpdatedDetails({
                ...updatedDetails,
                password: e.target.value
              })}
            />
          </div>
          <div className="buttons-container">
              <button type="submit" className="cont-button">Actualizează</button>
              <button type="button" className="cont-button" onClick={() => navigate('/spectacole')}>Înapoi</button>

          </div>
        </form>
      ) : (
        !error && <p>Se încarcă datele utilizatorului...</p>
      )}
    </div>
  );
};

export default Cont;

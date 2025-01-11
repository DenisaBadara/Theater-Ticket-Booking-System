import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './RezervarileMele.css';

const RezervariMele = () => {
  const [rezervari, setRezervari] = useState([]);
  const [rezervariMultiple, setRezervariMultiple] = useState([]);
  const [error, setError] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedSpectacolId, setSelectedSpectacolId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch rezervări normale
        const responseRezervari = await fetch('http://localhost:5001/rezervarile-mele', {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        // Fetch rezervări multiple
        const responseMultiple = await fetch('http://localhost:5001/rezervari-multiple-data', {
          credentials: 'include'
        });

        if (!responseRezervari.ok) {
          if (responseRezervari.status === 401) {
            setError('Sesiune expirată. Vă rugăm să vă autentificați.');
            setTimeout(() => navigate('/login'), 2000);
            return;
          }
          throw new Error('Eroare la încărcarea rezervărilor');
        }

        const dataRezervari = await responseRezervari.json();
        const dataMultiple = await responseMultiple.json();
        
        setRezervari(Array.isArray(dataRezervari) ? dataRezervari : []);
        setRezervariMultiple(Array.isArray(dataMultiple) ? dataMultiple : []);
        setError(null);
      } catch (err) {
        console.error('Eroare:', err);
        setError('Nu s-au putut încărca rezervările. Încercați din nou.');
      }
    };

    fetchData();
  }, [navigate]);

  const handleDelete = (spectacolId) => {
    setSelectedSpectacolId(spectacolId);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`http://localhost:5001/delete-rezervare/${selectedSpectacolId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Nu s-a putut anula rezervarea');
      }

      setRezervari(rezervari.filter(r => r.spectacolId !== selectedSpectacolId));
      setShowConfirmDialog(false);
      setError(null);
    } catch (err) {
      setError('Eroare la anularea rezervării');
    }
  };

  const formatTime = (timeStr) => {
    const match = timeStr.match(/(\d+):(\d+)/);
    if (match) {
      const [, hours, minutes] = match;
      return `${hours}:${minutes}`;
    }
    return timeStr;
  };

  return (
    <div className="rezervari-container">
      <h2>Rezervările Mele</h2>
      {error && (
        <div className="error-message">
          <p>{error}</p>
          {error.includes('autentificați') && (
            <button onClick={() => navigate('/login')}>
              Mergeți la autentificare
            </button>
          )}
        </div>
      )}
      
      {rezervari.length > 0 && (
        <div className="table-container">
          <table className="rezervari-table">
            <thead>
              <tr>
                <th>Spectacol</th>
                <th>Tip</th>
                <th>Sala</th>
                <th>Data rezervarii</th>
                <th>Ora rezervarii</th>
                <th>Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {rezervari.map((rezervare) => (
                <tr key={`${rezervare.spectacolId}-${rezervare.data_rezervare}`}>
                  <td>{rezervare.nume_spectacol}</td>
                  <td>{rezervare.tip_spectacol}</td>
                  <td>{rezervare.nume_sala}</td>
                  <td>{rezervare.data_rezervare}</td>
                  <td>{formatTime(rezervare.ora_rezervare)}</td>
                  <td>
                    <button 
                      className="delete-button"
                      onClick={() => handleDelete(rezervare.spectacolId)}
                    >
                      Anulează
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rezervariMultiple.length > 0 && (
        <div className="rezervari-multiple">
          <h3>Rezervări Multiple în Aceeași Zi</h3>
          <table className="rezervari-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Număr Spectacole</th>
                <th>Spectacole</th>
              </tr>
            </thead>
            <tbody>
              {rezervariMultiple.map((rezervare, index) => (
                <tr key={index}>
                  <td>{rezervare.data}</td>
                  <td>{rezervare.numar_spectacole}</td>
                  <td>{rezervare.spectacole}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!rezervari.length && !rezervariMultiple.length && (
        <div className="no-rezervari">
          <p>Nu aveți rezervări active</p>
          <button onClick={() => navigate('/spectacole')}>
            Rezervă un spectacol
          </button>
        </div>
      )}

      {showConfirmDialog && (
        <div className="confirm-dialog">
          <div className="confirm-content">
            <p>Sigur doriți să anulați această rezervare?</p>
            <div className="confirm-buttons">
              <button onClick={confirmDelete}>Da</button>
              <button onClick={() => setShowConfirmDialog(false)}>Nu</button>
            </div>
          </div>
        </div>
      )}

      <button 
        className="back-button"
        onClick={() => navigate('/spectacole')}
      >
        Înapoi la Spectacole
      </button>
    </div>
  );
};

export default RezervariMele;

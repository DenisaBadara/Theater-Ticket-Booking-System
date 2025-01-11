import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Spectacole.css';

const SpectacolePage = () => {
  const [spectacole, setSpectacole] = useState([]);
  const [filteredSpectacole, setFilteredSpectacole] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [showAccount, setShowAccount] = useState(false);
  const [updatedDetails, setUpdatedDetails] = useState({ username: '', password: '' });
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5001/spectacole', {
      credentials: 'include', // Trimite cookie-urile pentru sesiune
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Nu s-au putut încărca spectacolele');
        }
        return response.json();
      })
      .then((data) => {
        const formattedData = data.map((spectacol) => ({
          ...spectacol,
          DataObj: spectacol.Data ? new Date(spectacol.Data) : null,
          Ora: spectacol.Ora ? spectacol.Ora.slice(0, 5) : '',
        }));
        setSpectacole(formattedData);
        setFilteredSpectacole(formattedData);
      })
      .catch((err) => setError(err.message));

    fetch('http://localhost:5001/user-details', { credentials: 'include' })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Nu s-au putut încărca detaliile utilizatorului');
        }
        return response.json();
      })
      .then((data) => {
        setUpdatedDetails((prevDetails) => ({
          ...prevDetails,
          username: data.username || '',
          // Nu setăm parola din backend
        }));
      })
      .catch((err) => console.error('Eroare la obținerea detaliilor utilizatorului:', err));
  }, []);

  useEffect(() => {
    const fetchUserStats = async () => {
        try {
            const response = await fetch('http://localhost:5001/user-ranking', {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                setUserStats(data);
            }
        } catch (error) {
            console.error('Eroare la încărcarea statisticilor:', error);
        }
    };
    fetchUserStats();
}, []);


  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    if (query === '') {
      setFilteredSpectacole(spectacole);
    } else {
      const filtered = spectacole.filter((spectacol) =>
        spectacol.Nume_spectacol.toLowerCase().includes(query)
      );
      setFilteredSpectacole(filtered);
    }
  };

  const handleAccountToggle = () => {
    setShowAccount(!showAccount);
  };

  const formatDate = (date) => {
    if (!date) return { weekday: '', day: '', month: '', year: '' };

    const options = { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' };
    const formattedDate = date.toLocaleDateString('ro-RO', options).replace(',', '').split(' ');

    const [weekday, day, month, year] = formattedDate;

    return { weekday, day, month, year };
  };

  const handleUpdate = (e) => {
    e.preventDefault();

    const { username, password } = updatedDetails;
    const updateData = { username };

    if (password) {
      updateData.password = password;
    }

    fetch('http://localhost:5001/update-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updateData),
    })
      .then((response) => {
        if (response.ok) {
          alert('Detaliile au fost actualizate cu succes!');
          setShowAccount(false);
        } else {
          alert('A apărut o eroare la actualizarea detaliilor.');
        }
      })
      .catch((err) => console.error('Eroare la actualizarea detaliilor:', err));
  };

  const handleRezervare = (spectacolId) => {
    console.log(`Rezervare pentru Spectacol ID: ${spectacolId}`);
    navigate(`/rezervare/${spectacolId}`);
  };

  const handleVeziRezervari = () => {
    navigate('/rezervarile-mele');
  };



  return (
    <div className="spectacole-container">
      <nav className="navbar">
        {!showAccount && (
          <>
            <input
              type="text"
              placeholder="Caută un spectacol..."
              value={searchQuery}
              onChange={handleSearch}
              className="search-bar"
            />
            <div className="navbar-buttons">
              <button onClick={handleVeziRezervari} className="rezervari-button">
                Rezervările Mele
              </button>
              <button onClick={handleAccountToggle} className="account-button">
                Cont
              </button>
            </div>
          </>
        )}
      </nav>

      {!showAccount ? (
        <>
          <h2>Spectacole Disponibile</h2>
          {error && <p className="error">{error}</p>}
          {filteredSpectacole.length > 0 ? (
            <table className="spectacole-table">
              <thead>
                <tr>
                  <th>Ziua</th>
                  <th>Nume Spectacol</th>
                  <th>Tip Spectacol</th>
                  <th>Nume Sala</th>
                  <th>Capacitate</th>
                  <th>Tip Sala</th>
                  <th>Ora</th>
                  <th>Rezervare</th>
                </tr>
              </thead>
              <tbody>
                {filteredSpectacole.map((spectacol) => {
                  const { weekday, day, month, year } = spectacol.DataObj
                    ? formatDate(spectacol.DataObj)
                    : { weekday: 'N/A', day: 'N/A', month: 'N/A', year: 'N/A' };

                  return (
                    <tr key={spectacol.SpectacolID}>
                      <td className="date-cell">
                        <span className="weekday">{weekday}</span>
                        <span className="day">{day}</span>
                        <span className="month-year">
                          {month} {year}
                        </span>
                      </td>
                      <td>
                        <Link to={`/spectacole/${spectacol.SpectacolID}`} className="spectacol-link">
                          {spectacol.Nume_spectacol}
                        </Link>
                      </td>
                      <td>{spectacol.Tip_spectacol}</td>
                      <td>{spectacol.Nume_sala}</td>
                      <td>{spectacol.Capacitate}</td>
                      <td>{spectacol.Tip_sala}</td>
                      <td>{spectacol.Ora}</td>
                      <td>
                        <button
                          className="rezerva-button"
                          onClick={() => handleRezervare(spectacol.SpectacolID)}
                        >
                          Rezerva
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="error">Nu există spectacole disponibile</p>
          )}
        </>
      ) : (
        <div className="account-container">
          {!updatedDetails.username && !updatedDetails.password ? (
            <p>Se încarcă datele utilizatorului...</p>
          ) : (
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  value={updatedDetails.username}
                  onChange={(e) =>
                    setUpdatedDetails({ ...updatedDetails, username: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Parola</label>
                <input
                  type="password"
                  id="password"
                  value={updatedDetails.password}
                  onChange={(e) =>
                    setUpdatedDetails({ ...updatedDetails, password: e.target.value })
                  }
                />
              </div>
              <div className="buttons-container">
                <button type="submit" className="cont-button">
                  Actualizeaza
                </button>
                <button type="button" className="cont-button" onClick={handleAccountToggle}>
                  Înapoi
                </button>
              </div>
              </form>
            )}
  
            {userStats && (
            <div className="stats-card">
              <div className="stats-content">
                <p className="stats-message">{userStats.mesaj}</p>
                <p className="stats-count">Ai facut {userStats.numar_rezervari} rezervari până acum</p>
                <p className="stats-count">Număr total de bilete: {userStats.total_bilete || 0}</p>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default SpectacolePage;

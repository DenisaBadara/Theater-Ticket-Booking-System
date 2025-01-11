import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Rezervare.css';

const Rezervare = () => {
    const { spectacolId } = useParams();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        cantitate_bilete: '',
        nume: '',
        prenume: '',
        email: '',
        numar_telefon: ''
    });
    
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        fetch('http://localhost:5001/user-details', {
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Unauthorized');
            }
            return response.json();
        })
        .then(data => {
            setIsAuthenticated(true);
            if (data.nume) {
                setFormData(prevData => ({
                    ...prevData,
                    nume: data.nume,
                    prenume: data.prenume,
                    email: data.email,
                    numar_telefon: data.numar_telefon
                }));
            }
        })
        .catch(() => {
            setIsAuthenticated(false);
            setError('Trebuie să fiți autentificat pentru a face o rezervare');
        });
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            setError('Trebuie să fiți autentificat pentru a face o rezervare');
            return;
        }

        try {
            const response = await fetch('http://localhost:5001/rezervare', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    spectacolId: parseInt(spectacolId),
                    cantitate_bilete: parseInt(formData.cantitate_bilete),
                    nume: formData.nume,
                    prenume: formData.prenume,
                    email: formData.email,
                    numar_telefon: formData.numar_telefon
                })
            });

            if (!response.ok) {
                if (response.status === 400) {
                    setError('Există deja o rezervare pentru acest spectacol');
                } else if (response.status === 401) {
                    setError('Sesiunea a expirat. Vă rugăm să vă autentificați din nou');
                    setTimeout(() => navigate('/login'), 2000);
                } else {
                    throw new Error('Eroare la procesarea rezervării');
                }
                return;
            }

            setSuccess('Rezervare realizată cu succes!');
            setError(null);
            setTimeout(() => navigate('/spectacole'), 2000);
        } catch (err) {
            setError(err.message);
            setSuccess(null);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="rezervare-container">
                <h2>Rezervare Bilete</h2>
                <p className="error-message">Utilizator neautentificat</p>
                <button onClick={() => navigate('/login')}>Autentificare</button>
            </div>
        );
    }

    return (
        <div className="rezervare-container">
            <h2>Rezervare Bilete</h2>
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Cantitate Bilete:</label>
                    <input 
                        type="number" 
                        name="cantitate_bilete"
                        value={formData.cantitate_bilete}
                        onChange={handleChange}
                        min="1"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Nume:</label>
                    <input 
                        type="text"
                        name="nume"
                        value={formData.nume}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Prenume:</label>
                    <input 
                        type="text"
                        name="prenume"
                        value={formData.prenume}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Email:</label>
                    <input 
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Număr Telefon:</label>
                    <input 
                        type="tel"
                        name="numar_telefon"
                        value={formData.numar_telefon}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="buttons-container">
                    <button type="submit">Rezervă</button>
                    <button type="button" onClick={() => navigate('/spectacole')}>
                        Înapoi
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Rezervare;

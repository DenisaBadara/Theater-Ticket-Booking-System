import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './DetaliiSpectacol.css';

const SpectacolDetailsPage = () => {
    const { id } = useParams();
    const [detalii, setDetalii] = useState(null);
    const [error, setError] = useState(null);
    const [ocupareSala, setOcupareSala] = useState(null);
    const navigate = useNavigate();
    const [sugestii, setSugestii] = useState([]);

    useEffect(() => {
        // Fetch detalii spectacol
        fetch(`http://localhost:5001/spectacole/${id}`, {
            credentials: 'include'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Nu s-au putut încărca detaliile spectacolului');
                }
                return response.json();
            })
            .then(data => setDetalii(data))
            .catch(err => setError(err.message));

        // Fetch ocupare sala
        const fetchOcupareSala = async () => {
            try {
                const response = await fetch(`http://localhost:5001/spectacol-ocupare/${id}`, {
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    setOcupareSala(data);
                }
            } catch (error) {
                console.error('Eroare la încărcarea ocupării sălii:', error);
            }
        };
        fetchOcupareSala();

        const fetchSugestii = async () => {
            try {
                const response = await fetch(`http://localhost:5001/spectacol-sugestii/${id}`, {
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    setSugestii(data.sugestii);
                }
            } catch (error) {
                console.error('Eroare la încărcarea sugestiilor:', error);
            }
        };
        fetchSugestii();
    }, [id]);

    const handleBack = () => {
        navigate(-1);
    };

    if (error) {
        return (
            <div className="spectacol-details-container">
                <p className="error">{error}</p>
                <button onClick={handleBack} className="back-button">Înapoi</button>
            </div>
        );
    }

    if (!detalii) {
        return (
            <div className="spectacol-details-container">
                <p>Se încarcă detaliile spectacolului...</p>
            </div>
        );
    }

    return (
        <div className="spectacol-details-container">
            <h2>{detalii.Nume_spectacol}</h2>
            <div className="detalii-content">
                <img 
                    src={detalii.Imagine} 
                    alt={detalii.Nume_spectacol} 
                    className="spectacol-imagine" 
                />
                <div className="detalii-text">
                <p><strong>Regizor:</strong> {detalii.Regizor}</p>
                <p><strong>Distribuție:</strong> {detalii.Distributie}</p>
                <p><strong>Durată:</strong> {detalii.Durata} minute</p>
                                
                    {ocupareSala && (
                        <div className="disponibilitate-sala">
                            <div className="ocupare-stats">
                                <p className="procent">
                                    Grad de ocupare: <span>{ocupareSala.procent_ocupare}%</span>
                                </p>
                                <p>Locuri ocupate: {ocupareSala.locuri_ocupate} din {ocupareSala.capacitate}</p>
                            </div>
                        </div>
                    )}
                    
                    {sugestii.length > 0 ? (
                        <div className="sugestii-spectacole">
                            <h3>Spectacole Similare</h3>
                            <div className="sugestii-lista">
                                {sugestii.map((sugestie, index) => (
                                    <p key={index} className="sugestie-item">{sugestie}</p>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="sugestii-spectacole">
                            <p className="no-sugestii">Nu exista spectacole de acelasi gen</p>
                        </div>
                    )}

                    <button onClick={handleBack} className="back-button">
                        Înapoi
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SpectacolDetailsPage;

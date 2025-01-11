from flask import Flask, request, jsonify, session
from flask_cors import CORS, cross_origin
import pypyodbc as odbc
from datetime import timedelta
import time 
import uuid

app = Flask(__name__)
app.secret_key = 'alabalaportocala'
app.config.update(
    SESSION_COOKIE_SECURE=False, 
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
    PERMANENT_SESSION_LIFETIME=timedelta(minutes=60)
)

CORS(app, 
    resources={r"/*": {"origins": "http://localhost:3000"}},
    supports_credentials=True
)

@app.after_request
def after_request(response):
    print("Headers response:")
    for header in response.headers:
        print(f"{header[0]}: {header[1]}")
    return response

SERVER_NAME = 'DESKTOP-E3R755C\\SQLEXPRESS'
DATABASE_NAME = 'RezervariBilete'
connection_string = f"""
    DRIVER={{SQL Server}};
    SERVER={SERVER_NAME};
    DATABASE={DATABASE_NAME};
    Trusted_Connection=yes;
"""

def get_db_connection():
    return odbc.connect(connection_string)

@app.route('/login', methods=['POST'])
def login():
    username = request.json.get('username')
    password = request.json.get('password')

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT u.ClientID, u.Password, c.Nume, c.Prenume, c.Email, c.Numar_telefon 
            FROM Utilizatori u
            LEFT JOIN Client c ON u.ClientID = c.ClientID
            WHERE u.Username = ?
        """, (username,))
        user_data = cursor.fetchone()

        if user_data and user_data[1] == password:
            session.permanent = True
            session['username'] = username
            session['client_id'] = user_data[0]
            return jsonify({
                "message": "Autentificare reușită!",
                "user": {
                    "username": username,
                    "nume": user_data[2],
                    "prenume": user_data[3],
                    "email": user_data[4],
                    "numar_telefon": user_data[5]
                }
            }), 200
        return jsonify({"message": "Credențiale invalide"}), 401

    except Exception as e:
        print("Eroare la autentificare:", e)
        return jsonify({"message": "Eroare la autentificare"}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/register', methods=['POST'])
def register():
    username = request.json.get('username')
    password = request.json.get('password')
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM Utilizatori WHERE Username = ?", (username,))
        if cursor.fetchone()[0] > 0:
            return jsonify({"message": "Utilizatorul există deja"}), 409

        cursor.execute("""
            INSERT INTO Client (Nume, Prenume, Email, Numar_telefon) 
            VALUES (NULL, NULL, NULL, NULL)
        """)
        cursor.execute("SELECT SCOPE_IDENTITY()")
        client_id = cursor.fetchone()[0]
        
        cursor.execute("""
            INSERT INTO Utilizatori (ClientID, Username, Password) 
            VALUES (?, ?, ?)
        """, (client_id, username, password))
        
        conn.commit()
        return jsonify({"message": "Înregistrare reușită"}), 201

    except Exception as e:
        print("Eroare la înregistrare:", e)
        return jsonify({"message": "Eroare la înregistrare"}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/user-details', methods=['GET'])
def get_user_details():
    if 'client_id' not in session:
        return jsonify({"message": "Unauthorized"}), 401
        
    try:
        conn = odbc.connect(connection_string)
        cursor = conn.cursor()
        
        query = """
            SELECT c.Nume, c.Prenume, c.Email, c.Numar_telefon, u.Username
            FROM Client c
            JOIN Utilizatori u ON c.ClientID = u.ClientID
            WHERE c.ClientID = ?
        """
        cursor.execute(query, (session['client_id'],))
        row = cursor.fetchone()
        
        if row:
            return jsonify({
                "nume": row[0] or '',
                "prenume": row[1] or '',
                "email": row[2] or '',
                "numar_telefon": row[3] or '',
                "username": row[4]
            })
        return jsonify({"message": "User not found"}), 404
        
    except Exception as e:
        print("Eroare la obținerea detaliilor:", e)
        return jsonify({"message": "Eroare la obținerea detaliilor"}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/update-user', methods=['POST'])
def update_user():
    if 'client_id' not in session:
        return jsonify({"message": "Unauthorized"}), 401

    data = request.json
    username = data.get('username')
    password = data.get('password')
    client_id = session['client_id']

    try:
        conn = odbc.connect(connection_string)
        cursor = conn.cursor()

        if password:
            query = "UPDATE Utilizatori SET Username = ?, Password = ? WHERE ClientID = ?"
            cursor.execute(query, (username, password, client_id))
        else:
            query = "UPDATE Utilizatori SET Username = ? WHERE ClientID = ?"
            cursor.execute(query, (username, client_id))

        conn.commit()
        return jsonify({"message": "Detaliile au fost actualizate cu succes"}), 200

    except Exception as e:
        print("Eroare la actualizare:", e)
        return jsonify({"message": "Eroare la actualizare"}), 400

    finally:
        cursor.close()
        conn.close()

        
@app.route('/rezervare', methods=['POST'])
def rezervare():
    if 'client_id' not in session:
        return jsonify({"message": "Unauthorized"}), 401
        
    data = request.json
    client_id = session['client_id']
    
    try:
        conn = odbc.connect(connection_string)
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE Client 
            SET Nume = ?, 
                Prenume = ?, 
                Email = ?, 
                Numar_telefon = ?
            WHERE ClientID = ?
        """, (data['nume'], data['prenume'], data['email'], 
              data['numar_telefon'], client_id))
        
        cursor.execute("""
            SELECT COUNT(*) 
            FROM Rezervare 
            WHERE ClientID = ? AND SpectacolID = ?
        """, (client_id, data['spectacolId']))
        
        if cursor.fetchone()[0] > 0:
            return jsonify({"message": "Există deja o rezervare pentru acest spectacol"}), 400
        
        # Inserăm rezervarea nouă
        cursor.execute("""
            INSERT INTO Rezervare (ClientID, SpectacolID, Data_rezervare, Ora_rezervare)
            VALUES (?, ?, CAST(GETDATE() AS DATE), CAST(GETDATE() AS TIME))
        """, (client_id, data['spectacolId']))
        
        conn.commit()
        return jsonify({"message": "Datele au fost actualizate și rezervarea a fost realizată cu succes"}), 201
        
    except Exception as e:
        print("Eroare:", str(e))
        conn.rollback()
        return jsonify({"message": f"Eroare la rezervare: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/rezervarile-mele', methods=['GET'])
def get_rezervari():
    if 'client_id' not in session:
        return jsonify({"message": "Unauthorized"}), 401
        
    client_id = session['client_id']
    
    try:
        conn = odbc.connect(connection_string)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT r.SpectacolID, r.Data_rezervare, r.Ora_rezervare,
                   s.Nume_spectacol, s.Tip_spectacol, 
                   sala.Nume_sala, sala.Capacitate
            FROM Rezervare r
            JOIN Spectacol s ON r.SpectacolID = s.SpectacolID
            JOIN Sala sala ON s.SalaID = sala.SalaID
            WHERE r.ClientID = ?
            ORDER BY r.Data_rezervare DESC, r.Ora_rezervare DESC
        """, (client_id,))
        
        rezervari = [{
            'spectacolId': row[0],
            'data_rezervare': row[1],
            'ora_rezervare': row[2],
            'nume_spectacol': row[3],
            'tip_spectacol': row[4],
            'nume_sala': row[5],
            'capacitate': row[6]
        } for row in cursor.fetchall()]
        
        return jsonify(rezervari)
        
    except Exception as e:
        print("Eroare la obținerea rezervărilor:", str(e))
        return jsonify({"message": "Eroare la obținerea rezervărilor"}), 500
    finally:
        cursor.close()
        conn.close()



@app.route('/anulare-rezervare/<int:spectacol_id>', methods=['DELETE'])
def anulare_rezervare(spectacol_id):
    if 'client_id' not in session:
        return jsonify({"message": "Unauthorized"}), 401
        
    client_id = session['client_id']
    
    try:
        conn = odbc.connect(connection_string)
        cursor = conn.cursor()
        
        # Verificăm dacă rezervarea există
        cursor.execute("""
            SELECT COUNT(*) 
            FROM Rezervare 
            WHERE ClientID = ? AND SpectacolID = ?
        """, (client_id, spectacol_id))
        
        if cursor.fetchone()[0] == 0:
            return jsonify({"message": "Rezervarea nu există"}), 404
        
        # Ștergem rezervarea
        cursor.execute("""
            DELETE FROM Rezervare 
            WHERE ClientID = ? AND SpectacolID = ?
        """, (client_id, spectacol_id))
        
        conn.commit()
        return jsonify({"message": "Rezervarea a fost anulată cu succes"}), 200
        
    except Exception as e:
        print("Eroare la anularea rezervării:", str(e))
        conn.rollback()
        return jsonify({"message": "Eroare la anularea rezervării"}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/delete-rezervare/<int:spectacol_id>', methods=['DELETE'])
def delete_rezervare(spectacol_id):
    if 'client_id' not in session:
        return jsonify({"message": "Unauthorized"}), 401
        
    client_id = session['client_id']
    
    try:
        conn = odbc.connect(connection_string)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT COUNT(*) 
            FROM Rezervare 
            WHERE ClientID = ? AND SpectacolID = ?
        """, (client_id, spectacol_id))
        
        if cursor.fetchone()[0] == 0:
            return jsonify({"message": "Rezervarea nu există"}), 404
        
        cursor.execute("""
            DELETE FROM Rezervare 
            WHERE ClientID = ? AND SpectacolID = ?
        """, (client_id, spectacol_id))
        
        conn.commit()
        return jsonify({"message": "Rezervare anulată cu succes"}), 200
        
    except Exception as e:
        print("Eroare la anularea rezervării:", str(e))
        conn.rollback()
        return jsonify({"message": "Eroare la anularea rezervării"}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/spectacole', methods=['GET'])
def get_spectacole():
    conn = None
    cursor = None
    try:
        print("Încercare de a stabili conexiunea la baza de date...")
        conn = get_db_connection()
        print("Conexiune stabilită cu succes.")
        cursor = conn.cursor()
        print("Cursor creat.")

        print("Executarea interogării SQL...")
        cursor.execute("""
            SELECT 
                s.SpectacolID,
                s.Nume_spectacol,
                s.Tip_spectacol,
                sala.Nume_sala,
                sala.Capacitate,
                sala.Tip_sala,
                ds.Ziua_spectacolului,
                ds.Data,
                ds.Ora
            FROM Spectacol s
            JOIN Sala sala ON s.SalaID = sala.SalaID
            JOIN DetaliiSpectacol ds ON s.SpectacolID = ds.SpectacolID
        """)
        print("Interogare executată.")

        spectacole = [{
            'SpectacolID': row[0],
            'Nume_spectacol': row[1],
            'Tip_spectacol': row[2],
            'Nume_sala': row[3],
            'Capacitate': row[4],
            'Tip_sala': row[5],
            'Ziua_spectacolului': row[6],
            'Data': row[7],
            'Ora': row[8]
        } for row in cursor.fetchall()]
        
        print(f"{len(spectacole)} spectacole obținute.")
        return jsonify(spectacole)

    except Exception as e:
        print("Eroare la obținerea spectacolelor:", e)
        return jsonify({"message": "Eroare la obținerea spectacolelor", "error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
            print("Cursor închis.")
        if conn:
            conn.close()
            print("Conexiune închisă.")

@app.route('/spectacole/<int:spectacol_id>', methods=['GET'])
def get_spectacol_details(spectacol_id):
    conn = None
    cursor = None
    try:
        print(f"Încercare de a stabili conexiunea la baza de date pentru SpectacolID: {spectacol_id}")
        conn = get_db_connection()
        print("Conexiune stabilită cu succes.")
        cursor = conn.cursor()
        print("Cursor creat.")

        print("Executarea interogării SQL pentru detalii spectacol...")
        cursor.execute("""
            SELECT 
                ds.DetaliiID,
                ds.SpectacolID,
                ds.Regizor,
                ds.Distributie,
                ds.Durata,
                ds.Imagine
            FROM DetaliiSpectacol ds
            WHERE ds.SpectacolID = ?
        """, (spectacol_id,))
        print("Interogare executată.")

        row = cursor.fetchone()

        if row:
            detalii = {
                'DetaliiID': row[0],
                'SpectacolID': row[1],
                'Regizor': row[2],
                'Distributie': row[3],
                'Durata': row[4],
                'Imagine': row[5] 
            }
            print(f"Detalii obținute pentru SpectacolID {spectacol_id}: {detalii}")
            return jsonify(detalii), 200
        else:
            print(f"SpectacolID {spectacol_id} nu a fost găsit.")
            return jsonify({"message": "Spectacolul nu a fost găsit"}), 404

    except Exception as e:
        print(f"Eroare la obținerea detaliilor spectacolului {spectacol_id}:", e)
        return jsonify({"message": "Eroare la obținerea detaliilor spectacolului", "error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
            print("Cursor închis.")
        if conn:
            conn.close()
            print("Conexiune închisă.")

@app.route('/user-ranking', methods=['GET'])
@cross_origin(supports_credentials=True)
def get_user_ranking():
    if 'client_id' not in session:
        return jsonify({"message": "Unauthorized"}), 401
        
    conn = None
    cursor = None
    try:
        conn = odbc.connect(connection_string)
        cursor = conn.cursor()
        
        query = """
        WITH RankingClienti AS (
            SELECT 
                c.ClientID,
                COUNT(r.SpectacolID) as numar_rezervari,
                (SELECT ISNULL(SUM(bg.Nr_bilete), 0)
                 FROM BiletGrup bg 
                 WHERE bg.ClientID = c.ClientID) as total_bilete,
                RANK() OVER (ORDER BY COUNT(r.SpectacolID) DESC) as pozitie
            FROM Client c
            LEFT JOIN Rezervare r ON c.ClientID = r.ClientID
            GROUP BY c.ClientID
        )
        SELECT 
            numar_rezervari,
            total_bilete,
            pozitie,
            CASE 
                WHEN pozitie = 1 THEN 'Felicitari! Esti cel mai activ utilizator!'
                ELSE 'Te afli pe pozitia ' + CONVERT(VARCHAR, pozitie) + ' in clasamentul utilizatorilor'
            END as mesaj
        FROM RankingClienti
        WHERE ClientID = ?
        """
        
        cursor.execute(query, (session['client_id'],))
        row = cursor.fetchone()
        
        if row:
            return jsonify({
                "numar_rezervari": row[0],
                "total_bilete": row[1],
                "pozitie": row[2],
                "mesaj": row[3]
            })
            
        return jsonify({"message": "Nu au fost găsite date"}), 404
        
    except Exception as e:
        print(f"Eroare: {str(e)}")
        return jsonify({"message": "Eroare internă"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.route('/spectacol-ocupare/<spectacol_id>', methods=['GET'])
@cross_origin(supports_credentials=True)
def get_ocupare_sala(spectacol_id):
    if 'client_id' not in session:
        return jsonify({"message": "Unauthorized"}), 401
        
    conn = None
    cursor = None
    try:
        conn = odbc.connect(connection_string)
        cursor = conn.cursor()
        
        query = """
        SELECT 
            s.Nume_spectacol,
            sa.Capacitate,
            ISNULL(SUM(bg.Nr_bilete), 0) as locuri_ocupate,
            CAST((ISNULL(SUM(bg.Nr_bilete), 0) * 100.0 / sa.Capacitate) as DECIMAL(5,2)) as procent_ocupare
        FROM Spectacol s
        JOIN Sala sa ON s.SalaID = sa.SalaID
        LEFT JOIN BiletGrup bg ON s.SpectacolID = bg.SpectacolID
        WHERE s.SpectacolID = ?
        GROUP BY s.Nume_spectacol, sa.Capacitate
        """
        
        cursor.execute(query, (spectacol_id,))
        row = cursor.fetchone()
        
        if row:
            locuri_ocupate = row[2]
            capacitate = row[1]
            procent = row[3]
            
            return jsonify({
                "nume_spectacol": row[0],
                "capacitate": capacitate,
                "locuri_ocupate": locuri_ocupate,
                "procent_ocupare": procent,
                "locuri_disponibile": capacitate - locuri_ocupate
            })
            
        return jsonify({"message": "Nu s-au găsit date"}), 404
        
    except Exception as e:
        print(f"Eroare: {str(e)}")
        return jsonify({"message": "Eroare internă"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/rezervari-multiple-data', methods=['GET'])
@cross_origin(supports_credentials=True)
def get_rezervari_multiple():
    conn = None
    cursor = None
    try:
        conn = odbc.connect(connection_string)
        cursor = conn.cursor()
        
        query = """
        WITH RezervariZi AS (
            SELECT 
                c.Nume, 
                c.Prenume, 
                r.Data_rezervare, 
                COUNT(DISTINCT r.SpectacolID) as numar_spectacole,
                STUFF((
                    SELECT ', ' + s2.Nume_spectacol
                    FROM Rezervare r2
                    JOIN Spectacol s2 ON r2.SpectacolID = s2.SpectacolID
                    WHERE r2.ClientID = r.ClientID 
                    AND r2.Data_rezervare = r.Data_rezervare
                    FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 2, '') as spectacole
            FROM Rezervare r
            JOIN Client c ON r.ClientID = c.ClientID
            JOIN Spectacol s ON r.SpectacolID = s.SpectacolID
            GROUP BY c.Nume, c.Prenume, r.ClientID, r.Data_rezervare
            HAVING COUNT(DISTINCT r.SpectacolID) > 1
        )
        SELECT * FROM RezervariZi
        ORDER BY Data_rezervare DESC
        """
        
        cursor.execute(query)
        rows = cursor.fetchall()
        
        if rows:
            rezultate = [{
                "nume": row[0],
                "prenume": row[1],
                "data": row[2],
                "numar_spectacole": row[3],
                "spectacole": row[4]
            } for row in rows]
            return jsonify(rezultate)
            
        return jsonify({"message": "Nu există clienți cu rezervări multiple în aceeași zi"}), 404
        
    except Exception as e:
        print(f"Eroare: {str(e)}")
        return jsonify({"message": "Eroare internă"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.route('/spectacol-sugestii/<spectacol_id>', methods=['GET'])
@cross_origin(supports_credentials=True)
def get_spectacol_sugestii(spectacol_id):
    conn = None
    cursor = None
    try:
        conn = odbc.connect(connection_string)
        cursor = conn.cursor()
        
        query = """
        SELECT Nume_spectacol
        FROM Spectacol
        WHERE Tip_spectacol = (
            SELECT Tip_spectacol
            FROM Spectacol
            WHERE SpectacolID = ?
        ) AND SpectacolID <> ?
        """
        
        cursor.execute(query, (spectacol_id, spectacol_id))
        rows = cursor.fetchall()
        
        if rows:
            sugestii = [row[0] for row in rows]
            return jsonify({"sugestii": sugestii})
            
        return jsonify({"message": "Nu există sugestii disponibile"}), 404
        
    except Exception as e:
        print(f"Eroare: {str(e)}")
        return jsonify({"message": "Eroare internă"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


if __name__ == '__main__':
    app.run(debug=True, port=5001) 
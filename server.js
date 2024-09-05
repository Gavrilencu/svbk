const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

// Configurare CORS
app.use(cors({
  origin: '*', // Permite toate originile
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Permite aceste metode
  allowedHeaders: ['Content-Type', 'Authorization'] // Permite aceste antete
}));

app.use(bodyParser.json({ limit: '50mb' }));

// Conectarea la baza de date SQLite
const db = new sqlite3.Database('./real_estate.db', (err) => {
  if (err) {
    console.error('Error connecting to the database', err);
  } else {
    console.log('Connected to the SQLite database');
  }
});

// Crearea tabelului pentru imobile, dacă nu există
db.run(`
  CREATE TABLE IF NOT EXISTS imobile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    denumire TEXT,
    descriere TEXT,
    pret REAL,
    metri_patrati INTEGER,
    oras TEXT,
    sector TEXT,
    poze TEXT
  )
`);

// Endpoint pentru adăugarea unui apartament
app.post('/apartamente', (req, res) => {
  const { denumire, descriere, pret, metri_patrati, oras, sector, poze } = req.body;

  if (!denumire || !descriere || !pret || !metri_patrati || !oras || !sector || !poze) {
    return res.status(400).json({ message: 'Toate câmpurile sunt necesare' });
  }

  const query = `INSERT INTO imobile (denumire, descriere, pret, metri_patrati, oras, sector, poze) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;

  db.run(query, [denumire, descriere, pret, metri_patrati, oras, sector, JSON.stringify(poze)], function (err) {
    if (err) {
      return res.status(500).json({ message: 'Eroare la adăugarea apartamentului' });
    }
    res.status(201).json({ message: 'Apartament adăugat cu succes', id: this.lastID });
  });
});

// Endpoint pentru extragerea tuturor apartamentelor
app.get('/apartamente', (req, res) => {
  const query = `SELECT * FROM imobile`;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Eroare la extragerea apartamentelor' });
    }
    // Convertim pozele înapoi din JSON
    const apartamente = rows.map(row => ({
      ...row,
      poze: JSON.parse(row.poze)
    }));
    res.status(200).json(apartamente);
  });
});

// Endpoint pentru modificarea unui apartament
app.put('/apartamente/:id', (req, res) => {
  const { id } = req.params;
  const { denumire, descriere, pret, metri_patrati, oras, sector, poze } = req.body;

  const query = `UPDATE imobile SET 
                 denumire = ?, descriere = ?, pret = ?, metri_patrati = ?, oras = ?, sector = ?, poze = ?
                 WHERE id = ?`;

  db.run(query, [denumire, descriere, pret, metri_patrati, oras, sector, JSON.stringify(poze), id], function (err) {
    if (err) {
      return res.status(500).json({ message: 'Eroare la modificarea apartamentului' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Apartament nu a fost găsit' });
    }
    res.status(200).json({ message: 'Apartament modificat cu succes' });
  });
});

// Endpoint pentru ștergerea unui apartament
app.delete('/apartamente/:id', (req, res) => {
  const { id } = req.params;

  const query = `DELETE FROM imobile WHERE id = ?`;

  db.run(query, [id], function (err) {
    if (err) {
      return res.status(500).json({ message: 'Eroare la ștergerea apartamentului' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Apartament nu a fost găsit' });
    }
    res.status(200).json({ message: 'Apartament șters cu succes' });
  });
});

// Pornirea serverului
app.listen(port, () => {
  console.log(`Serverul rulează pe http://localhost:${port}`);
});

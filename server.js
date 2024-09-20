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
    valuta TEXT,
    vindut INTEGER,
    poze TEXT
  )
`);

// Crearea tabelului pentru bloguri, dacă nu există
db.run(`
  CREATE TABLE IF NOT EXISTS bloguri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    denumire TEXT,
    cuprins TEXT,
    data_creare TEXT,
    youtube_link TEXT
  )
`);

// Endpoint pentru adăugarea unui apartament
app.post('/sv/apartamente', (req, res) => {
  const { denumire, descriere, pret, metri_patrati, oras, sector, poze, vindut, valuta } = req.body;

  db.run(
      `INSERT INTO imobile (denumire, descriere, pret, metri_patrati, oras, sector, poze, vindut, valuta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [denumire, descriere, pret, metri_patrati, oras, sector, JSON.stringify(poze), vindut, valuta],
      function(err) {
          if (err) {
              return res.status(500).json({ error: err.message });
          }
          res.status(201).json({ id: this.lastID });
      }
  );
});
// Endpoint pentru extragerea tuturor apartamentelor
app.get('/sv/apartamente', (req, res) => {
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
app.put('/sv/apartamente/:id', (req, res) => {
  const { id } = req.params;
  const { denumire, descriere, pret, metri_patrati, oras, sector, poze,valuta,vindut } = req.body;

  const query = `UPDATE imobile SET 
                 denumire = ?, descriere = ?, pret = ?, metri_patrati = ?, oras = ?, sector = ?, poze = ?,valuta = ? ,vindut = ?
                 WHERE id = ?`;

  db.run(query, [denumire, descriere, pret, metri_patrati, oras, sector, JSON.stringify(poze),valuta,vindut, id], function (err) {
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
app.delete('/sv/apartamente/:id', (req, res) => {
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

// Endpoint pentru adăugarea unui blog
app.post('/sv/bloguri', (req, res) => {
  const { denumire, cuprins, youtube_link } = req.body;

  if (!denumire || !cuprins || !youtube_link) {
    return res.status(400).json({ message: 'Toate câmpurile sunt necesare' });
  }

  const data_creare = new Date().toISOString();
  const query = `INSERT INTO bloguri (denumire, cuprins, data_creare, youtube_link) 
                 VALUES (?, ?, ?, ?)`;

  db.run(query, [denumire, cuprins, data_creare, youtube_link], function (err) {
    if (err) {
      return res.status(500).json({ message: 'Eroare la adăugarea blogului' });
    }
    res.status(201).json({ message: 'Blog adăugat cu succes', id: this.lastID });
  });
});

// Endpoint pentru extragerea tuturor blogurilor
app.get('/sv/bloguri', (req, res) => {
  const query = `SELECT * FROM bloguri`;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Eroare la extragerea blogurilor' });
    }
    res.status(200).json(rows);
  });
});

// Endpoint pentru modificarea unui blog
app.put('/sv/bloguri/:id', (req, res) => {
  const { id } = req.params;
  const { denumire, cuprins, youtube_link } = req.body;

  const query = `UPDATE bloguri SET 
                 denumire = ?, cuprins = ?, youtube_link = ?
                 WHERE id = ?`;

  db.run(query, [denumire, cuprins, youtube_link, id], function (err) {
    if (err) {
      return res.status(500).json({ message: 'Eroare la modificarea blogului' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Blog nu a fost găsit' });
    }
    res.status(200).json({ message: 'Blog modificat cu succes' });
  });
});

// Endpoint pentru ștergerea unui blog
app.delete('/sv/bloguri/:id', (req, res) => {
  const { id } = req.params;

  const query = `DELETE FROM bloguri WHERE id = ?`;

  db.run(query, [id], function (err) {
    if (err) {
      return res.status(500).json({ message: 'Eroare la ștergerea blogului' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Blog nu a fost găsit' });
    }
    res.status(200).json({ message: 'Blog șters cu succes' });
  });
});

// Pornirea serverului
app.listen(port, () => {
  console.log(`Serverul rulează pe http://localhost:${port}`);
});

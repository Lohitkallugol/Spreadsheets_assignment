// const express = require('express');
// const mysql = require('mysql');
// const bodyParser = require('body-parser');
// const cors = require('cors');

// const app = express();
// const port = 3001;

// app.use(cors());
// app.use(bodyParser.json());

// // MySQL connection
// const db = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: '',
//   database: 'sargassignment'
// });

// db.connect(err => {
//   if (err) {
//     console.error('Database connection failed: ' + err.stack);
//     return;
//   }
//   console.log('Connected to database.');
// });

// // CRUD operations
// app.get('/api/spreadsheets', (req, res) => {
//   db.query('SELECT * FROM spreadsheets', (err, results) => {
//     if (err) {
//       console.error('Error fetching spreadsheets:', err);
//       res.status(500).send('Error fetching spreadsheets');
//     } else {
//       res.send(results);
//     }
//   });
// });

// app.post('/api/spreadsheets', (req, res) => {
//   const { name, value } = req.body;
//   db.query('INSERT INTO spreadsheets (name, value) VALUES (?, ?)', [name, value], (err, result) => {
//     if (err) {
//       console.error('Error adding spreadsheet:', err);
//       res.status(500).send('Error adding spreadsheet');
//     } else {
//       const newItem = { id: result.insertId, name, value };
//       res.send(newItem);
//     }
//   });
// });

// app.put('/api/spreadsheets/:id', (req, res) => {
//   const { id } = req.params;
//   const { name, value } = req.body;
//   db.query('UPDATE spreadsheets SET name = ?, value = ? WHERE id = ?', [name, value, id], (err, result) => {
//     if (err) {
//       console.error('Error updating spreadsheet:', err);
//       res.status(500).send('Error updating spreadsheet');
//     } else {
//       res.send({ id, name, value });
//     }
//   });
// });

// app.delete('/api/spreadsheets/:id', (req, res) => {
//   const { id } = req.params;
//   db.query('DELETE FROM spreadsheets WHERE id = ?', [id], (err, result) => {
//     if (err) {
//       console.error('Error deleting spreadsheet:', err);
//       res.status(500).send('Error deleting spreadsheet');
//     } else {
//       res.send('Successfully deleted');
//     }
//   });
// });

// app.listen(port, () => {
//   console.log(`Server running on port ${port}`);
// });



const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./models');
const itemRoutes = require('./routes/itemRoutes.js');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use('/api', itemRoutes);

db.sequelize.sync().then(() => {
  app.listen(3001, () => {
    console.log('Server is running on port 3001');
  });
});

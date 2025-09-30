const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());

app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/api/heure', (req, res) => {
	res.json({ heure: new Date().toLocaleTimeString('fr-FR') });
});

app.get('/api/date', (req, res) => {
	res.json({ date: new Date().toLocaleDateString('fr-FR') });
});

app.listen(3000, () => {
	console.log('Backend lancé sur http://localhost:3000');
});

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const habitsRouter = require('./routes/habits');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/habits', habitsRouter);

app.get('/api/ping', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));

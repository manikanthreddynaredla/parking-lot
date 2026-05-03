require('dotenv').config();

const cors = require('cors');
const express = require('express');
const path = require('path');
const authRoutes = require('./routes/rout');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);

// default route -> login page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://<EC2-PUBLIC-IP>:${PORT}`);
});


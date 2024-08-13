const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.error('Unable to connect to the database:', err));

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Security Inspection System API' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
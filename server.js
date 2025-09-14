const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const app = express();

app.use(cors());
app.use(express.json());

// Troque 'seu_usuario' e 'sua_senha' pelos dados do seu MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',         // ou outro usuário válido
  password: '',         // coloque a senha correta aqui
  database: 'fatec_pj'
});

// Exemplo de rota para listar clientes
app.get('/api/clientes', (req, res) => {
  db.query('SELECT * FROM clientes', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.listen(3000, () => {
  console.log('API rodando na porta 3000');
});
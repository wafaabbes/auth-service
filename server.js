const express = require('express');
const cors = require('cors'); // Middleware CORS
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = 3000;

// Middleware pour parser le JSON
app.use(cors()); // Autorise les requêtes cross-origin (depuis React)
console.log("🔍 Middleware JSON activé !");
app.use(express.json());

// Configuration de la connexion à PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Route pour la racine
app.get('/', (req, res) => {
    res.send('Bienvenue sur la page d\'accueil !');
});

// Middleware pour vérifier le token JWT
function verifyToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(403).send({ message: 'Token non fourni' });
    }

    // Vérifier et décoder le token
    jwt.verify(token.split(' ')[1], process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'Token invalide' });
        }
        req.userId = decoded.id; // Ajouter l'ID de l'utilisateur à la requête
        next(); // Passer au prochain middleware ou à la route
    });
}

// Endpoint pour l'inscription
app.post('/api/auth/register', async (req, res) => {
    console.log("Données reçues :", req.body);  // Ajout pour debug
    const { nom, email, mot_de_passe, role } = req.body;

    // Valider les données d'entrée
    if (!nom || !email || !mot_de_passe || !role) {
        return res.status(400).send({ message: "Tous les champs sont obligatoires" });
    }

    // Hacher le mot de passe
    const hashedPassword = bcrypt.hashSync(mot_de_passe, 8);

    try {
        // Insérer l'utilisateur dans la base de données
        const result = await pool.query(
            'INSERT INTO users (nom, email, mot_de_passe, role) VALUES ($1, $2, $3, $4) RETURNING id, nom, email, role',
            [nom, email, hashedPassword, role]
        );

        // Renvoyer les données de l'utilisateur
        const user = result.rows[0];
        res.status(201).send({ message: "Inscription réussie !", user });
    } catch (err) {
        console.error(err);
        if (err.code === '23505') {
            res.status(400).send({ message: "Email déjà utilisé" });
        } else {
            res.status(500).send({ message: "Erreur lors de l'inscription" });
        }
    }
});

// Endpoint pour la connexion
app.post('/api/auth/login', async (req, res) => {
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe) {
        return res.status(400).send({ message: "Email et mot de passe sont obligatoires" });
    }

    if (!validator.isEmail(email)) {
        return res.status(400).send({ message: "Email invalide" });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(404).send({ message: "Utilisateur non trouvé" });
        }

        if (!bcrypt.compareSync(mot_de_passe, user.mot_de_passe)) {
            return res.status(401).send({ message: "Mot de passe incorrect" });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: 86400 });
        res.status(200).send({
            message: "Connexion réussie !",
            token,
            user: { id: user.id, nom: user.nom, email: user.email, role: user.role }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Erreur serveur" });
    }
});

// Endpoint pour récupérer le profil de l'utilisateur
app.get('/api/auth/profile', verifyToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nom, email, role FROM users WHERE id = $1', [req.userId]);
        if (result.rows.length > 0) {
            res.status(200).send(result.rows[0]);
        } else {
            res.status(404).send({ message: "Utilisateur non trouvé" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Erreur lors de la récupération du profil" });
    }
});

// Démarrer le serveur
app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});
const { Client } = require('pg');

const client = new Client({
    user: 'postgres', // Remplacez par votre utilisateur PostgreSQL
    host: 'localhost',         // Ou l'adresse de votre serveur PostgreSQL
    database: 'auth_service', // Nom de la base de données
    password: '123',    // Mot de passe de l'utilisateur
    port: 5432,                // Port par défaut de PostgreSQL
});

client.connect()
    .then(() => console.log('Connexion à la base de données réussie !'))
    .catch(err => console.error('Erreur de connexion à la base de données:', err));
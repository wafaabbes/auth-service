const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcrypt');

const authController = {
    async login(req, res) {
        const { email, mot_de_passe } = req.body;

        try {
            // Trouver l'utilisateur par email
            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
            }

            // Vérifier le mot de passe
            const isPasswordValid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
            if (!isPasswordValid) {
                return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
            }

            // Générer un token JWT
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            // Renvoyer le token
            res.json({ token });
        } catch (err) {
            console.error('Erreur lors de la connexion:', err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },
};

module.exports = authController;
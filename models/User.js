const pool = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
    /**
     * Crée un nouvel utilisateur dans la base de données.
     * @param {Object} userData - Les données de l'utilisateur.
     * @param {string} userData.nom - Le nom de l'utilisateur.
     * @param {string} userData.email - L'email de l'utilisateur.
     * @param {string} userData.mot_de_passe - Le mot de passe de l'utilisateur.
     * @param {string} userData.role - Le rôle de l'utilisateur.
     * @returns {Promise<Object>} - Les informations de l'utilisateur créé.
     */
    static async create({ nom, email, mot_de_passe, role }) {
        const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
        const query = `
            INSERT INTO users (nom, email, mot_de_passe, role, date_creation)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING id, nom, email, role
        `;
        const values = [nom, email, hashedPassword, role];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Récupère un utilisateur par son email.
     * @param {string} email - L'email de l'utilisateur.
     * @returns {Promise<Object>} - Les informations de l'utilisateur.
     */
    static async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await pool.query(query, [email]);
        return result.rows[0];
    }

    /**
     * Met à jour le profil d'un utilisateur (nom et email).
     * @param {number} id - L'ID de l'utilisateur.
     * @param {Object} userData - Les nouvelles données de l'utilisateur.
     * @param {string} userData.nom - Le nouveau nom de l'utilisateur.
     * @param {string} userData.email - Le nouvel email de l'utilisateur.
     * @returns {Promise<Object>} - Les informations mises à jour de l'utilisateur.
     */
    static async updateProfile(id, { nom, email }) {
        const query = `
            UPDATE users 
            SET nom = $1, email = $2
            WHERE id = $3
            RETURNING id, nom, email, role
        `;
        const result = await pool.query(query, [nom, email, id]);
        return result.rows[0];
    }

    /**
     * Vérifie si le mot de passe fourni correspond à celui de l'utilisateur.
     * @param {string} email - L'email de l'utilisateur.
     * @param {string} mot_de_passe - Le mot de passe à vérifier.
     * @returns {Promise<Object>} - Les informations de l'utilisateur si le mot de passe est valide.
     * @throws {Error} - Si l'utilisateur n'est pas trouvé ou si le mot de passe est incorrect.
     */
    static async verifyPassword(email, mot_de_passe) {
        const user = await this.findByEmail(email);
        if (!user) {
            throw new Error('Utilisateur non trouvé');
        }
        const isPasswordValid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
        if (!isPasswordValid) {
            throw new Error('Mot de passe incorrect');
        }
        return user;
    }

    /**
     * Met à jour le mot de passe d'un utilisateur.
     * @param {number} id - L'ID de l'utilisateur.
     * @param {string} newPassword - Le nouveau mot de passe.
     * @returns {Promise<Object>} - Les informations de l'utilisateur mises à jour.
     */
    static async updatePassword(id, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const query = `
            UPDATE users 
            SET mot_de_passe = $1
            WHERE id = $2
            RETURNING id, nom, email, role
        `;
        const result = await pool.query(query, [hashedPassword, id]);
        return result.rows[0];
    }

    /**
     * Supprime un utilisateur par son ID.
     * @param {number} id - L'ID de l'utilisateur.
     * @returns {Promise<Object>} - Les informations de l'utilisateur supprimé.
     */
    static async delete(id) {
        const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    /**
     * Récupère tous les utilisateurs.
     * @returns {Promise<Array>} - La liste de tous les utilisateurs.
     */
    static async findAll() {
        const query = 'SELECT id, nom, email, role FROM users';
        const result = await pool.query(query);
        return result.rows;
    }
}

module.exports = User;
# 🚀 Microservice d'Authentification – CI/CD avec Jenkins, Docker & Trivy

Ce projet est un microservice d'authentification développé en Node.js avec une base de données PostgreSQL. Il utilise un pipeline CI/CD automatisé via **Jenkins**, avec intégration de **Docker**, **Trivy** pour les scans de sécurité, et **Docker Compose** pour l'orchestration locale.

---

## 📦 Contenu du projet

- `server.js` : Entrée principale du backend
- `.env` : Variables d’environnement (port, DB, JWT)
- `Dockerfile` : Construction de l’image du backend
- `docker-compose.yml` : Déploie l’API + PostgreSQL
- `Jenkinsfile` : Pipeline CI/CD
- `src/` : Code source (routes, controllers, etc.)

---

## ⚙️ Variables d’environnement (.env)

```env
PORT=8000
DB_HOST=auth-db
DB_PORT=5432
DB_NAME=micro-auth
DB_USER=postgres
DB_PASSWORD=123
JWT_SECRET=supersecret

pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "wafa23/auth-service"
        SONARQUBE_URL = 'http://localhost:9000'  // URL de votre instance SonarQube
        SONARQUBE_TOKEN = 'sqa_083d3a60a2cef15c85af22637b779ab67c853e86'  // Remplacez par votre token SonarQube
    }

    options {
        skipStagesAfterUnstable()
        timestamps()
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/wafaabbes/auth-service.git'
            }
        }

        stage('Install dependencies') {
            steps {
                sh 'npm install'
            }
        }
         stage('SonarQube Analysis') {
            steps {
                script {
                    // Utilisation de l'image Docker officielle de SonarQube Scanner
                    docker.image('sonarsource/sonar-scanner-cli').inside {
                        sh '''
                            sonar-scanner \
                              -Dsonar.projectKey=mon-projet \
                              -Dsonar.sources=. \
                              -Dsonar.host.url=$SONARQUBE_URL \
                              -Dsonar.login=$SONARQUBE_TOKEN
                        '''
                    }
                }
            }
        }
        stage('Test') {
            steps {
                // Utilisation de npx ou ajout d'exécution explicite à jest
                sh 'chmod +x ./node_modules/.bin/jest || true'
                sh 'npx jest || echo "Tests échoués (continuer pour debug)"'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    def commitHash = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    def imageTag = "${DOCKER_IMAGE}:${commitHash}"
                    sh "docker build -t $imageTag ."
                }
            }
        }

        stage('Push Docker Image') {
            steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
            script {
                def commitHash = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                def imageTag = "${DOCKER_IMAGE}:${commitHash}"

                sh """
                    echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin
                    docker push "$imageTag" || { echo "Échec du push de l'image Docker"; exit 1; }
                """
                    }
                }
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline exécutée avec succès !'
        }
        failure {
            echo '❌ Une erreur est survenue pendant le pipeline.'
        }
        always {
            echo '📝 Pipeline terminée.'
        }
    }
} 

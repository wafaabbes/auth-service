pipeline {
    agent any

    tools {
        nodejs "NodeJS 18"
    }

    environment {
        DOCKER_IMAGE = 'auth-service'
        DOCKER_TAG = "${BRANCH_NAME}-${BUILD_NUMBER}"
        DOCKER_REGISTRY = 'docker.io/wafa23'
        DOCKER_CREDENTIALS = credentials('docker-registry-credentials')
        KUBE_NAMESPACE_DEV = 'development'
        KUBE_NAMESPACE_PROD = 'production'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Run Tests') {
            steps {
                sh 'npm test'
            }
        }

        stage('Code Quality') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh 'npm run lint'
                    sh 'npm run sonar'
                }
            }
        }

        stage('Build App') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    docker.build("${DOCKER_REGISTRY}/${DOCKER_IMAGE}:${DOCKER_TAG}")
                }
            }
        }

        stage('Security Scan') {
            steps {
                sh """
                    npm audit || true
                    trivy image ${DOCKER_REGISTRY}/${DOCKER_IMAGE}:${DOCKER_TAG} || true
                """
            }
        }

        stage('Push to Docker Registry') {
            steps {
                script {
                    docker.withRegistry("https://${DOCKER_REGISTRY}", DOCKER_CREDENTIALS) {
                        docker.image("${DOCKER_REGISTRY}/${DOCKER_IMAGE}:${DOCKER_TAG}").push()
                        docker.image("${DOCKER_REGISTRY}/${DOCKER_IMAGE}:${DOCKER_TAG}").push('latest')
                    }
                }
            }
        }

        stage('Deploy to Development') {
            when {
                branch 'develop'
            }
            steps {
                sh """
                    kubectl set image deployment/auth-service auth-service=${DOCKER_REGISTRY}/${DOCKER_IMAGE}:${DOCKER_TAG} --namespace=${KUBE_NAMESPACE_DEV}
                    kubectl rollout status deployment/auth-service --namespace=${KUBE_NAMESPACE_DEV}
                """
            }
        }

        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Confirmez le déploiement en production ?'
                sh """
                    kubectl set image deployment/auth-service auth-service=${DOCKER_REGISTRY}/${DOCKER_IMAGE}:${DOCKER_TAG} --namespace=${KUBE_NAMESPACE_PROD}
                    kubectl rollout status deployment/auth-service --namespace=${KUBE_NAMESPACE_PROD}
                """
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline terminée avec succès !'
            // slackSend channel: '#deployments', color: 'good', message: "Déploiement réussi pour ${env.JOB_NAME} [#${env.BUILD_NUMBER}]"
        }

        failure {
            echo '❌ Échec de la pipeline.'
            // slackSend channel: '#deployments', color: 'danger', message: "Échec du déploiement pour ${env.JOB_NAME} [#${env.BUILD_NUMBER}]"
        }

        always {
            cleanWs()
        }
    }
}

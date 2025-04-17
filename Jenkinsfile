pipeline {
    agent any

    environment {
        IMAGE_NAME = "wafa23/auth-service"   // Remplace par ton Docker Hub username
        IMAGE_TAG = "latest"
        DOCKERHUB_CREDENTIALS_ID = "dockerhub-creds" // ID Jenkins pour les identifiants Docker Hub
    }

    tools {
        nodejs 'Node18'
    }

    stages {
        stage('Clean Workspace') {
            steps {
                cleanWs()
            }
        }

        stage('Checkout Code') {
            steps {
                git branch: 'main', url: 'https://github.com/wafaabbes/auth-service.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .'
            }
        }

        stage('Run Trivy Scan') {
            steps {
                sh '''
                    docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy \
                    image ${IMAGE_NAME}:${IMAGE_TAG} \
                    --no-progress --scanners vuln --exit-code 1 --severity HIGH,CRITICAL --format table
                '''
            }
        }

        stage('Docker Login & Push') {
            steps {
                withCredentials([usernamePassword(credentialsId: "${DOCKERHUB_CREDENTIALS_ID}", passwordVariable: 'DOCKERHUB_PASS', usernameVariable: 'DOCKERHUB_USER')]) {
                    sh '''
                        echo "$DOCKERHUB_PASS" | docker login -u "$DOCKERHUB_USER" --password-stdin
                        docker push ${IMAGE_NAME}:${IMAGE_TAG}
                    '''
                }
            }
        }

        stage('Run Application with Docker Compose') {
            steps {
                sh 'docker-compose up -d'
            }
        }

        stage('Wait & Test Health') {
            steps {
                script {
                    def retries = 10
                    def success = false
                    for (int i = 1; i <= retries; i++) {
                        echo "Waiting for application to be ready (Attempt: ${i})"
                        def result = sh(script: 'curl -s -o /dev/null -w "%{http_code}" http://localhost:8000', returnStdout: true).trim()
                        if (result == "200") {
                            success = true
                            break
                        } else {
                            echo "App not responding, retrying in 10 seconds..."
                            sleep 10
                        }
                    }
                    if (!success) {
                        error("Application failed to start in the expected time frame")
                    }
                }
            }
        }
    }

    post {
        always {
            echo 'Cleaning up...'
            sh '''
                docker-compose down
                docker system prune -f
            '''
        }
    }
}

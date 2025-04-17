pipeline {
    agent any

    environment {
        IMAGE_NAME = "wafa/aut-service"     // Remplace par ton Docker Hub username
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
                    --no-progress --scanners vuln --exit-code 0 --severity HIGH,CRITICAL --format table
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
                    sleep 10
                    sh 'curl -f http://localhost:8000 || echo "App not responding"'
                }
            }
        }
    }

    post {
        always {
            echo 'Cleaning up...'
            sh 'docker-compose down'
        }
    }
}

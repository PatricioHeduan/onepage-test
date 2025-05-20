pipeline {
    agent any
    environment {
        DOCKER_TAG = 'nextjs-mp-test'
        PORT = "3269"
        BASE_PATH = "/mp-test"
    }
    stages {
        stage('Build') {
            steps {
                echo 'Building Docker image...'
                sh '''
                docker build \
                --build-arg BASE_PATH="${BASE_PATH}" \
                -t ${DOCKER_TAG}:1.0 .
                '''
            }
        }
        stage('Deploy') {
            steps {
                echo 'Stopping previous version...'
                sh 'docker stop $DOCKER_TAG || echo Nothing to stop'
                sh 'docker rm $DOCKER_TAG || echo Nothing to remove'
                echo 'Deploying new version...'
                sh '''
                docker run -d \
                -e BASE_PATH="${BASE_PATH}" \
                -p $PORT:3000 \
                --name $DOCKER_TAG \
                ${DOCKER_TAG}:1.0
                '''
            }
        }
    }
}
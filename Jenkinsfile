pipeline {
    agent any
    environment {
        DOCKER_TAG = 'mp-test'
        PORT = "3670"
        VITE_MP_PUBLIC_KEY=credentials("VITE_MP_PUBLIC_KEY")
        }
    stages {
        stage('Build') {
            steps {
                echo 'Building...'
                sh 'docker buildx build --build-arg VITE_MP_PUBLIC_KEY=${VITE_MP_PUBLIC_KEY} -t ${DOCKER_TAG}:1.0 .'

            }
        }
        stage('Deploy') {
            steps {
                echo 'Stopping previous container...'
                sh 'docker stop $DOCKER_TAG || echo Nothing to stop'
                sh 'docker rm $DOCKER_TAG || echo Nothing to remove'

                echo 'Starting new container on port ${PORT}...'
                sh 'docker run -d -e VITE_MP_PUBLIC_KEY -p $PORT:3000 --name $DOCKER_TAG $DOCKER_TAG:1.0'
            }
        }
    }
}

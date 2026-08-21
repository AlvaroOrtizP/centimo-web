pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'alorpes/centimo-web'
        VERSION = ''
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Check') {
            // Se ejecuta siempre para validar que la imagen compila bien
            steps {
                sh 'docker build -f ./Dockerfile .'
            }
        }

        stage('Extract Version') {
            when {
                branch 'main'
            }
            steps {
                script {
                    VERSION = sh(
                        script: "node -p \"require('./package.json').version\"",
                        returnStdout: true
                    ).trim()
                    echo "Versión a publicar: ${VERSION}"
                }
            }
        }

        stage('Push to Docker Hub') {
            when {
                branch 'main'
            }
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'

                    // Re-etiqueta y sube ambas versiones (etiqueta fija y latest)
                    sh "docker build -f ./Dockerfile -t ${DOCKER_IMAGE}:${VERSION} -t ${DOCKER_IMAGE}:latest ."
                    sh "docker push ${DOCKER_IMAGE}:${VERSION}"
                    sh "docker push ${DOCKER_IMAGE}:latest"
                }
            }
        }

        stage('Deploy to Render') {
            when {
                branch 'main'
            }
            steps {
                withCredentials([string(credentialsId: 'render-hook-app1', variable: 'RENDER_HOOK')]) {
                    sh 'curl -X POST $RENDER_HOOK'
                }
            }
        }
    }

    post {
        always {
            cleanWs()
            sh 'docker logout || true'
        }
        failure {
            echo 'Error en la construcción o despliegue de centimo-web'
        }
        success {
            echo 'centimo-web desplegado correctamente'
        }
    }
}

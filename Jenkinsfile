pipeline {
    agent any

    environment {
        // Define la imagen que subiste en el paso de GitHub Actions
        DOCKER_IMAGE = "beltranch97/beltran-app:latest"
        // ID de la credencial Kubeconfig que configuraste en Jenkins
        KUBE_CRED_ID = 'local-kubeconfig' 
    }

    stages {
        stage('Descargar Configuración') {
            steps {
                // Descarga los archivos .yaml del repositorio para que Jenkins los lea
                checkout scm [cite: 39]
            }
        }

        stage('Despliegue en Kubernetes') {
            steps {
                script {
                    // El "Capataz" usa las llaves (Kubeconfig) para dar órdenes al clúster [cite: 42]
                    withKubeConfig([credentialsId: "${KUBE_CRED_ID}"]) {
                        sh "kubectl apply -f k8s/deployment.yaml"
                        sh "kubectl rollout restart deployment mi-app-devops"
                    }
                }
            }
        }
    }

    post {
        success {
            echo "¡Despliegue completado con éxito! La aplicación está operativa." [cite: 16]
        }
    }
}
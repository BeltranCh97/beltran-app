# Documento Técnico: Laboratorio CI/CD para Aplicación Java Web

**Nombre del Estudiante:** [Luis Fernando Beltran Chantre]  
**Módulo:** Flujos de entrega eficientes: CI/CD y automatización  
**Actividad:** Actividad 3 - Laboratorio Técnico  

---

## 1. Objetivo del Laboratorio
Diseñar, estructurar e implementar dos pipelines automatizados (CI y CD) para una aplicación web basada en Java. El objetivo es asegurar la integración continua mediante la compilación y pruebas del código, y la entrega continua mediante el empaquetado de la aplicación en un contenedor Docker con servidor Tomcat, preparándola para su futuro despliegue en Kubernetes.

## 2. Enlace al Repositorio
El código fuente, los archivos de configuración del pipeline y la documentación básica (`README.md`) se encuentran alojados en el siguiente repositorio público:  
🔗 **[https://github.com/BeltranCh97/beltran-app]**

---

## 3. Justificación Técnica y Arquitectura del Pipeline

Para este laboratorio se diseñó una arquitectura robusta orientada a entornos corporativos Java:

1. **Integración Continua (CI) - GitHub Actions:**
   Se seleccionó GitHub Actions por su integración nativa con el repositorio. El pipeline de CI se activa ante cada `push` o `pull_request` en la rama principal. Se configuró un entorno con **Java JDK 21** y se utilizó **Maven** como gestor de dependencias para compilar el artefacto desplegable (`.war`) y ejecutar las pruebas automatizadas, asegurando que ningún código defectuoso avance en el flujo.

2. **Empaquetado y Servidor Web - Docker Multietapa:**
   Para garantizar la inmutabilidad y portabilidad, se diseñó un `Dockerfile` multietapa (Multi-stage build). La primera etapa usa Maven para compilar el código fuente. La segunda etapa toma el artefacto `.war` resultante y lo inyecta en una imagen oficial de **Apache Tomcat 9**. Esto reduce drásticamente el peso de la imagen final por seguridad y rendimiento.

3. **Entrega Continua (CD) - Jenkins:**
   Se definió el pipeline de CD utilizando un archivo `Jenkinsfile` de formato declarativo. Jenkins se encarga de clonar el repositorio, construir la imagen Docker basándose en el Dockerfile descrito anteriormente, y finalmente autenticarse y publicar la imagen en el registro de contenedores (DockerHub), dejándola lista para ser consumida por un clúster de Kubernetes en fases posteriores.

---

## 4. Archivos de Configuración

A continuación, se evidencian los archivos de configuración alojados en el repositorio que definen la infraestructura como código de los pipelines:

### 4.1. Pipeline CI (GitHub Actions)
**Ruta:** `.github/workflows/ci.yml`

```yaml
name: CI Pipeline - Java Web App

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout del código
      uses: actions/checkout@v3

    - name: Configurar JDK 21
      uses: actions/setup-java@v3
      with:
        java-version: '21'
        distribution: 'temurin' 
        cache: maven

    - name: Compilar y Empaquetar el artefacto (.war)
      run: mvn clean package

    - name: Ejecutar pruebas unitarias
      run: mvn test
```
### 4.2. Dockerfile
**Ruta:** `/`
```
# Etapa 1: Construcción (Builder)
FROM maven:3.8-openjdk-11 AS builder
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

# Etapa 2: Servidor de Aplicaciones (Producción)
FROM tomcat:9.0-jdk11-openjdk
RUN rm -rf /usr/local/tomcat/webapps/*
COPY --from=builder /app/target/*.war /usr/local/tomcat/webapps/ROOT.war
EXPOSE 8080
CMD ["catalina.sh", "run"]
```
### 4.3. Pipeline CD (Jenkins)
**Ruta:** `/`
```
pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'mi-usuario/java-webapp-tomcat'
        DOCKER_TAG = 'latest'
        DOCKER_CREDS = credentials('dockerhub-credentials-id') 
    }

    stages {
        stage('1. Clonar el repositorio') {
            steps {
                echo 'Clonando repositorio de GitHub...'
                checkout scm
            }
        }

        stage('2. Construir imagen Docker') {
            steps {
                echo 'Construyendo imagen con Tomcat y el archivo .war...'
                sh "docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} ."
            }
        }

        stage('3. Publicar en DockerHub') {
            steps {
                echo 'Publicando la imagen de la Web App en el registro...'
                sh "echo \$DOCKER_CREDS_PSW | docker login -u \$DOCKER_CREDS_USR --password-stdin"
                sh "docker push ${DOCKER_IMAGE}:${DOCKER_TAG}"
            }
        }
    }
}
```
---
## 5. Evidencias de Ejecución


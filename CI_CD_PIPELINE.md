# Documentación Técnica: Pipeline CI/CD y DevOps

Este documento describe la arquitectura, flujo y herramientas utilizadas para la implementación de Integración y Entrega Continua (CI/CD) de la aplicación Java Web (`beltran-app`).

## 1. Descripción del Flujo CI/CD

El flujo de Integración y Entrega Continua automatiza el ciclo de vida del software desde la integración del código fuente hasta la puesta en producción en un clúster de Kubernetes, dividiéndose en dos pipelines principales que interactúan lógicamente sin acoplamiento duro.

### 1.1 Flujo de Integración Continua (CI) - GitHub Actions
El trigger principal del pipeline de CI reacciona a los eventos de `push` y `pull_request` en la rama `main`. El flujo comprende de forma secuencial y condicional los siguientes pasos:
1. **Checkout y Configuración:** Se descarga el código fuente y se provisiona un entorno temporal con Java JDK 17 y Maven. El sistema de cachés permite acelerar las siguientes ejecuciones.
2. **Construcción y Pruebas Unitarias:** Se ejecuta el marco de pruebas (`mvn clean test`) para garantizar que la nueva lógica cumple con las directrices esperadas y no rompe funcionalidades previamente estables.
3. **Análisis de Vulnerabilidades y Código:**
    - **Snyk:** Se realiza un escaneo de seguridad en el archivo `pom.xml` para detectar vulnerabilidades conocidas en dependencias de terceros (SCA). Si el escaneo detecta un CVE con la severidad configurada (Low/Medium/High), el pipeline se bloquea inmediatamente.
    - **SonarCloud:** Se lleva a cabo la inspección del código fuente para evaluar la mantenibilidad y descubrir posibles Bugs o Code Smells (SAST). Se establece un **Quality Gate**. Si no se supera dicho umbral, el avance se detiene.
4. **Empaquetado y Registro de Imagen Docker:** Garantizada la calidad y seguridad del código, un *job* dependiente (`build-and-push-docker`) entra en función. Este utiliza un `Dockerfile` para empaquetar el artefacto Java en un servidor liviano, creando una imagen Docker. Seguidamente, la imagen producida se empuja al repositorio remoto **Docker Hub** con la etiqueta `latest`.

### 1.2 Flujo de Despliegue Continuo (CD) - Jenkins
Este entorno actúa como actuador hacia la infraestructura de producción. Jenkins recoge el testigo (una vez que la imagen está disponible en Docker Hub) y la implementa en el entorno de contenedores:
1. **Sincronización de Manifiestos:** Jenkins clona el repositorio para obtener los archivos de configuración y manifiestos de Kubernetes (`deployment.yaml`, `service.yaml`) garantizando que la infraestructura siempre coincida con la infraestructura declarada en el código.
2. **Aplicación Asistida (Kubernetes/Kubectl):** Utilizando credenciales seguras (Kubeconfig), Jenkins ordena al clúster de Kubernetes aplicar los manifiestos, actualizar los recursos configurados y realiza un reinicio secuencial de la carga de trabajo (`kubectl rollout restart`). Esto obliga a los nodos de Kubernetes a tirar de la nueva imagen publicada (`beltran-app:latest`) de manera controlada (Cero Downtime).

---

## 2. Herramientas Utilizadas y Justificación

| Herramienta | Fase de Integración | Justificación Técnica |
|---|---|---|
| **Git & GitHub** | Control de Versiones (SCM)| Actúa como la única fuente de la verdad para el código y manifiestos de infraestructura, integrando de manera nativa los flujos de trabajo (Actions). |
| **Java JDK 17 & Maven** | Compilación y Pruebas | Base técnica del desarrollo; Maven maneja de forma natural el empaquetado y el ciclo de vida del build y la resolución de librerías. |
| **Snyk** | DevSecOps (SCA) | Snyk audita el código detectando vulnerabilidades de uso de librerías en fases tempranas del ciclo (*Shift-Left Security*), garantizando que componentes vulnerables no lleguen jamás a contenedores base. |
| **SonarCloud** | Calidad de Código (SAST)| Obliga a los desarrolladores a cumplir con un umbral de mantenibilidad estandarizado. Al aplicar un "Quality Gate", previene la propagación de deuda técnica. |
| **Docker** | Empaquetado Impositivo | Estandariza la aplicación en un entorno inmutable. Cualquier problema de compatibilidad entre sistema de Desarrollo vs Producción queda mitigado. |
| **Docker Hub** | Registro de Imágenes | Actúa como un *Registry* asíncrono y centralizado, desacoplando exitosamente el proceso de construcción de imagen (CI) del de despliegue (CD). |
| **Jenkins** | Entrega Continua (CD) | Orquesta y puentea robustamente la logística necesaria para empujar el empaquetado final a la infraestructura del sistema aprovechando sus `credentials` seguras y adaptadores universales a comandos remotos. |
| **Kubernetes (K8s)**| Plataforma Ejecución | Brinda escalabilidad horizontal automática, alta disponibilidad y un esquema 100% declarativo para garantizar el estado constante de salud del despliegue. |

---

## 3. Integración en el Pipeline, Automatización y Reutilización de Configuraciones

Un pilar fundamental de la propuesta es cómo las herramientas convergen sin roces mutuos y cómo priorizamos una mentalidad "DRY" (Don't Repeat Yourself) prestando énfasis en la automatización.

### Priorización de la Automatización y Modularidad (CI)
En el *Pipeline* de GitHub Actions se maximiza la legibilidad y se evita la creación manual de scripts interactivos frágiles:
- **Uso de Acciones Listas para Usar (Marketplace):** En lugar de instalar cada lenguaje de forma manual o instalar motores en cada máquina virtual, implementamos `actions/checkout@v4`, `actions/setup-java@v3`, `docker/build-push-action@v5`, y `SonarSource/sonarqube-quality-gate-action@v1`.
- **Análisis de Impacto sin Intervención Manual:** Los escaneos de Snyk y el Quality Gate de SonarCloud evalúan las subidas de código de manera estricta y transparente. Al detectarse anomalías (como vulnerabilidades o *code smells*), el pipeline *falla la construcción automáticamente*, devolviendo el respectivo error en la propia interfaz de PR (Pull Request) del desarrollador para ser saneado antes del un posible merge, sin requerirse de un ingeniero de QA para realizar el bloqueo presencial e invirtiendo menos tiempo analizando código dudoso.

### Reutilización de Configuraciones
La modularidad técnica guio el diseño en vez de usar configuraciones hard-coded (incrustadas estáticamente):
- **Desacoplamiento del Emisor (GitHub) y Receptor (Jenkins):** En lugar de inyectar variables complicadas entre GitHub y Jenkins, el diseño fomenta que la imagen Docker publicada actúe como el contrato común. El registry retiene una imagen agnóstica (`beltran-app:latest`) en donde GitHub es el único responsable de escribir en el repositorio, y Jenkins el único involucrado de consumirla.
- **Gestión Segura de Variables:** Todo token necesario (`GITHUB_TOKEN`, `SONAR_TOKEN`, `SNYK_TOKEN`, claves `DOCKER`) se inyectan dinámicamente utilizando **Secrets** en GitHub. Jenkins hace lo mismo con el objeto `KUBE_CRED_ID`. Así, se facilita la rotación de credenciales en un solo lugar y se reciclan entornos de integración.
- **Reutilización de Manifiestos de Kubernetes:** Al usar el tag `latest` para la imagen, los manifiestos (`deployment.yaml` y `service.yaml`) rara la vez necesitan actualizaciones. Durante el CD, el flujo invoca `kubectl rollout restart deployment`, el cual instruye de manera declarativa descargar y refrescar el contenido sin necesidad de parsear y sustituir de forma dinámica las versiones en los `.yaml` en el servidor de CD. Esto favorece una orquestación sumamente resiliente y simple.

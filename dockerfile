# Etapa 1: Construcción (Builder)
FROM maven:3.9.4-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
# Compilamos el .jar (omitimos los tests porque ya los hizo GitHub Actions)
RUN mvn clean package -DskipTests

# Etapa 2: Entorno de Producción
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
# Copiamos el .jar generado en la Etapa 1 (Maven en Spring Boot genera jars por defecto)
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
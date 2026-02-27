# Etapa 1: Construcción (Builder)
FROM maven:3.8-openjdk-11 AS builder
WORKDIR /app
COPY . .
# Compilamos el .war (omitimos los tests porque ya los hizo GitHub Actions)
RUN mvn clean package -DskipTests

# Etapa 2: Servidor de Aplicaciones (Producción)
FROM tomcat:9.0-jdk11-openjdk
# Borramos las apps por defecto de Tomcat por seguridad
RUN rm -rf /usr/local/tomcat/webapps/*
# Copiamos el .war generado en la Etapa 1 a la carpeta webapps de Tomcat
# Lo renombramos a ROOT.war para que sea la app principal
COPY --from=builder /app/target/*.war /usr/local/tomcat/webapps/ROOT.war

EXPOSE 8080
CMD ["catalina.sh", "run"]
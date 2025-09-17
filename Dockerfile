FROM openjdk:17-jre-slim

WORKDIR /app

COPY build/libs/rse-idam-simulator.jar /app/rse-idam-simulator.jar

EXPOSE 5556

CMD ["java", "-jar", "rse-idam-simulator.jar"]

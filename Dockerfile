# Usa una imagen oficial de Node.js basada en Alpine Linux para que sea super ligera (aprox 50MB)
FROM node:20-alpine

# Etiqueta para enlazar la imagen al repositorio de GitHub
LABEL org.opencontainers.image.source="https://github.com/PternaSec/cli-core"
LABEL org.opencontainers.image.description="CLI oficial del Framework PternaSec"
LABEL org.opencontainers.image.licenses="MIT"

# Crear y establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar primero los archivos de dependencias para aprovechar la caché de Docker
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código fuente
COPY . .

# Compilar TypeScript a JavaScript
RUN npm run build

# Dar permisos de ejecución al binario (por si acaso)
RUN chmod +x dist/bin/index.js

# Crear el directorio por defecto donde se descargarán las herramientas
RUN mkdir -p /root/.pternasec/scripts

# Definir el comando principal que se ejecutará al iniciar el contenedor
ENTRYPOINT ["node", "dist/bin/index.js"]

#!/bin/bash

# Variables
ARCHIVO_EXPORT="imagenes_docker.tar"
ARCHIVO_COMPOSE="docker-compose.yml"
ARCHIVO_ENV=".env"
ARCHIVO_ENV_LOCAL=".env-local"
CARPETA_EXPORT="export_docker"

# Crear carpeta temporal para exportar todo
mkdir -p $CARPETA_EXPORT

# 1. Detectar imágenes personalizadas usadas en el compose
IMAGENES=$(docker compose config | grep 'image:' | awk '{print $2}')

# 2. Guardar todas las imágenes en un solo archivo tar
docker save -o $CARPETA_EXPORT/$ARCHIVO_EXPORT $IMAGENES

# 3. Copiar archivos de configuración a la carpeta temporal
cp $ARCHIVO_COMPOSE $CARPETA_EXPORT/
[ -f $ARCHIVO_ENV ] && cp $ARCHIVO_ENV $CARPETA_EXPORT/
[ -f $ARCHIVO_ENV_LOCAL ] && cp $ARCHIVO_ENV_LOCAL $CARPETA_EXPORT/

# 4. Comprimir la carpeta para facilitar el traslado
zip -r export_docker.zip $CARPETA_EXPORT

echo "Exportación completada. Lleva el archivo export_docker.zip al PC Windows."

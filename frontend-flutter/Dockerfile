FROM instrumentisto/flutter:latest

WORKDIR /app

# Copia los archivos del proyecto (requiere haber ejecutado 'flutter create .' si vas probarlo sin compilar)
COPY . .

# Obtiene librerías como http, file_picker, etc.
# Usamos || true porque si no hay proyecto completo validado, evitará fallos de construcción prematuros
RUN flutter pub get || true

EXPOSE 3000

# Corre el servidor desarrollo de Web en el puerto 3000 que abrimos
CMD ["flutter", "run", "-d", "web-server", "--web-port", "3000", "--web-hostname", "0.0.0.0"]

# Comandos

## Node

### Listar processos
tasklist /FI "IMAGENAME eq node.exe"

### eLiminar processos
taskkill /F /IM node.exe

### Elimina la caché de npm
npm cache clean --force

### Reinstala las dependencias
npm install

### Inicia el servidor
npm start
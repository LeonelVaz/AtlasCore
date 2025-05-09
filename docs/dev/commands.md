# Comandos Útiles para Desarrollo

## Node

### Listar procesos
```bash
tasklist /FI "IMAGENAME eq node.exe"
```

### Eliminar procesos
```bash
taskkill /F /IM node.exe
```

### Eliminar la caché de npm
```bash
npm cache clean --force
```

### Reinstalar las dependencias
```bash
npm install
```

### Iniciar el servidor de desarrollo
```bash
npm start
```

## Git

### Ver el estado actual
```bash
git status
```

### Ver los cambios específicos en archivos
```bash
git diff
```

### Añadir todos los archivos modificados para el próximo commit
```bash
git add .
```

### Añadir un archivo específico
```bash
git add ruta/al/archivo.js
```

### Crear un commit con mensaje
```bash
git commit -m "Mensaje descriptivo"
```

### Subir cambios al repositorio remoto
```bash
git push origin main
```

### Obtener los últimos cambios del repositorio
```bash
git pull origin main
```

### Ver etiquetas existentes
```bash
git tag
```

### Crear una etiqueta anotada para versiones
```bash
git tag -a v0.1.0 -m "Descripción de la versión 0.1.0"
```

### Subir etiquetas al repositorio
```bash
git push origin v0.1.0    # Para una etiqueta específica
git push origin --tags    # Para todas las etiquetas nuevas
```

## Cambiar a otra rama
```bash
git checkout nombre_de_la_rama
```

# Volver a rama principal
```bash
git checkout main
```

# Crear una nueva rama

## Asegúrate de estar en main y tenerlo actualizado
```bash
git checkout main
git pull origin main
```

## Crea la nueva rama
```bash
git checkout -b feature/nuevos-componentes-calendario-stage2
```
## Confirma que estás en la nueva rama
```bash
git status
```
# Sube la nueva rama al repositorio remoto
```bash
git push -u origin feature/nuevos-componentes-calendario-stage2
```

## Vite (Desarrollo Frontend)

### Iniciar el servidor de desarrollo
```bash
npm run dev
```

### Construir para producción
```bash
npm run build
```

### Previsualizar la build
```bash
npm run preview
```

## Electron (Aplicación de Escritorio)

### Iniciar la aplicación Electron en modo desarrollo
```bash
npm run electron-dev
```

### Construir la aplicación Electron para producción
```bash
npm run electron-build
```

### Empaquetar la aplicación para diferentes plataformas
```bash
# Windows
npm run package-win

# macOS
npm run package-mac

# Linux
npm run package-linux
```

## Testing

### Ejecutar todas las pruebas
```bash
npm test
```

### Ejecutar pruebas con cobertura
```bash
npm run test:coverage
```

### Ejecutar pruebas específicas
```bash
npm test -- -t "nombre del test"
```

## Misceláneos

### Verificar formato de código
```bash
npm run lint
```

### Arreglar problemas de formato automáticamente
```bash
npm run lint:fix
```

### Generar documentación API
```bash
npm run docs
```

### Verificar dependencias y actualizaciones
```bash
npm outdated
```

### Actualizar todas las dependencias
```bash
npm update
```

### Iniciar servidor de documentación
```bash
npm run docs:serve
```

# Solución de Problemas Comunes

## Problemas con dependencias

Si encuentras errores después de actualizar dependencias o clonar el repositorio:

```bash
# Borrar node_modules y reinstalar
rm -rf node_modules
npm install

# Si es necesario, borrar también el lockfile
rm package-lock.json
npm install
```

## Errores de puertos en desarrollo

Si el puerto 3000 está ocupado:

```bash
# Encontrar el proceso que usa el puerto
# En Windows
netstat -ano | findstr :3000

# En macOS/Linux
lsof -i :3000

# Terminar el proceso (Windows, donde PID es el ID de proceso)
taskkill /F /PID PID
```

## Plugins no disponibles

Si los plugins no aparecen correctamente:

```bash
# Verificar la estructura de carpetas
ls -la src/plugins/

# Reconstruir el sistema de plugins
npm run rebuild-plugins
```

## Errores en build de Electron

En caso de problemas al construir la versión Electron:

```bash
# Limpiar caché y reconstruir módulos nativos
npm run electron-rebuild

# Verificar configuración específica de plataforma
npm run electron-config-check
```

Estos comandos cubren las operaciones más comunes en el desarrollo del proyecto Atlas y proporcionan soluciones a problemas frecuentes durante el proceso de desarrollo.
# Comandos Útiles para Desarrollo en Atlas Core

Esta guía recopila los comandos NPM y Git más utilizados durante el desarrollo del proyecto Atlas.

## Scripts NPM (Definidos en `package.json`)

### Desarrollo

- **Iniciar el servidor de desarrollo Vite (para la interfaz web):**

  ```bash
  npm run dev
  ```

  La aplicación estará disponible generalmente en `http://localhost:3000`.

- **Iniciar la aplicación Electron en modo desarrollo (con interfaz web):**
  ```bash
  npm run electron:dev
  ```
  Este comando ejecuta `npm run dev` y `electron .` concurrentemente.

### Compilación (Build)

- **Construir la interfaz web para producción:**

  ```bash
  npm run build
  ```

  Los archivos optimizados se generan en la carpeta `dist/`.

- **Previsualizar la build de producción localmente:**

  ```bash
  npm run preview
  ```

  Levanta un servidor local para ver el contenido de `dist/`.

- **Construir la aplicación Electron para producción:**
  ```bash
  npm run electron:build
  ```
  Este comando primero ejecuta `npm run build` (para la UI) y luego usa `electron-builder` para empaquetar la aplicación para tu plataforma actual. Los artefactos se encuentran en `dist_electron/`.

### Testing

- **Ejecutar todas las pruebas unitarias (Jest):**

  ```bash
  npm test
  ```

- **Ejecutar pruebas en modo "watch" (se re-ejecutan al guardar cambios):**

  ```bash
  npm run test:watch
  ```

- **Generar reporte de cobertura de pruebas:**

  ```bash
  npm run test:coverage
  ```

  El reporte se genera en la carpeta `coverage/`.

- **Ejecutar solo las pruebas del directorio `test/unit`:**

  ```bash
  npm run test:unit
  ```

- **Limpiar la caché de Jest:**
  ```bash
  npm run test:clear
  ```

### Linting

- **Verificar el formato del código (ESLint) en archivos JS/JSX de `src/`:**

  ```bash
  npm run lint
  ```

- **Arreglar automáticamente problemas de formato (ESLint):**
  ```bash
  npm run lint:fix
  ```

## Comandos Generales de Node.js y npm

- **Instalar/Reinstalar todas las dependencias del proyecto:**

  ```bash
  npm install
  ```

- **Limpiar la caché de npm (útil si hay problemas con dependencias):**

  ```bash
  npm cache clean --force
  ```

- **Verificar dependencias desactualizadas:**

  ```bash
  npm outdated
  ```

- **Actualizar dependencias (según `package.json`):**

  ```bash
  npm update
  ```

- **Listar procesos Node.js (Windows):**

  ```bash
  tasklist /FI "IMAGENAME eq node.exe"
  ```

- **Terminar todos los procesos Node.js (Windows):**
  ```bash
  taskkill /F /IM node.exe
  ```

## Comandos Git Esenciales

### Estado y Cambios

- **Ver el estado actual del repositorio (archivos modificados, por confirmar, etc.):**

  ```bash
  git status
  ```

- **Ver los cambios específicos realizados en los archivos (diferencias):**
  ```bash
  git diff
  # Para ver diferencias de un archivo específico:
  # git diff ruta/al/archivo.js
  ```

### Confirmar Cambios (Commits)

- **Añadir todos los archivos modificados y nuevos al área de preparación (staging):**

  ```bash
  git add .
  ```

- **Añadir un archivo específico al staging:**

  ```bash
  git add ruta/al/archivo.js
  ```

- **Crear un commit con los cambios en staging y un mensaje descriptivo:**
  ```bash
  git commit -m "feat: Añadida nueva funcionalidad X"
  # (Se recomienda seguir convenciones de commits, ej. Conventional Commits)
  ```

### Ramas (Branches)

- **Listar todas las ramas locales (la activa marcada con \*):**

  ```bash
  git branch
  ```

- **Cambiar a otra rama existente:**

  ```bash
  git checkout nombre_de_la_rama
  ```

- **Crear una nueva rama y cambiarse a ella:**

  ```bash
  git checkout -b nombre-nueva-rama
  # Ejemplo: git checkout -b feature/nueva-interfaz-calendario
  ```

- **Volver a la rama de desarrollo principal (asumiendo que es `feature/development`):**

  ```bash
  git checkout feature/development
  ```

- **Fusionar cambios de otra rama a la actual:**

  ```bash
  # Estando en la rama destino (ej. feature/development)
  git merge nombre-rama-a-fusionar
  ```

- **Eliminar una rama local (después de fusionada):**
  ```bash
  git branch -d nombre_rama_a_eliminar
  ```

### Repositorio Remoto (ej. GitHub)

- **Subir los commits de tu rama local al repositorio remoto (ej. `origin`):**

  ```bash
  git push origin nombre-tu-rama
  # Para la rama principal de desarrollo:
  # git push origin feature/development
  ```

- **Obtener los últimos cambios del repositorio remoto y fusionarlos a tu rama local:**

  ```bash
  git pull origin nombre-rama-actual
  # Usualmente para feature/development:
  # git pull origin feature/development
  ```

- **Clonar un repositorio existente:**
  ```bash
  git clone URL_DEL_REPOSITORIO
  ```

### Tags y Releases (Ver también `guide-versions.md`)

- **Listar todas las etiquetas (tags) existentes:**

  ```bash
  git tag
  ```

- **Crear una etiqueta anotada (recomendado para versiones):**

  ```bash
  git tag -a v0.3.0 -m "Release v0.3.0 - Personalización y Plugins"
  ```

- **Subir una etiqueta específica al repositorio remoto:**

  ```bash
  git push origin v0.3.0
  ```

- **Subir todas las etiquetas nuevas al repositorio remoto:**
  ```bash
  git push origin --tags
  ```

### Revertir y Resetear (Usar con precaución)

- **Deshacer cambios en un archivo (antes de `git add`):**

  ```bash
  git checkout -- ruta/al/archivo.js
  ```

- **Quitar un archivo del staging (después de `git add` pero antes de `commit`):**

  ```bash
  git reset HEAD ruta/al/archivo.js
  ```

- **Revertir el último commit (crea un nuevo commit que deshace los cambios):**

  ```bash
  git revert HEAD
  ```

- **Resetear la rama local a un commit específico de `main` (¡Descarta cambios locales no commiteados!):**
  ```bash
  # Estando en tu rama (ej. feature/mi-rama)
  git fetch origin
  git reset --hard origin/main
  # (Esto hará que tu rama local sea idéntica a origin/main)
  ```

---

Estos comandos cubren las operaciones más comunes. Consulta la [documentación de Git](https://git-scm.com/doc) y [npm](https://docs.npmjs.com/) para más detalles.
Recuerda seguir el flujo de trabajo de Git definido en `docs/guide-versions.md`.

# Guía de Versionado para Atlas

Este documento describe el enfoque simplificado que seguiremos para manejar las versiones del proyecto Atlas. Está diseñado para ser práctico y directo, minimizando la complejidad.

## Esquema de Versionado

Usaremos el formato estándar de tres números: `MAYOR.MENOR.PARCHE` (por ejemplo: 0.1.0)

- **MAYOR (X.0.0)**: Cambios importantes que modifican significativamente la aplicación
- **MENOR (0.X.0)**: Nuevas funcionalidades que no rompen compatibilidad
- **PARCHE (0.0.X)**: Correcciones de errores y pequeñas mejoras

Durante la fase inicial de desarrollo, mantendremos el primer número en 0 (por ejemplo, 0.1.0, 0.2.0, etc.), indicando que estamos en desarrollo pre-lanzamiento.

## Etapas y Versiones Correspondientes

Basado en nuestro plan de desarrollo, usaremos el siguiente esquema:

| Etapa | Versión | Descripción |
|-------|---------|-------------|
| 1     | 0.1.0   | Fundamentos - Arquitectura base y calendario funcional mínimo |
| 2     | 0.2.0   | Mejoras de Interacción y Persistencia |
| 3     | 0.3.0   | Personalización y Primeros Plugins |
| 4     | 0.4.0   | Robustez y Plugins Esenciales |
| 5     | 0.5.0   | Análisis y Ecosistema Completo |
| 6     | 1.0.0   | Pulido y Lanzamiento - Primera versión estable |

## Procedimiento Simplificado de Versionado

### Para el Desarrollo Diario

1. Trabaja normalmente en tu código, haciendo cambios según sea necesario
2. Cuando termines una sesión de trabajo:
   ```bash
   # Guarda todos tus cambios
   git add .
   
   # Crea un commit con un mensaje descriptivo
   git commit -m "Añadida funcionalidad X" o "Corregido problema Y"
   
   # Sube los cambios al repositorio
   git push origin main
   ```

### Para Marcar una Versión Completa

Cuando hayas completado una etapa (por ejemplo, la Etapa 1) y quieras crear la versión 0.1.0:

1. Asegúrate de que todos tus cambios estén guardados, confirmados y subidos:
   ```bash
   git add .
   git commit -m "Completada Etapa 1 - Versión 0.1.0"
   git push origin main
   ```

2. Crea una etiqueta (tag) para esta versión:
   ```bash
   git tag -a v0.1.0 -m "Versión 0.1.0 - Fundamentos completados"
   git push origin v0.1.0
   ```

3. Crea una Release en GitHub (opcional pero recomendado):
   - Ve a tu repositorio en GitHub
   - Haz clic en "Releases" en la barra lateral derecha
   - Haz clic en "Draft a new release"
   - Selecciona el tag que acabas de crear (v0.1.0)
   - Agrega un título (ej. "Atlas v0.1.0")
   - Describe los cambios y características principales
   - Haz clic en "Publish release"

## Archivo de Cambios (CHANGELOG.md)

Mantendremos un archivo `CHANGELOG.md` en la raíz del proyecto para documentar los cambios en cada versión. Aquí hay un ejemplo de cómo estructurarlo:

```markdown
# Registro de Cambios (Changelog)

## [0.1.0] - YYYY-MM-DD
### Añadido
- Estructura modular base
- Sistema de Bus de Eventos
- Calendario básico funcional
- Almacenamiento simple con localStorage

### Corregido
- [Si aplica, lista de correcciones]

## [0.0.1] - YYYY-MM-DD
### Añadido
- Configuración inicial del proyecto
- [Otros elementos iniciales]
```

## Comandos Git Esenciales para Referencia

```bash
# Ver el estado actual (qué archivos han cambiado)
git status

# Ver los cambios específicos en archivos
git diff

# Añadir todos los archivos modificados para el próximo commit
git add .

# Añadir un archivo específico
git add ruta/al/archivo.js

# Crear un commit con mensaje
git commit -m "Mensaje descriptivo"

# Subir cambios al repositorio remoto
git push origin main

# Obtener los últimos cambios del repositorio
git pull origin main

# Ver etiquetas existentes
git tag

# Crear una etiqueta anotada (recomendado para versiones)
git tag -a v0.1.0 -m "Descripción de la versión 0.1.0"

# Subir etiquetas al repositorio
git push origin v0.1.0    # Para una etiqueta específica
git push origin --tags    # Para todas las etiquetas nuevas
```

## Consejos para un Flujo de Trabajo Más Sencillo

1. **Commits frecuentes**: Realiza commits pequeños y frecuentes, cada vez que implementes una característica o corrijas un error.

2. **Mensajes descriptivos**: Usa mensajes de commit claros que expliquen qué cambió y por qué.

3. **Mantén sincronizado**: Usa `git pull` con frecuencia para mantener tu copia local actualizada si trabajas desde diferentes equipos.

4. **Crea etiquetas solo para hitos importantes**: No necesitas crear una etiqueta para cada pequeño cambio, solo para versiones completas.

5. **Considera usar una herramienta gráfica**: Aplicaciones como GitHub Desktop, GitKraken o SourceTree pueden hacer más fácil el trabajo con Git si prefieres interfaces visuales a comandos.

---

Este enfoque simplificado te permitirá mantener un buen control de versiones sin complicarte demasiado con flujos de trabajo avanzados de Git. A medida que te familiarices más con Git, puedes explorar técnicas más avanzadas como el trabajo con ramas (branching) y las solicitudes de fusión (pull requests).

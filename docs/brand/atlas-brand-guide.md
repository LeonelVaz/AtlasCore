# Guía de Identidad de Marca de Atlas

## 1. Introducción

Bienvenido a la guía de identidad de marca de Atlas. Este documento establece las directrices para el uso de los elementos visuales y verbales de nuestra marca, asegurando consistencia y reconocimiento en todas las comunicaciones y extensiones de la aplicación Atlas.

Atlas es una plataforma de gestión del tiempo modular, potente y personalizable. Nuestra identidad de marca busca reflejar estos valores: **confianza, organización, modernidad, flexibilidad, modularidad y claridad.**

## 2. Logotipo

### 2.1. Logotipo Principal (`logo.ico` y `logo-white.png`)

- **Descripción:** El logotipo principal de Atlas consiste en las letras estilizadas "AT". La fragmentación presente en ambas letras, especialmente los cortes en la "T", simboliza la **modularidad** y la **interconexión** de los componentes de la aplicación. Las letras se presentan una al lado de la otra, manteniendo su individualidad pero formando un conjunto cohesivo.
- **Archivos:**
  - `logo.ico`: Muestra las letras "AT" en color blanco sobre el fondo azul oscuro principal de la marca.
  - `logo-white.png`: Muestra las letras "AT" en color blanco con fondo transparente. Esta es la versión preferida para usar sobre fondos oscuros o de color dentro de la aplicación y en materiales de marketing.
- **Uso Preferido:**
  - `logo-white.png`: Para el encabezado de la aplicación (como se ve en `src/app.jsx`), sobre fondos de los temas oscuros, o cuando se necesite contraste sobre un fondo de color.
  - `logo.ico`: Para contextos donde se necesite el logo con su fondo de marca característico (ej. avatares de redes sociales, algunos materiales impresos).

### 2.2. Variaciones del Logotipo

- **Isotipo/Icono (Potencial):** Aunque las letras "A" y "T" están lado a lado, la forma estilizada de la "A" o una combinación abstracta de sus elementos podría explorarse en el futuro para un icono de aplicación o favicon si se requiere una versión muy compacta. Por ahora, se prioriza el uso de "AT".
- **Versión para Fondos Claros:** Se necesitará una versión del logotipo (las letras "AT") en el color azul oscuro principal de la marca (o un gris muy oscuro) para usar sobre fondos blancos o muy claros. _(Actualmente no definida explícitamente, pero necesaria para versatilidad)._
- **Versión Monocromática:** Además de `logo-white.png`, se deben considerar versiones completamente negras o en un solo color del tema para casos de uso específicos (ej. impresión en una tinta, fondos donde el blanco no contraste bien).

### 2.3. Uso Incorrecto del Logotipo

- No distorsionar, estirar, inclinar o rotar el logotipo.
- No cambiar los colores de las letras (blanco) o el fondo principal (azul oscuro) fuera de las variaciones aprobadas.
- No añadir efectos como sombras, biseles, degradados o contornos no especificados.
- No separar los elementos de la "A" y la "T" de forma que se pierda su relación.
- No colocar `logo-white.png` sobre fondos blancos o muy claros donde la legibilidad se vea comprometida. Usar la versión para fondos claros en esos casos.
- Mantener un **espacio libre mínimo** alrededor del logotipo equivalente a la altura del travesaño de la "T" en todos sus lados. Esto asegura que el logo respire y no se vea ahogado por otros elementos.

_(Cuando se creen versiones SVG, se incluirán aquí y se detallará su uso preferente para escalabilidad)._

## 3. Paleta de Colores

La paleta de colores de Atlas está diseñada para ser moderna, profesional y adaptable.

### 3.1. Colores Primarios de Marca (Añadir)

### 3.2. Colores Secundarios y de Acento (Ejemplos de Temas) (Añadir)

### 3.3. Escala de Grises (Añadir)

### 3.4. Uso en Temas

Atlas soporta múltiples temas. Cada tema (Por ejemplo: `light.css`, `dark.css`, `atlas-dark-blue.css`, `purple-night.css`, `deep-ocean.css`) redefine un conjunto de variables CSS (`--primary-color`, `--bg-color`, `--text-color`, etc.) para crear una apariencia coherente.
**Los plugins DEBEN usar estas variables CSS de tema** para asegurar su integración visual y adaptabilidad.

## 4. Tipografía

La tipografía de Atlas busca ser legible, moderna y versátil.

### 4.1. Fuentes Principales (Definidas en `src/styles/variables.css`)

- **Encabezados (`--font-family-heading`):** Montserrat
  - Uso: Títulos principales, encabezados de sección.
  - Pesos: Predominantemente `600` (Semibold) o `700` (Bold).
- **Cuerpo de Texto (`--font-family-body`):** Inter
  - Uso: Párrafos, etiquetas, contenido principal de la aplicación.
  - Pesos: `400` (Regular) para cuerpo, `500` (Medium) para énfasis.
- **Monoespaciada (`--font-family-mono`):** Fira Mono
  - Uso: Visualización de código, URLs, identificadores técnicos, y en algunas áreas de depuración.

### 4.2. Jerarquía Tipográfica (Ejemplo)

- **Título de Aplicación (Logo en Header):** Tipografía del logo "AT" (actualmente es una imagen `logo-white.png`).
- **Título de Sección Principal (ej. "Configuración", nombre de la página del plugin):** Montserrat, Semibold/Bold, ~20-28px (ej. `plugins-panel-title`, `notes-header-title`).
- **Subtítulos/Encabezados de Grupo (ej. en SettingsPanel):** Montserrat o Inter, Semibold/Medium, ~16-20px (ej. `settings-section-title`).
- **Cuerpo de Texto:** Inter, Regular, ~14-16px (texto base de la aplicación).
- **Etiquetas y Metadatos:** Inter, Regular/Medium, ~12-14px, a menudo con `--text-color-secondary`.

## 5. Tono de Voz y Estilo de Comunicación

La comunicación de Atlas debe ser:

- **Clara y Concisa:** Evitar la jerga innecesaria. Ir directo al grano.
- **Profesional pero Amigable:** Mantener un tono respetuoso, útil y accesible.
- **Empoderadora:** Enfocarse en cómo Atlas ayuda al usuario a organizar su tiempo y lograr sus objetivos con flexibilidad.
- **Confiable:** Transmitir solidez, estabilidad y seguridad, especialmente en relación con los datos del usuario y el sistema de plugins.
- **Modular y Flexible:** Resaltar la capacidad de adaptación y personalización de la aplicación.

**Ejemplos:**

- _En lugar de:_ "El subsistema de persistencia de eventos falló debido a una excepción de I/O."
- _Preferir (en UI):_ "Error al guardar el evento. Por favor, inténtalo de nuevo."
- _Preferir (en logs):_ `[StorageService] Error al guardar evento XYZ: [Detalle del error I/O]`.

- _Para una nueva característica de plugin:_ "¡Nuevo en el Gestor de Notas! Ahora puedes vincular tus notas directamente a eventos del calendario para una organización impecable."

## 6. Iconografía

- **Fuente de Iconos Principal:** Material Icons.
  - Se incluye mediante enlace CDN en `index.html`.
  - Se utiliza extensivamente en la UI de Atlas y en los plugins de ejemplo (ej. `<span class="material-icons">calendar_today</span>`).
  - **Recomendación:** Los desarrolladores de plugins deben preferir Material Icons para mantener la consistencia visual.
- **Estilo:** Generalmente se usan en su forma estándar (filled).
- **Color:** Los iconos suelen heredar el color del texto (`currentColor`) o utilizar colores de acento del tema actual (ej. `--primary-color` para iconos en botones de acción o activos).
- **Consistencia:** Usar iconos que sean intuitivos y universalmente reconocidos para las acciones que representan.

## 7. Uso en Plugins

Se espera que los desarrolladores de plugins para Atlas sigan esta guía de marca en la medida de lo posible para asegurar que sus plugins se sientan como una parte integrada y coherente de la aplicación.

- **Logotipo del Plugin (si aplica):** Si un plugin tiene su propio logo, este no debe competir visualmente con el logo de Atlas. Debe ser claramente distinguible y respetar el espacio de la marca Atlas.
- **Colores:** **Utilizar las variables CSS de tema expuestas por Atlas** (ej. `var(--primary-color)`, `var(--bg-color-secondary)`, `var(--text-color)`). Esto es crucial para que el plugin se adapte a los diferentes temas de Atlas.
- **Tipografía:** Preferir el uso de las familias de fuentes definidas en las variables CSS de Atlas (ej. `var(--font-family-body)`, `var(--font-family-heading)`).
- **Iconografía:** Utilizar Material Icons para acciones comunes. Si se requieren iconos personalizados, deben seguir un estilo visual similar.
- **Componentes UI del Core:** Siempre que sea posible, utilizar los componentes UI reutilizables que Atlas pueda exponer a través del `coreAPI` (ej. `Button`, `Dialog`, `RichTextEditor`) para mantener la consistencia en la experiencia de usuario.

## 8. Actualizaciones de la Guía

Esta guía de marca se actualizará a medida que el proyecto Atlas y su identidad visual evolucionen. Consulta siempre la última versión en la documentación del proyecto para asegurar la alineación con los estándares más recientes.

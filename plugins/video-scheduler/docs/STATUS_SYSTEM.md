# Sistema de Estados del Planificador de Videos

## ¿Qué es el sistema de estados?

El planificador de videos usa **emojis** para mostrar en qué etapa se encuentra cada video que planificas. Es como una etiqueta visual que te dice "este video está en grabación", "este ya está publicado", etc.

## Estados Principales (Solo puede tener uno)

Cada video tiene un **estado principal** representado por un emoji de color:

### 📅 **PENDING (Pendiente)**

- **Qué significa**: El horario está reservado pero aún no decidiste qué video hacer
- **Cuándo aparece**: Es el estado inicial de todos los slots
- **Qué puedes hacer**:
  - Escribir el nombre del video (automáticamente cambia a Development)
  - **Hacer click para cambiarlo manualmente** a cualquier otro estado

### ⬜ **EMPTY (Vacío)**

- **Qué significa**: No habrá video en este horario
- **Cuándo usarlo**: Cuando decides no programar nada en esa fecha/hora
- **Qué puedes hacer**: Cambiarlo a otro estado si te arrepientes

### 🟦 **DEVELOPMENT (Desarrollo)**

- **Qué significa**: El video está en preparación/grabación
- **Cuándo aparece**: Automáticamente cuando escribes un nombre en un slot Pending
- **Qué incluye**: Planificación, guión, grabación

### 🟨 **PRODUCTION (Producción)**

- **Qué significa**: El video ya está grabado y se está procesando
- **Qué incluye**: Edición, thumbnail, programación de publicación

### 🟩 **PUBLISHED (Publicado)**

- **Qué significa**: El video ya está online y disponible
- **Estado final**: Ya completaste todo el proceso

## Sub-estados Normales (Solo puede tener uno)

Algunos estados principales pueden tener **sub-estados** que dan más detalle:

### Para 🟦 DEVELOPMENT:

- **☕ REC**: Estás grabando el video

### Para 🟨 PRODUCTION:

- **💻 EDITING**: Estás editando el video
- **✏️ THUMBNAIL**: Estás creando la miniatura
- **🕰️ SCHEDULING_POST**: Estás programando la publicación

### Para 🟩 PUBLISHED:

- **🌐 SCHEDULED**: El video está programado y se publicará automáticamente
  - **⚠️ Importante**: Solo aparece en fechas **futuras**
  - **Qué significa**: "El video está listo y programado, pero aún no llega la fecha de publicación"
  - **Transición automática**: Cuando pasa la fecha, 🟩🌐 se convierte automáticamente en 🟩

**Ejemplo**: 🟨💻 significa "Video en producción, específicamente editando"

## Sub-estados Apilables (Puede tener varios)

Estos son **especiales** porque se pueden combinar con cualquier estado:

### ❓ **DUDA DEL USUARIO**

- **Quién lo pone**: Solo TÚ
- **Qué significa**: "Sé que tengo que revisar/cambiar esto pero no estoy seguro del estado actual"
- **Cuándo usarlo**: Cuando te olvidas en qué etapa está un video y necesitas revisarlo
- **Ejemplo**: 🟦☕❓ = "Creo que estaba grabando, pero no estoy seguro"

### ❗ **ALERTA DEL SISTEMA**

- **Quién lo pone**: Solo el SISTEMA automáticamente
- **Qué significa**: "Algo no tiene sentido, revísalo"
- **Cuándo aparece**:
  - Un video en desarrollo/producción pasa a fecha pasada sin actualizar
  - Pones estados ilógicos en fechas pasadas
  - **📅❗ PENDING con nombre**: Tienes nombre escrito pero el estado sigue siendo "pendiente"
  - **⬜❗ EMPTY con nombre**: Tienes nombre escrito pero el estado dice "no programar"
- **Ejemplos**:
  - 🟦☕❗ = "El sistema detectó que este video en grabación ya pasó de fecha"
  - 📅❗ = "Tienes nombre pero el estado sigue en pendiente"
  - ⬜❗ = "Tienes nombre pero el estado dice 'no programar'"

## Cómo Funciona en Tiempo Pasado

### Lo que NO puede existir en el pasado:

- **📅 PENDING**: Se convierte automáticamente en ⬜ EMPTY
- **🟩🌐 PUBLISHED+SCHEDULED**: Se convierte automáticamente en 🟩 PUBLISHED

### Lo que SÍ tiene sentido en el pasado:

- **⬜ EMPTY**: "No hice video ese día"
- **🟩 PUBLISHED**: "Publiqué el video ese día" (ya no necesita el 🌐 porque ya se publicó)

### Lo que técnicamente puedes poner pero no tiene sentido:

- **🟦 DEVELOPMENT** o **🟨 PRODUCTION**: El sistema te avisará con ❗ pero no te lo impedirá

## Control Total del Usuario

**Importante**: Puedes hacer **click en cualquier emoji de estado** para cambiarlo manualmente, incluyendo:

- 📅 PENDING - Ahora también es clickeable
- ⬜ EMPTY - Siempre fue clickeable
- 🟦 🟨 🟩 - Todos clickeables

El sistema **nunca te bloquea**, solo te informa con ❗ cuando algo puede necesitar atención.

## Transiciones Automáticas del Sistema

### Al pasar la fecha (de futuro a pasado):

1. **📅** → **⬜** (Pending se vacía)
2. **🟩🌐** → **🟩** (Ya no está "programado", simplemente "publicado")
3. **🟦, 🟨** → **🟦❗, 🟨❗** (Advierte que no tiene sentido en el pasado)

### Por acciones del usuario:

1. Escribir nombre en **📅** → **🟦**
2. Borrar nombre completamente → **📅**

### Por acciones del usuario en pasado:

1. Escribir nombre en **⬜** → **🟦❗** (Development + alerta porque no tiene sentido en el pasado)
2. Borrar nombre completamente → **⬜**

### Alertas automáticas por inconsistencias:

1. **📅 con nombre** → **📅❗** (debería ser 🟦)
2. **⬜ con nombre** → **⬜❗** (no tiene sentido)

## Ejemplos Prácticos

### Progresión normal de un video:

1. **📅** → Escribes nombre → **🟦** → Grabas → **🟦☕**
2. **🟦☕** → Terminas grabación → **🟨💻** (editando)
3. **🟨💻** → Terminas edición → **🟨✏️** (thumbnail)
4. **🟨✏️** → Terminas thumbnail → **🟨🕰️** (programando)
5. **🟨🕰️** → Publicas y programas → **🟩🌐** (publicado para el futuro)
6. **🟩🌐** → Pasa la fecha → **🟩** (ya está publicado)

### Situaciones con sub-estados apilables:

- **🟨💻❓**: "Estoy editando pero no recuerdo en qué parte iba"
- **🟦☕❗**: "El sistema me avisa que este video 'en grabación' ya pasó de fecha"
- **📅❗**: "Tengo nombre escrito pero el estado sigue en pendiente"
- **⬜❗**: "Tengo nombre escrito pero el estado dice 'no programar'"
- **🟩🌐❓**: "Está programado pero tengo dudas sobre algo"
- **🟨✏️❓❗**: "Tengo dudas sobre el thumbnail Y el sistema detectó algo raro"

## Consejos de Uso

1. **No tengas miedo de experimentar**: Puedes cambiar los estados cuando quieras - **todos son clickeables**
2. **Usa ❓ cuando tengas dudas**: Es mejor marcarlo que olvidarlo
3. **Presta atención a ❗**: El sistema te está avisando algo importante
4. **Los estados en tiempo pasado**: Solo ⬜ EMPTY y 🟩 PUBLISHED tienen sentido real
5. **🟩🌐 vs 🟩**: El primero es "programado para publicarse", el segundo es "ya publicado"
6. **Control total**: Puedes hacer click en 📅 PENDING para cambiarlo manualmente si necesitas

El sistema está diseñado para ser **flexible y no invasivo**: nunca te bloquea, solo te informa visualmente del estado de tus videos y hace transiciones automáticas lógicas cuando cambia el tiempo.

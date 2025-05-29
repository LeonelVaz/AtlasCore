# Propuesta de Estandarización del Manejo de Fechas y Horas en Atlas Core

**Versión del Documento:** 1.0  
**Autor:** Asistente AI (basado en requerimientos)  
**Dirigido a:** Equipo de Desarrollo de Atlas Core v0.4.0  

## 1. Introducción

Durante el desarrollo y las pruebas de la aplicación Atlas Core, hemos identificado la necesidad de estandarizar el manejo de fechas y horas para mejorar la robustez, consistencia y evitar posibles bugs relacionados con las zonas horarias. Esta propuesta describe las directrices generales para lograrlo.

## 2. Objetivos Principales

1. **Consistencia de Datos:** Asegurar que todas las fechas y horas se almacenen y procesen internamente de una manera uniforme y predecible.
2. **Precisión para el Usuario:** Garantizar que los usuarios siempre vean las fechas y horas correctamente adaptadas a su contexto local o a su zona horaria preferida.
3. **Interoperabilidad:** Facilitar la integración con sistemas externos o APIs que puedan tener sus propios requisitos de formato de fecha/hora.
4. **Mantenibilidad:** Reducir la complejidad y la probabilidad de errores futuros relacionados con el manejo de fechas.

## 3. Estrategia General Propuesta

La estrategia recomendada es adoptar **UTC (Tiempo Universal Coordinado)** como el estándar para todas las operaciones internas y de almacenamiento, y realizar conversiones a la zona horaria del usuario únicamente en la capa de visualización.

## 4. Acciones Clave a Realizar

### 4.1. Almacenamiento y Lógica Interna en UTC

- **Auditoría:** Revisar todas las partes de la aplicación donde se crean, almacenan, manipulan o transmiten fechas y horas.
- **Estándar de Almacenamiento:** Definir UTC como el estándar para guardar fechas en cualquier almacenamiento persistente (localStorage, IndexedDB, y especialmente si se interactúa con un backend).
- **Procesamiento Interno:** Realizar todos los cálculos, comparaciones y lógica de negocio que involucren fechas/horas utilizando representaciones UTC o timestamps UTC para evitar ambigüedades.
- **Creación de Fechas:** Al crear nuevas instancias de `Date`, ser explícitos sobre si representan un instante UTC o un instante local. Preferir la construcción de fechas UTC cuando la lógica no dependa inherentemente de la localidad del usuario (ej. `new Date(Date.UTC(...))`).

### 4.2. Manejo de Entradas del Usuario

- Cuando los usuarios ingresen fechas y/o horas (a través de selectores de fecha, inputs, etc.), estos valores generalmente estarán en su zona horaria local.
- **Conversión a UTC:** Antes de procesar internamente o guardar estas entradas, convertirlas a UTC.

### 4.3. Visualización para el Usuario (Conversión a Local)

- **Capa de Presentación:** La conversión de fechas UTC a la zona horaria del usuario debe realizarse únicamente en la capa de presentación, justo antes de mostrar la información al usuario.
- **Detección de Zona Horaria:** Utilizar la zona horaria del navegador del usuario como el valor por defecto para la visualización. La API `Intl.DateTimeFormat` de JavaScript es la herramienta estándar para esto.
- **Formato:** Asegurar que el formato de visualización sea coherente y claro para el usuario, respetando sus configuraciones regionales de ser posible.

### 4.4. Configuración de Zona Horaria por el Usuario (Nueva Funcionalidad)

- **Implementación:** Desarrollar una nueva sección en el panel de configuración que permita a los usuarios seleccionar explícitamente su zona horaria preferida de una lista de zonas horarias estándar (ej., usando identificadores IANA como "America/New_York", "Europe/London").
- **Almacenamiento:** Guardar esta preferencia del usuario de forma persistente.
- **Aplicación:** Si el usuario ha configurado una zona horaria preferida, esta debe tener precedencia sobre la zona horaria detectada del navegador para todas las visualizaciones de fecha/hora en la aplicación. La API `Intl.DateTimeFormat` permite especificar una `timeZone`.

### 4.5. APIs y Comunicación Externa

- Si la aplicación se comunica con APIs externas o un backend, asegurar que todas las fechas intercambiadas utilicen el formato estándar ISO 8601 con el designador UTC (`Z`), por ejemplo: `YYYY-MM-DDTHH:mm:ss.sssZ`.

## 5. Consideraciones Adicionales

- **Bibliotecas de Fechas:** Evaluar el uso de bibliotecas de manejo de fechas robustas (como `date-fns`, `date-fns-tz`, `Luxon`) que pueden simplificar enormemente las conversiones, el formateo y la manipulación de fechas a través de diferentes zonas horarias.
- **Componentes Reutilizables:** Cualquier componente que maneje o muestre fechas debería ser consciente de esta estrategia y, idealmente, operar con fechas UTC internamente, aceptando o convirtiendo a UTC en sus props y convirtiendo a local solo para mostrar.
- **Testing:** Actualizar o crear tests unitarios y de integración para verificar el correcto manejo de fechas, conversiones de zona horaria y la nueva funcionalidad de selección de zona horaria. Los mocks de fechas en los tests deben ser manejados cuidadosamente para reflejar la zona horaria esperada o UTC.

## 6. Beneficios Esperados

- Reducción significativa de bugs relacionados con la incorrecta interpretación de horas en diferentes regiones.
- Una base de código más predecible y fácil de mantener en lo referente a fechas.
- Mejora de la experiencia del usuario al ver las horas correctamente ajustadas a su contexto.
- Preparación de la aplicación para una posible expansión a usuarios en múltiples zonas horarias globales.
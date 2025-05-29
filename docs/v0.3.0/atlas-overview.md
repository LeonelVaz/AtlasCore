# Visión General de Atlas

## ¿Qué es Atlas y para qué sirve?

Atlas es una aplicación de escritorio modular y altamente personalizable diseñada para la gestión avanzada del tiempo y la organización de tareas. Su arquitectura, basada en un sistema de eventos y un robusto núcleo extensible mediante plugins, permite a los usuarios adaptar la aplicación a sus flujos de trabajo específicos, y a los desarrolladores crear nuevas funcionalidades de manera integrada.

El objetivo principal de Atlas es ofrecer una herramienta centralizada donde los usuarios puedan visualizar, planificar y gestionar sus actividades, eventos y proyectos relacionados con el tiempo, con un fuerte énfasis en la flexibilidad y la personalización.

## Filosofía y Objetivos del Proyecto

La filosofía detrás de Atlas se centra en:

- **Modularidad:** Permitir que la aplicación crezca y se adapte a través de componentes independientes (plugins) que pueden ser añadidos, actualizados o eliminados sin afectar el núcleo del sistema.
- **Extensibilidad:** Facilitar a los desarrolladores la creación de nuevas funcionalidades mediante una API de Core bien definida y múltiples puntos de extensión en la interfaz de usuario.
- **Personalización:** Ofrecer a los usuarios finales un alto grado de control sobre la apariencia (temas) y el comportamiento (escalas de tiempo, configuración de plugins) de la aplicación.
- **Robustez y Seguridad:** Asegurar un funcionamiento estable y proteger los datos del usuario, especialmente al integrar código de terceros a través de plugins.
- **Experiencia de Usuario Intuitiva:** A pesar de su potencial complejidad interna, la interfaz de usuario busca ser clara y fácil de usar.

Los objetivos principales del proyecto Atlas son:

1.  Proporcionar una plataforma de gestión del tiempo sólida y adaptable.
2.  Crear un ecosistema de plugins que enriquezca la funcionalidad base.
3.  Ofrecer herramientas de desarrollo y depuración para facilitar la contribución y la creación de plugins.
4.  Garantizar la seguridad y la integridad de la aplicación y los datos del usuario al interactuar con extensiones.
5.  Evolucionar continuamente en base a las necesidades de los usuarios y los avances tecnológicos.

## Funcionalidades Principales (Perspectiva del Usuario - v0.3.0)

Atlas, en su versión 0.3.0, ofrece las siguientes funcionalidades principales:

- **Calendario Avanzado:**
  - Visualización en vista semanal y diaria.
  - Creación, edición y eliminación de eventos.
  - Interacciones avanzadas como arrastrar y soltar eventos, y redimensionar su duración.
  - Sistema de "snap" (imán) para alineación precisa de eventos.
  - Personalización de la densidad visual (escala de tiempo) y franjas horarias.
- **Gestión de Plugins:**
  - **Marketplace de Plugins:** Explorar, instalar y gestionar plugins de repositorios.
  - **Gestión de Repositorios:** Añadir y sincronizar fuentes de plugins.
  - **Actualizaciones de Plugins:** Verificar e instalar actualizaciones para los plugins.
  - Panel para activar/desactivar plugins instalados.
- **Personalización de la Interfaz:**
  - **Sistema de Temas:** Múltiples temas predefinidos (Claro, Oscuro, Atlas Dark Blue, Púrpura Nocturno, Deep Ocean) para cambiar la apariencia completa de la aplicación.
  - Configuración de la escala de tiempo del calendario.
  - Editor de franjas horarias personalizadas.
- **Seguridad y Control:**
  - Panel de seguridad para gestionar permisos de plugins (próximamente visible para el usuario).
  - Niveles de seguridad configurables para la ejecución de plugins (principalmente para desarrolladores en esta etapa).
- **Herramientas para Desarrolladores:**
  - Panel de desarrolladores con opciones para depuración.
  - Debugger de eventos flotante para monitorear la actividad del sistema.
- **Plugins Esenciales (Integrados/Ejemplos):**
  - **Contador de Eventos Pro:** Añade badges personalizables a los días del calendario indicando el número de eventos.
  - **Gestor de Notas Avanzado:** Permite crear notas con formato enriquecido y vincularlas a eventos del calendario.
  - **Planificador de Videos:** Herramienta especializada para planificar contenido de video con estados detallados, gestión de ingresos y calendario mensual específico.

## Casos de Uso Típicos

- **Profesionales y Freelancers:** Para organizar su jornada laboral, reuniones, plazos de proyectos y tareas. La vinculación de notas a eventos es útil para preparar reuniones o seguir el progreso de tareas.
- **Creadores de Contenido:** El plugin "Planificador de Videos" está específicamente diseñado para ellos, permitiendo gestionar todo el ciclo de producción de videos.
- **Estudiantes:** Para llevar un seguimiento de clases, entregas, y periodos de estudio.
- **Usuarios Técnicos y Desarrolladores:** Que deseen una herramienta de gestión del tiempo que puedan extender y personalizar a su gusto, o incluso contribuir con nuevos plugins.
- **Cualquier persona que busque una solución de calendario potente y adaptable:** Más allá de los calendarios básicos, Atlas ofrece una capa de personalización y funcionalidad adicional a través de sus plugins.

## Beneficios y Propuesta de Valor

- **Adaptabilidad sin precedentes:** Gracias a su arquitectura de plugins, Atlas puede transformarse para satisfacer necesidades muy específicas.
- **Control del Usuario:** El usuario tiene un control significativo sobre la apariencia y el comportamiento de la aplicación.
- **Ecosistema en Crecimiento:** La capacidad de añadir nuevas funcionalidades mediante plugins significa que Atlas puede evolucionar constantemente.
- **Desarrollo Transparente (para contribuyentes):** Con herramientas de depuración y una arquitectura clara, se facilita la contribución.
- **Centralización:** Permite gestionar diversos aspectos de la organización del tiempo (calendario, notas, planificación específica de proyectos) en una sola aplicación.

## Público Objetivo

- **Usuarios avanzados de calendarios:** Aquellos que encuentran limitadas las opciones de calendarios tradicionales y buscan más control y funcionalidad.
- **Desarrolladores y entusiastas de la tecnología:** Que valoran la modularidad, la extensibilidad y la posibilidad de "meter mano" en sus herramientas.
- **Profesionales con necesidades específicas:** Que pueden beneficiarse de plugins diseñados para sus flujos de trabajo (ej. creadores de contenido).
- **Equipos pequeños (potencialmente en el futuro):** Si se desarrollan plugins de colaboración.

## Introducción para Nuevos Miembros del Equipo

¡Bienvenido/a al equipo de Atlas!

Estás uniéndote a un proyecto emocionante que busca redefinir cómo las personas gestionan su tiempo. Atlas no es solo un calendario; es una **plataforma**. Piensa en ello como un sistema operativo para tu organización personal, donde el "calendario" es una de las aplicaciones principales, y los "plugins" son como apps adicionales que puedes instalar para hacerla aún más poderosa.

**Si eres un miembro no técnico:** Tu perspectiva es crucial para asegurar que Atlas sea intuitivo y realmente útil. Te enfocarás en la experiencia del usuario, la claridad de las funcionalidades y cómo los plugins resuelven problemas reales.

**Si eres un desarrollador:** Te encontrarás con una arquitectura modular que te permitirá construir nuevas funcionalidades (plugins) de forma aislada pero integrada. El sistema de eventos es el corazón de la comunicación, y la API de Core te dará las herramientas para interactuar con la aplicación principal.

**Conceptos Clave para Todos:**

- **Núcleo (Core):** La base de Atlas, que proporciona la funcionalidad esencial del calendario, la gestión de la configuración, la seguridad y el sistema que permite que los plugins funcionen.
- **Plugins:** Pequeños programas que se "conectan" a Atlas para añadir nuevas características. Pueden ser desde simples contadores de eventos hasta herramientas complejas como un planificador de videos.
- **Modularidad:** La idea de que la aplicación está construida por partes (módulos y plugins) que pueden funcionar juntas pero también ser desarrolladas y actualizadas de forma independiente.
- **Sistema de Eventos:** Imagina un sistema de mensajería interno donde diferentes partes de la aplicación (y los plugins) pueden "publicar" información sobre lo que está sucediendo (ej. "se creó un evento") y otras partes pueden "suscribirse" para reaccionar a esos sucesos.

## Visión General de los Módulos Principales (Sin Detalles Técnicos)

Atlas está organizado en varias áreas funcionales clave:

1.  **Núcleo del Calendario:** Es el corazón de la aplicación, donde puedes ver tus días y semanas, y gestionar tus eventos. Permite acciones como arrastrar, soltar y redimensionar eventos.
2.  **Sistema de Configuración:** Aquí es donde personalizas Atlas a tu gusto. Puedes cambiar el tema visual, ajustar cómo se ve el calendario (la "escala de tiempo"), y configurar los plugins que tengas instalados.
3.  **Gestor de Plugins:** Es el centro de mando para todas las extensiones. Te permite:
    - **Descubrir e Instalar (Marketplace):** Como una tienda de aplicaciones, pero para Atlas.
    - **Gestionar Repositorios:** Decidir de dónde obtienes tus plugins.
    - **Actualizar:** Mantener tus plugins al día.
    - **Activar/Desactivar:** Controlar qué plugins están funcionando.
4.  **Sistema de Seguridad de Plugins:** Una capa invisible pero crucial que trabaja para asegurar que los plugins funcionen de manera segura y no comprometan tus datos o la aplicación.
5.  **Herramientas para Desarrolladores:** Un conjunto de utilidades, principalmente para quienes crean plugins, que ayudan a depurar y entender cómo funciona Atlas internamente.
6.  **Interfaz de Usuario (UI) Principal:** Incluye la barra lateral para navegación, los controles de ventana (si usas la versión de escritorio) y los diálogos personalizados para una experiencia consistente.
7.  **Servicios Internos:** Componentes que manejan tareas como el almacenamiento de datos, la gestión de temas y la comunicación entre diferentes partes de la aplicación.

Atlas es un proyecto con una base sólida y un gran potencial de crecimiento. ¡Estamos emocionados de tenerte a bordo para ayudar a darle forma a su futuro!

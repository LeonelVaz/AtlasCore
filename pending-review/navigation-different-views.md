# Sistema de Navegación entre Vistas en Atlas

## Visión General

Atlas implementa un sistema flexible de navegación entre diferentes vistas del calendario, permitiendo a los usuarios alternar entre visualizaciones semanales y diarias manteniendo el contexto temporal. Este documento describe la arquitectura e implementación de este sistema.

## Tipos de Vistas

Atlas soporta actualmente dos vistas principales:

1. **Vista Semanal**: Muestra una semana completa con todos los días y eventos
2. **Vista Diaria**: Muestra un solo día con mayor detalle y granularidad

Estas vistas están definidas como constantes en `CALENDAR_VIEWS`:

```javascript
export const CALENDAR_VIEWS = {
  DAY: 'day',
  WEEK: 'week'
};
```

## Componentes Principales

### Controlador de Vista

El componente principal (`CalendarMain`) gestiona el estado de vista actual:

```javascript
const [view, setView] = useState(CALENDAR_VIEWS.WEEK);
```

### Hook de Navegación

El hook personalizado `useCalendarNavigation` encapsula la lógica de navegación temporal:

```javascript
const {
  currentDate,       // Para vista semanal
  selectedDay,       // Para vista diaria
  setCurrentDate,
  setSelectedDay,
  goToPreviousWeek,
  goToNextWeek,
  goToCurrentWeek,
  goToPreviousDay,
  goToNextDay,
  goToToday
} = useCalendarNavigation();
```

### Controladores de Vista

Los componentes específicos para cada vista:

```jsx
{view === CALENDAR_VIEWS.WEEK ? (
  <WeekView 
    currentDate={currentDate}
    events={events}
    onEventClick={handleEventClick}
    onCellClick={handleCellClick}
    onUpdateEvent={updateEvent}
    snapValue={snapValue}
  />
) : (
  <DayView 
    date={selectedDay}
    events={events}
    onEventClick={handleEventClick}
    onTimeSlotClick={handleCellClick}
    onUpdate={updateEvent}
    snapValue={snapValue}
  />
)}
```

## Funciones de Navegación

### Cambio de Vista

```javascript
const toggleView = (newView, date = null) => {
  setView(newView);
  if (date) {
    setSelectedDay(new Date(date));
  }
};
```

### Navegación Semanal

```javascript
const goToPreviousWeek = () => {
  const newDate = new Date(currentDate);
  newDate.setDate(newDate.getDate() - 7);
  setCurrentDate(newDate);
};

const goToNextWeek = () => {
  const newDate = new Date(currentDate);
  newDate.setDate(newDate.getDate() + 7);
  setCurrentDate(newDate);
};

const goToCurrentWeek = () => {
  setCurrentDate(new Date());
};
```

### Navegación Diaria

```javascript
const goToPreviousDay = () => {
  const prevDay = new Date(selectedDay);
  prevDay.setDate(prevDay.getDate() - 1);
  setSelectedDay(prevDay);
};

const goToNextDay = () => {
  const nextDay = new Date(selectedDay);
  nextDay.setDate(nextDay.getDate() + 1);
  setSelectedDay(nextDay);
};

const goToToday = () => {
  setSelectedDay(new Date());
};
```

## Interfaz de Usuario de Navegación

### Botones de Vista

```jsx
<div className="calendar-view-toggle">
  <Button 
    isActive={view === CALENDAR_VIEWS.WEEK} 
    onClick={() => toggleView(CALENDAR_VIEWS.WEEK)}
  >
    Vista Semanal
  </Button>
  <Button 
    isActive={view === CALENDAR_VIEWS.DAY} 
    onClick={() => toggleView(CALENDAR_VIEWS.DAY, selectedDay)}
  >
    Vista Diaria
  </Button>
</div>
```

### Botones de Navegación Contextual

Los botones de navegación cambian según la vista actual:

```jsx
const renderNavigationButtons = () => {
  if (view === CALENDAR_VIEWS.WEEK) {
    return (
      <>
        <Button onClick={goToPreviousWeek}>Semana anterior</Button>
        <Button onClick={goToCurrentWeek} variant="secondary">Semana actual</Button>
        <Button onClick={goToNextWeek}>Semana siguiente</Button>
      </>
    );
  } else {
    return (
      <>
        <Button onClick={goToPreviousDay}>Día anterior</Button>
        <Button onClick={goToToday} variant="secondary">Hoy</Button>
        <Button onClick={goToNextDay}>Día siguiente</Button>
      </>
    );
  }
};
```

## Preservación del Contexto

Una característica clave es la preservación del contexto cuando se cambia entre vistas:

1. **Semana a Día**: Cuando se pasa de vista semanal a diaria, se mantiene el día seleccionado
2. **Día a Semana**: Cuando se pasa de vista diaria a semanal, se muestra la semana que contiene el día

```javascript
// Ejemplo de cambio de vista manteniendo contexto
handleDayClick = (day) => {
  setSelectedDay(day);
  toggleView(CALENDAR_VIEWS.DAY, day);
};
```

## Consideraciones de Rendimiento

- Los componentes de vista se montan/desmontan según sea necesario
- Las suscripciones a eventos se manejan individualmente en cada componente de vista
- La lógica de carga de datos está optimizada para cada tipo de vista

## Extensibilidad

El sistema está diseñado para añadir fácilmente nuevas vistas en el futuro:

- Vista mensual
- Vista de agenda
- Vista de línea de tiempo
- Vistas personalizadas de plugins

## Mejores Prácticas

1. Mantener el estado de vista sincronizado con URLs para permitir navegación directa
2. Implementar transiciones suaves entre vistas para mejorar la experiencia
3. Preservar scroll y estado de selección al cambiar entre vistas
4. Proporcionar atajos de teclado para navegación rápida

Este sistema de navegación entre vistas proporciona una experiencia de usuario intuitiva y eficiente para visualizar y gestionar eventos del calendario en diferentes escalas temporales.
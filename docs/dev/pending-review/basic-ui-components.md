# Componentes UI Básicos de Atlas

## Introducción

Atlas incluye un conjunto de componentes UI básicos diseñados para mantener la consistencia visual y funcional en toda la aplicación. Estos componentes constituyen la base del sistema de diseño y son utilizados por módulos core y plugins.

## Button

El componente Button proporciona una implementación consistente para botones en la aplicación, con soporte para diferentes variantes, tamaños y estados.

### Propiedades

| Propiedad | Tipo | Valores | Descripción |
|-----------|------|---------|-------------|
| variant | string | 'primary', 'secondary', 'danger', 'text' | Estilo visual del botón |
| size | string | 'small', 'medium', 'large' | Tamaño del botón |
| className | string | - | Clases CSS adicionales |
| disabled | boolean | true, false | Deshabilita el botón |
| isActive | boolean | true, false | Estado activo (para botones toggle) |
| onClick | function | - | Función a ejecutar al hacer clic |
| children | node | - | Contenido del botón |

### Ejemplo de Uso

```jsx
import Button from '../ui/button';

function MyComponent() {
  return (
    <div>
      <Button 
        variant="primary" 
        size="medium" 
        onClick={handleClick}
      >
        Guardar
      </Button>
      
      <Button 
        variant="secondary" 
        size="small" 
        disabled={isLoading}
      >
        Cancelar
      </Button>
      
      <Button 
        variant="danger" 
        onClick={handleDelete}
      >
        Eliminar
      </Button>
    </div>
  );
}
```

## Dialog

El componente Dialog implementa un modal accesible y flexible para presentar información y recopilar entrada del usuario.

### Propiedades

| Propiedad | Tipo | Valores | Descripción |
|-----------|------|---------|-------------|
| isOpen | boolean | true, false | Controla la visibilidad del diálogo |
| onClose | function | - | Función llamada al cerrar el diálogo |
| title | string | - | Título del diálogo (opcional) |
| children | node | - | Contenido del diálogo |
| onConfirm | function | - | Función para confirmar acción (opcional) |
| confirmText | string | - | Texto del botón de confirmación (por defecto: "Confirmar") |
| cancelText | string | - | Texto del botón de cancelar (por defecto: "Cancelar") |
| className | string | - | Clases CSS adicionales |

### Ejemplo de Uso

```jsx
import { useState } from 'react';
import Dialog from '../ui/dialog';
import Button from '../ui/button';

function MyComponent() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const handleConfirm = () => {
    // Lógica de confirmación
    setIsDialogOpen(false);
  };
  
  return (
    <div>
      <Button onClick={() => setIsDialogOpen(true)}>
        Abrir Diálogo
      </Button>
      
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Confirmación"
        onConfirm={handleConfirm}
        confirmText="Aceptar"
        cancelText="Cancelar"
      >
        <p>¿Estás seguro de que deseas realizar esta acción?</p>
      </Dialog>
    </div>
  );
}
```

## Características compartidas

Ambos componentes comparten características importantes:

- **Accesibilidad**: Implementan prácticas de accesibilidad (ARIA roles, keyboard navigation)
- **Tematización**: Adaptan su apariencia al tema actual de la aplicación
- **Consistencia visual**: Mantienen una apariencia coherente en toda la aplicación
- **Manejo de errores**: Implementan verificación de tipos con PropTypes
- **Adaptación a estados**: Visualización específica para estados disabled, hover, active

## Personalización

Los componentes pueden personalizarse mediante:

1. **Props**: Utilizando las propiedades admitidas por cada componente
2. **className**: Añadiendo clases CSS personalizadas
3. **Temas**: Modificando las variables CSS utilizadas por los componentes

## Consideraciones de Rendimiento

- Los componentes utilizan técnicas de optimización como memoización cuando es apropiado
- Implementan manejo eficiente del DOM para evitar re-renders innecesarios
- Se recomienda no crear instancias innecesarias en renderizados frecuentes

## Buenas Prácticas

1. Usar los componentes UI básicos en lugar de elementos HTML directos
2. Mantener la coherencia en el uso de variantes y tamaños
3. Proporcionar textos claros y descriptivos para botones y diálogos
4. Implementar manejo adecuado de estados de carga y error
5. Considerar la accesibilidad al utilizar estos componentes

Estos componentes continuarán evolucionando con la aplicación, pero manteniendo compatibilidad hacia atrás y consistencia visual.
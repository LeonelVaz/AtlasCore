# Borrador de funcionalidades aun no implementadas (Puede tener cambios en el futuro)

## 🚀 Funcionalidades Principales Faltantes

### 1. **Formularios y Modales**

- [ ] **`BulkAddForm.jsx`** - Modal para añadir videos en lote
  - Nombre base de serie
  - Numeración automática
  - Cantidad de videos
  - Frecuencia (diaria/semanal)
  - Selección de días y horarios
- [ ] **`VideoForm.jsx`** - Modal para detalles extendidos del video
  - Descripción rica
  - Plataforma, URL, duración
  - Tags y metadatos de producción
- [ ] **Modal de Configuración de Tasas de Cambio**
- [ ] **Modal de Importar/Exportar Datos**
- [ ] **Modal de Restablecer Datos**

### 2. **Panel de Estadísticas**

- [ ] **Componente de Estadísticas** (`StatsPanel.jsx`)
  - Tres columnas: "Estado de Videos", "Producción", "Publicados"
  - Conteos por estado con emojis
  - Conteos de alertas y dudas por separado
  - Sección de ganancias del mes
  - Totales por moneda y conversiones

### 3. **Botones de Acción Globales en Encabezado**

- [ ] **"Añadir Videos en Lote"** - Abre `BulkAddForm`
- [ ] **"Configurar Tasas de Cambio"**
- [ ] **"Importar/Exportar Datos"**
- [ ] **"Restablecer Datos"**
- [ ] **"Ver Estadísticas"** - Muestra/oculta panel de estadísticas

### 4. **Widget de Configuración**

- [ ] **`SettingsPanelWidget.jsx`** - Integrado en configuración de Atlas
  - Moneda por defecto
  - Tasas de cambio
  - Lista de plataformas
  - Configuración de alertas automáticas
  - Botón para restablecer todos los datos

## 🔧 Funcionalidades Backend/Lógica

### 5. **API Pública Extendida**

- [ ] **Funciones de importación/exportación**
  ```javascript
  exportAllData();
  importAllData(jsonData);
  ```
- [ ] **Funciones de estadísticas**
  ```javascript
  getVideoStatsByStatus();
  getMonthlyEarnings(year, month);
  getAlertCounts();
  ```
- [ ] **Funciones de creación en lote**
  ```javascript
  createBulkVideos(seriesData);
  ```
- [ ] **Gestión de tasas de cambio**
  ```javascript
  setCurrencyRates(rates);
  getCurrencyRates();
  convertCurrency(amount, fromCurrency, toCurrency);
  ```

### 6. **Configuración y Persistencia**

- [ ] **Almacenar tasas de cambio** en settings
- [ ] **Configuración de alertas** (activar/desactivar tipos de warnings)
- [ ] **Lista de plataformas de video** configurable

## 📊 Mejoras de UX

### 7. **Indicadores y Feedback Visual**

- [ ] **Mensaje de confirmación** al guardar datos
- [ ] **Loading states** para operaciones lentas
- [ ] **Tooltips** explicativos para estados y alertas
- [ ] **Mejor handling de errores** con mensajes amigables

### 8. **Navegación y Accesibilidad**

- [ ] **Keyboard navigation** para el calendario
- [ ] **Accesos directos por teclado** (ej: Ctrl+N para nuevo video)
- [ ] **Navegación por fechas** (saltar a mes específico)

## 🎨 Componentes de UI Faltantes

### 9. **Componentes Específicos**

```
/components/
├── BulkAddForm.jsx          ❌
├── VideoForm.jsx            ❌
├── StatsPanel.jsx           ❌
├── CurrencyRateForm.jsx     ❌
├── ImportExportModal.jsx    ❌
├── ResetDataModal.jsx       ❌
└── SettingsPanelWidget.jsx  ❌
```

### 10. **Estilos CSS Faltantes**

```
/styles/
├── BulkAddForm.css          ❌
├── VideoForm.css            ❌
├── StatsPanel.css           ❌
├── CurrencyRateForm.css     ❌
├── ImportExportModal.css    ❌
└── SettingsPanelWidget.css  ❌
```

## 🔄 Prioridad Sugerida de Implementación

1. **Alta Prioridad:** (TERMINADO)

   - Panel de Estadísticas (es muy visual y útil) (TERMINADO)
   - Botones de acción globales en encabezado (TERMINADO)
   - BulkAddForm (muy demandado por usuarios) (TERMINADO)

2. **Prioridad Media:**

   - Configuración de tasas de cambio (TERMINADO)
   - VideoForm para detalles extendidos - Añadir un botón casi indistigible en la casilla de cada video ubicado en el extremo arriba a la derecha de la casilla (TERMINADO)
   - Widget de configuración

3. **Prioridad Baja:**
   - Importar/Exportar
   - Restablecer datos
   - Mejoras de accesibilidad

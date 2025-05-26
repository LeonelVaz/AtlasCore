import React from "react";

// video-scheduler/index.js
// Asumiendo que React está disponible globalmente como 'React'

// Definición de componentes inline usando React.createElement para evitar necesidad de build step inicial
function NavItemComponentFactory(pluginInstance) {
  return function NavItemComponent(props) { // props incluye onNavigate, pluginId
      const handleClick = () => props.onNavigate(props.pluginId, 'main-scheduler-page');
      return React.createElement('div', {
          className: 'nav-item video-scheduler-nav-item', // Clase específica
          onClick: handleClick,
          style: { cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 'var(--spacing-sm)', gap: 'var(--spacing-xs)' }
      }, [
          React.createElement('span', { className: 'material-icons', key: 'icon' }, 'movie_filter'),
          React.createElement('span', { key: 'label' }, pluginInstance.name)
      ]);
  }
}

function VideoSchedulerPageComponentFactory(pluginInstance) {
  return function VideoSchedulerPage(props) { // props incluye plugin, core
      return React.createElement('div', {
          className: `${props.plugin.id}-page`,
          style: { padding: 'var(--spacing-md)' }
      }, [
          React.createElement('h1', { key: 'title' }, `${props.plugin.name} - Dashboard Principal`),
          React.createElement('p', { key: 'welcome' }, 'Bienvenido al programador de videos. ¡Funcionalidad próximamente!'),
          React.createElement('p', { key: 'plugId' }, `ID del Plugin: ${props.plugin.id}`),
          React.createElement('p', { key: 'plugVer' }, `Versión del Plugin: ${props.plugin.version}`)
      ]);
  }
}

function SettingsPanelWidgetComponentFactory(pluginInstance) {
  return function SettingsPanelWidget(props) { // props incluye plugin, core
      return React.createElement('div', {
          className: `${props.plugin.id}-settings-widget`,
          style: { padding: 'var(--spacing-md)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', marginTop: 'var(--spacing-md)' }
      }, [
          React.createElement('h3', { key: 'title' }, `Configuración de ${props.plugin.name}`),
          React.createElement('p', { key: 'info' }, 'Opciones de configuración aparecerán aquí en futuras etapas.')
      ]);
  }
}


export default {
  id: 'video-scheduler', // Usar constantes.js si se crea: PLUGIN_ID
  name: 'Video Scheduler', // Usar constantes.js si se crea: PLUGIN_NAME
  version: '0.1.0', // Versión inicial
  description: 'Planifica, organiza y da seguimiento a la producción de videos.',
  author: 'Tu Equipo',
  minAppVersion: '0.3.0',
  maxAppVersion: '1.0.0',
  permissions: ['storage', 'events', 'ui'], // Mínimos permisos para empezar

  _core: null,
  _settings: { // Configuraciones muy básicas por ahora
      // Se añadirán más configuraciones en etapas posteriores
  },

  init: async function(core) {
      this._core = core;
      const self = this;
      console.log(`[${self.id}] Inicializando plugin...`);

      try {
          // Cargar configuraciones guardadas (aunque no tengamos muchas aún)
          const storedSettings = await self._core.storage.getItem(self.id, 'plugin_settings', self._settings);
          self._settings = { ...self._settings, ...storedSettings };

          // API Pública (vacía o mínima por ahora)
          this.publicAPI = {
              getPluginInfo: () => ({ id: self.id, version: self.version, name: self.name })
          };
          self._core.plugins.registerAPI(self.id, this.publicAPI);

          // Registrar Extensiones UI
          // Utilizamos factories para pasar 'self' (la instancia del plugin) correctamente si es necesario
          const NavItem = NavItemComponentFactory(self);
          const MainPage = VideoSchedulerPageComponentFactory(self);
          const SettingsWidget = SettingsPanelWidgetComponentFactory(self);

          self._core.ui.registerExtension(
              self.id,
              self._core.ui.getExtensionZones().MAIN_NAVIGATION,
              NavItem,
              { order: 150 } // Ajustar orden según necesidad
          );

          self._core.ui.registerExtension(
              self.id,
              self._core.ui.getExtensionZones().PLUGIN_PAGES,
              MainPage,
              { pageId: 'main-scheduler-page', props: { plugin: self, core: self._core } }
          );

          self._core.ui.registerExtension(
              self.id,
              self._core.ui.getExtensionZones().SETTINGS_PANEL,
              SettingsWidget,
              { props: { plugin: self, core: self._core } }
          );

          console.log(`[${self.id}] Plugin inicializado correctamente.`);
          return true;
      } catch (error) {
          console.error(`[${self.id}] Error durante la inicialización:`, error);
          return false;
      }
  },

  cleanup: async function() {
      const self = this;
      console.log(`[${self.id}] Limpiando plugin...`);
      try {
          // Guardar configuraciones
          await self._core.storage.setItem(self.id, 'plugin_settings', self._settings);

          // Eliminar extensiones de UI (Atlas debería hacerlo, pero por si acaso o si la guía lo indica)
          // self._core.ui.removeAllExtensions(self.id); // Verificar si esto es necesario o automático

          // Cancelar suscripciones a eventos (si las hubiera)
          // self._core.events.unsubscribeAll(self.id);

          console.log(`[${self.id}] Plugin limpiado correctamente.`);
          return true;
      } catch (error) {
          console.error(`[${self.id}] Error durante la limpieza:`, error);
          return false;
      }
  }
};
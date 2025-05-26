// Estructura base para un objeto Video
export const DEFAULT_VIDEO_STRUCTURE = {
  id: null,       // Se generará al crear
  title: 'Nuevo Video Sin Título',
  description: '',
  status: 'planned', // Estado inicial por defecto
  // Más campos se añadirán en etapas futuras (slot, platform, earnings, etc.)
  createdAt: null // Se asignará al crear
};

// Estados de video iniciales (muy simplificados)
export const VIDEO_STATUS = {
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  PUBLISHED: 'published'
};
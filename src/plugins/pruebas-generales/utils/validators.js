/**
 * validators.js
 * Utilidades de validación para formularios y entrada de datos
 */

/**
 * Verifica si un valor es requerido
 * @param {any} value - Valor a verificar
 * @param {string} message - Mensaje de error personalizado (opcional)
 * @returns {string|null} - Mensaje de error o null si es válido
 */
export function validateRequired(value, message = 'Este campo es obligatorio') {
  if (value === undefined || value === null || value === '') {
    return message;
  }
  return null;
}

/**
 * Verifica si un valor es un email válido
 * @param {string} value - Valor a verificar
 * @param {string} message - Mensaje de error personalizado (opcional)
 * @returns {string|null} - Mensaje de error o null si es válido
 */
export function validateEmail(value, message = 'Ingrese un email válido') {
  // Primero verificar si es requerido
  if (!value) {
    return validateRequired(value);
  }
  
  // Expresión regular para validar email
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(value)) {
    return message;
  }
  return null;
}

/**
 * Verifica si un valor tiene una longitud dentro de un rango
 * @param {string} value - Valor a verificar
 * @param {number} min - Longitud mínima
 * @param {number} max - Longitud máxima
 * @param {string} message - Mensaje de error personalizado (opcional)
 * @returns {string|null} - Mensaje de error o null si es válido
 */
export function validateLength(value, min, max, message) {
  // Si no tiene valor y no es requerido, es válido
  if (!value) {
    return null;
  }
  
  const length = String(value).length;
  
  if (min !== undefined && length < min) {
    return message || `Debe tener al menos ${min} caracteres`;
  }
  
  if (max !== undefined && length > max) {
    return message || `No debe exceder los ${max} caracteres`;
  }
  
  return null;
}

/**
 * Verifica si un valor es numérico
 * @param {any} value - Valor a verificar
 * @param {string} message - Mensaje de error personalizado (opcional)
 * @returns {string|null} - Mensaje de error o null si es válido
 */
export function validateNumber(value, message = 'Debe ser un número válido') {
  // Si no tiene valor y no es requerido, es válido
  if (!value) {
    return null;
  }
  
  if (isNaN(Number(value))) {
    return message;
  }
  return null;
}

/**
 * Verifica si un valor está dentro de un rango numérico
 * @param {number} value - Valor a verificar
 * @param {number} min - Valor mínimo
 * @param {number} max - Valor máximo
 * @param {string} message - Mensaje de error personalizado (opcional)
 * @returns {string|null} - Mensaje de error o null si es válido
 */
export function validateRange(value, min, max, message) {
  // Primero verificar si es un número
  const numError = validateNumber(value);
  if (numError) {
    return numError;
  }
  
  // Si no tiene valor y no es requerido, es válido
  if (!value) {
    return null;
  }
  
  const numValue = Number(value);
  
  if (min !== undefined && numValue < min) {
    return message || `Debe ser mayor o igual a ${min}`;
  }
  
  if (max !== undefined && numValue > max) {
    return message || `Debe ser menor o igual a ${max}`;
  }
  
  return null;
}

/**
 * Verifica si un valor coincide con una expresión regular
 * @param {string} value - Valor a verificar
 * @param {RegExp} regex - Expresión regular
 * @param {string} message - Mensaje de error personalizado
 * @returns {string|null} - Mensaje de error o null si es válido
 */
export function validatePattern(value, regex, message) {
  // Si no tiene valor y no es requerido, es válido
  if (!value) {
    return null;
  }
  
  if (!regex.test(value)) {
    return message;
  }
  return null;
}

/**
 * Verifica si un valor es una URL válida
 * @param {string} value - Valor a verificar
 * @param {string} message - Mensaje de error personalizado (opcional)
 * @returns {string|null} - Mensaje de error o null si es válido
 */
export function validateUrl(value, message = 'Ingrese una URL válida') {
  // Si no tiene valor y no es requerido, es válido
  if (!value) {
    return null;
  }
  
  try {
    // Intentar crear un objeto URL
    new URL(value);
    return null;
  } catch (error) {
    return message;
  }
}

/**
 * Verifica si un valor es una fecha válida
 * @param {string} value - Valor a verificar
 * @param {string} message - Mensaje de error personalizado (opcional)
 * @returns {string|null} - Mensaje de error o null si es válido
 */
export function validateDate(value, message = 'Ingrese una fecha válida') {
  // Si no tiene valor y no es requerido, es válido
  if (!value) {
    return null;
  }
  
  const date = new Date(value);
  
  if (isNaN(date.getTime())) {
    return message;
  }
  return null;
}

/**
 * Verifica si un valor es único en un array
 * @param {any} value - Valor a verificar
 * @param {Array} array - Array donde verificar unicidad
 * @param {string} message - Mensaje de error personalizado (opcional)
 * @returns {string|null} - Mensaje de error o null si es válido
 */
export function validateUnique(value, array, message = 'Este valor ya existe') {
  // Si no tiene valor y no es requerido, es válido
  if (!value) {
    return null;
  }
  
  if (array.includes(value)) {
    return message;
  }
  return null;
}

/**
 * Compone múltiples validadores
 * @param {...Function} validators - Funciones de validación
 * @returns {Function} - Función validadora compuesta
 */
export function composeValidators(...validators) {
  return (value) => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) {
        return error;
      }
    }
    return null;
  };
}

/**
 * Verifica si un objeto cumple con todas las validaciones especificadas
 * @param {Object} object - Objeto a validar
 * @param {Object} validations - Mapa de campo -> función validadora
 * @returns {Object} - Objeto con errores de validación
 */
export function validateObject(object, validations) {
  const errors = {};
  
  for (const [field, validator] of Object.entries(validations)) {
    const error = validator(object[field]);
    if (error) {
      errors[field] = error;
    }
  }
  
  return errors;
}
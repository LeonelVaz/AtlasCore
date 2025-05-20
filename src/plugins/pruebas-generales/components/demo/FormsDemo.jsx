/**
 * FormsDemo.jsx
 * Componente para demostrar implementación de formularios
 */

import logger from '../../utils/logger';
import { publishDemoEvent } from '../../api/eventManager';
import { validateEmail, validateRequired, validateLength, validateNumber } from '../../utils/validators';

/**
 * Componente de demostración de formularios
 */
function FormsDemo(props) {
  const React = require('react');
  const { useState, useEffect } = React;
  
  // Extraer propiedades
  const { core, plugin } = props;
  
  // Estados para el formulario simple
  const [simpleForm, setSimpleForm] = useState({
    name: '',
    email: '',
    message: ''
  });
  
  // Estados para el formulario avanzado
  const [advancedForm, setAdvancedForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthdate: '',
    occupation: '',
    interests: [],
    notifications: false,
    subscription: 'free',
    comments: ''
  });
  
  // Estados para errores y validación
  const [simpleErrors, setSimpleErrors] = useState({});
  const [advancedErrors, setAdvancedErrors] = useState({});
  const [activeTab, setActiveTab] = useState('simple');
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState(null);
  
  // Opciones para campos select
  const occupations = [
    { value: '', label: 'Seleccione una opción' },
    { value: 'developer', label: 'Desarrollador' },
    { value: 'designer', label: 'Diseñador' },
    { value: 'manager', label: 'Gerente' },
    { value: 'student', label: 'Estudiante' },
    { value: 'other', label: 'Otro' }
  ];
  
  // Opciones para checkboxes
  const interestOptions = [
    { value: 'technology', label: 'Tecnología' },
    { value: 'design', label: 'Diseño' },
    { value: 'business', label: 'Negocios' },
    { value: 'science', label: 'Ciencia' }
  ];
  
  // Opciones para radio buttons
  const subscriptionOptions = [
    { value: 'free', label: 'Gratis' },
    { value: 'basic', label: 'Básico ($10/mes)' },
    { value: 'premium', label: 'Premium ($25/mes)' }
  ];
  
  // Efecto para publicar evento al montar
  useEffect(() => {
    publishDemoEvent(core, plugin, 'forms-demo', 'viewed');
  }, [core, plugin]);
  
  /**
   * Manejador para campos del formulario simple
   */
  const handleSimpleChange = (e) => {
    const { name, value } = e.target;
    
    setSimpleForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error al editar
    if (simpleErrors[name]) {
      setSimpleErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  /**
   * Manejador para campos del formulario avanzado
   */
  const handleAdvancedChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Manejar diferentes tipos de inputs
    if (type === 'checkbox') {
      if (name === 'notifications') {
        // Checkbox simple
        setAdvancedForm(prev => ({
          ...prev,
          [name]: checked
        }));
      } else {
        // Checkboxes múltiples (intereses)
        setAdvancedForm(prev => {
          const currentInterests = [...prev.interests];
          
          if (checked) {
            currentInterests.push(value);
          } else {
            const index = currentInterests.indexOf(value);
            if (index !== -1) {
              currentInterests.splice(index, 1);
            }
          }
          
          return {
            ...prev,
            interests: currentInterests
          };
        });
      }
    } else {
      // Inputs normales
      setAdvancedForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Limpiar error al editar
    if (advancedErrors[name]) {
      setAdvancedErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  /**
   * Validar formulario simple
   */
  const validateSimpleForm = () => {
    const errors = {};
    
    // Validar nombre
    const nameError = validateRequired(simpleForm.name);
    if (nameError) {
      errors.name = nameError;
    }
    
    // Validar email
    const emailError = validateEmail(simpleForm.email);
    if (emailError) {
      errors.email = emailError;
    }
    
    // Validar mensaje
    const messageError = validateLength(simpleForm.message, 10, 500);
    if (messageError) {
      errors.message = messageError;
    }
    
    setSimpleErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  /**
   * Validar formulario avanzado
   */
  const validateAdvancedForm = () => {
    const errors = {};
    
    // Validar nombre
    const firstNameError = validateRequired(advancedForm.firstName);
    if (firstNameError) {
      errors.firstName = firstNameError;
    }
    
    // Validar apellido
    const lastNameError = validateRequired(advancedForm.lastName);
    if (lastNameError) {
      errors.lastName = lastNameError;
    }
    
    // Validar email
    const emailError = validateEmail(advancedForm.email);
    if (emailError) {
      errors.email = emailError;
    }
    
    // Validar teléfono (opcional, pero si existe debe ser número)
    if (advancedForm.phone) {
      const phoneError = validateNumber(advancedForm.phone);
      if (phoneError) {
        errors.phone = phoneError;
      }
    }
    
    // Validar ocupación
    if (!advancedForm.occupation) {
      errors.occupation = 'Por favor seleccione una ocupación';
    }
    
    // Validar intereses
    if (advancedForm.interests.length === 0) {
      errors.interests = 'Seleccione al menos un interés';
    }
    
    setAdvancedErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  /**
   * Manejar envío del formulario simple
   */
  const handleSimpleSubmit = (e) => {
    e.preventDefault();
    
    // Validar formulario
    if (validateSimpleForm()) {
      logger.info('Formulario simple enviado:', simpleForm);
      
      // Mostrar datos enviados
      setFormData({
        type: 'simple',
        data: { ...simpleForm }
      });
      
      // Marcar como enviado
      setSubmitted(true);
      
      // Publicar evento de demo
      publishDemoEvent(core, plugin, 'forms-demo', 'simple-form-submitted', {
        formData: simpleForm
      });
      
      // Limpiar formulario
      setSimpleForm({
        name: '',
        email: '',
        message: ''
      });
    }
  };
  
  /**
   * Manejar envío del formulario avanzado
   */
  const handleAdvancedSubmit = (e) => {
    e.preventDefault();
    
    // Validar formulario
    if (validateAdvancedForm()) {
      logger.info('Formulario avanzado enviado:', advancedForm);
      
      // Mostrar datos enviados
      setFormData({
        type: 'advanced',
        data: { ...advancedForm }
      });
      
      // Marcar como enviado
      setSubmitted(true);
      
      // Publicar evento de demo
      publishDemoEvent(core, plugin, 'forms-demo', 'advanced-form-submitted', {
        formData: advancedForm
      });
    }
  };
  
  /**
   * Cambiar pestaña activa
   */
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSubmitted(false);
    setFormData(null);
  };
  
  /**
   * Crear un nuevo formulario
   */
  const handleNewForm = () => {
    setSubmitted(false);
    setFormData(null);
    
    if (activeTab === 'simple') {
      setSimpleForm({
        name: '',
        email: '',
        message: ''
      });
      setSimpleErrors({});
    } else {
      setAdvancedForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        birthdate: '',
        occupation: '',
        interests: [],
        notifications: false,
        subscription: 'free',
        comments: ''
      });
      setAdvancedErrors({});
    }
  };
  
  // Renderizar demostración de formularios
  return React.createElement(
    'div',
    { className: 'pg-forms-demo' },
    [
      // Información
      React.createElement(
        'div',
        { key: 'info', className: 'pg-demo-info' },
        [
          React.createElement('h2', { key: 'title' }, 'Demostración de Formularios'),
          React.createElement(
            'p',
            { key: 'desc' },
            'Esta demostración muestra cómo implementar y validar formularios en plugins.'
          )
        ]
      ),
      
      // Pestañas
      React.createElement(
        'div',
        { key: 'tabs', className: 'pg-tabs' },
        [
          React.createElement(
            'div',
            {
              key: 'simple',
              className: `pg-tab ${activeTab === 'simple' ? 'pg-tab-active' : ''}`,
              onClick: () => handleTabChange('simple')
            },
            'Formulario Simple'
          ),
          React.createElement(
            'div',
            {
              key: 'advanced',
              className: `pg-tab ${activeTab === 'advanced' ? 'pg-tab-active' : ''}`,
              onClick: () => handleTabChange('advanced')
            },
            'Formulario Avanzado'
          )
        ]
      ),
      
      // Contenido según la pestaña activa
      React.createElement(
        'div',
        { key: 'content', className: 'pg-tab-content' },
        submitted
          ? 
          // Mostrar resultado del envío
          React.createElement(
            'div',
            { className: 'pg-form-result' },
            [
              React.createElement(
                'div',
                { key: 'success', className: 'pg-form-success' },
                [
                  React.createElement(
                    'span',
                    { key: 'icon', className: 'material-icons pg-success-icon' },
                    'check_circle'
                  ),
                  React.createElement('h3', { key: 'title' }, 'Formulario enviado correctamente')
                ]
              ),
              React.createElement(
                'div',
                { key: 'data', className: 'pg-form-data' },
                [
                  React.createElement('h4', { key: 'title' }, 'Datos enviados:'),
                  React.createElement(
                    'pre',
                    { key: 'json' },
                    JSON.stringify(formData.data, null, 2)
                  )
                ]
              ),
              React.createElement(
                'button',
                {
                  key: 'new',
                  className: 'pg-button pg-button-primary',
                  onClick: handleNewForm
                },
                'Crear nuevo formulario'
              )
            ]
          )
          : activeTab === 'simple'
            ? 
            // Formulario simple
            React.createElement(
              'form',
              {
                className: 'pg-form pg-simple-form',
                onSubmit: handleSimpleSubmit
              },
              [
                // Campo: Nombre
                React.createElement(
                  'div',
                  {
                    key: 'name',
                    className: `pg-form-group ${simpleErrors.name ? 'pg-form-error' : ''}`
                  },
                  [
                    React.createElement('label', { key: 'label', htmlFor: 'simple-name' }, 'Nombre:'),
                    React.createElement(
                      'input',
                      {
                        key: 'input',
                        type: 'text',
                        id: 'simple-name',
                        name: 'name',
                        className: 'pg-input',
                        value: simpleForm.name,
                        onChange: handleSimpleChange
                      }
                    ),
                    simpleErrors.name && React.createElement(
                      'div',
                      { key: 'error', className: 'pg-error-message' },
                      simpleErrors.name
                    )
                  ]
                ),
                
                // Campo: Email
                React.createElement(
                  'div',
                  {
                    key: 'email',
                    className: `pg-form-group ${simpleErrors.email ? 'pg-form-error' : ''}`
                  },
                  [
                    React.createElement('label', { key: 'label', htmlFor: 'simple-email' }, 'Email:'),
                    React.createElement(
                      'input',
                      {
                        key: 'input',
                        type: 'email',
                        id: 'simple-email',
                        name: 'email',
                        className: 'pg-input',
                        value: simpleForm.email,
                        onChange: handleSimpleChange
                      }
                    ),
                    simpleErrors.email && React.createElement(
                      'div',
                      { key: 'error', className: 'pg-error-message' },
                      simpleErrors.email
                    )
                  ]
                ),
                
                // Campo: Mensaje
                React.createElement(
                  'div',
                  {
                    key: 'message',
                    className: `pg-form-group ${simpleErrors.message ? 'pg-form-error' : ''}`
                  },
                  [
                    React.createElement('label', { key: 'label', htmlFor: 'simple-message' }, 'Mensaje:'),
                    React.createElement(
                      'textarea',
                      {
                        key: 'input',
                        id: 'simple-message',
                        name: 'message',
                        className: 'pg-textarea',
                        rows: 5,
                        value: simpleForm.message,
                        onChange: handleSimpleChange
                      }
                    ),
                    simpleErrors.message && React.createElement(
                      'div',
                      { key: 'error', className: 'pg-error-message' },
                      simpleErrors.message
                    )
                  ]
                ),
                
                // Botones
                React.createElement(
                  'div',
                  { key: 'buttons', className: 'pg-form-buttons' },
                  [
                    React.createElement(
                      'button',
                      {
                        key: 'submit',
                        type: 'submit',
                        className: 'pg-button pg-button-primary'
                      },
                      'Enviar'
                    ),
                    React.createElement(
                      'button',
                      {
                        key: 'reset',
                        type: 'button',
                        className: 'pg-button',
                        onClick: handleNewForm
                      },
                      'Limpiar'
                    )
                  ]
                )
              ]
            )
            : 
            // Formulario avanzado
            React.createElement(
              'form',
              {
                className: 'pg-form pg-advanced-form',
                onSubmit: handleAdvancedSubmit
              },
              [
                // Sección: Información personal
                React.createElement(
                  'fieldset',
                  { key: 'personal-info', className: 'pg-form-section' },
                  [
                    React.createElement('legend', { key: 'title' }, 'Información Personal'),
                    
                    // Fila para nombre y apellido
                    React.createElement(
                      'div',
                      { key: 'name-row', className: 'pg-form-row' },
                      [
                        // Campo: Nombre
                        React.createElement(
                          'div',
                          {
                            key: 'first-name',
                            className: `pg-form-group ${advancedErrors.firstName ? 'pg-form-error' : ''}`
                          },
                          [
                            React.createElement('label', { key: 'label', htmlFor: 'adv-first-name' }, 'Nombre:'),
                            React.createElement(
                              'input',
                              {
                                key: 'input',
                                type: 'text',
                                id: 'adv-first-name',
                                name: 'firstName',
                                className: 'pg-input',
                                value: advancedForm.firstName,
                                onChange: handleAdvancedChange
                              }
                            ),
                            advancedErrors.firstName && React.createElement(
                              'div',
                              { key: 'error', className: 'pg-error-message' },
                              advancedErrors.firstName
                            )
                          ]
                        ),
                        
                        // Campo: Apellido
                        React.createElement(
                          'div',
                          {
                            key: 'last-name',
                            className: `pg-form-group ${advancedErrors.lastName ? 'pg-form-error' : ''}`
                          },
                          [
                            React.createElement('label', { key: 'label', htmlFor: 'adv-last-name' }, 'Apellido:'),
                            React.createElement(
                              'input',
                              {
                                key: 'input',
                                type: 'text',
                                id: 'adv-last-name',
                                name: 'lastName',
                                className: 'pg-input',
                                value: advancedForm.lastName,
                                onChange: handleAdvancedChange
                              }
                            ),
                            advancedErrors.lastName && React.createElement(
                              'div',
                              { key: 'error', className: 'pg-error-message' },
                              advancedErrors.lastName
                            )
                          ]
                        )
                      ]
                    ),
                    
                    // Fila para email y teléfono
                    React.createElement(
                      'div',
                      { key: 'contact-row', className: 'pg-form-row' },
                      [
                        // Campo: Email
                        React.createElement(
                          'div',
                          {
                            key: 'email',
                            className: `pg-form-group ${advancedErrors.email ? 'pg-form-error' : ''}`
                          },
                          [
                            React.createElement('label', { key: 'label', htmlFor: 'adv-email' }, 'Email:'),
                            React.createElement(
                              'input',
                              {
                                key: 'input',
                                type: 'email',
                                id: 'adv-email',
                                name: 'email',
                                className: 'pg-input',
                                value: advancedForm.email,
                                onChange: handleAdvancedChange
                              }
                            ),
                            advancedErrors.email && React.createElement(
                              'div',
                              { key: 'error', className: 'pg-error-message' },
                              advancedErrors.email
                            )
                          ]
                        ),
                        
                        // Campo: Teléfono
                        React.createElement(
                          'div',
                          {
                            key: 'phone',
                            className: `pg-form-group ${advancedErrors.phone ? 'pg-form-error' : ''}`
                          },
                          [
                            React.createElement('label', { key: 'label', htmlFor: 'adv-phone' }, 'Teléfono:'),
                            React.createElement(
                              'input',
                              {
                                key: 'input',
                                type: 'tel',
                                id: 'adv-phone',
                                name: 'phone',
                                className: 'pg-input',
                                value: advancedForm.phone,
                                onChange: handleAdvancedChange,
                                placeholder: 'Opcional'
                              }
                            ),
                            advancedErrors.phone && React.createElement(
                              'div',
                              { key: 'error', className: 'pg-error-message' },
                              advancedErrors.phone
                            )
                          ]
                        )
                      ]
                    ),
                    
                    // Fila para fecha y ocupación
                    React.createElement(
                      'div',
                      { key: 'details-row', className: 'pg-form-row' },
                      [
                        // Campo: Fecha de nacimiento
                        React.createElement(
                          'div',
                          { key: 'birthdate', className: 'pg-form-group' },
                          [
                            React.createElement('label', { key: 'label', htmlFor: 'adv-birthdate' }, 'Fecha de nacimiento:'),
                            React.createElement(
                              'input',
                              {
                                key: 'input',
                                type: 'date',
                                id: 'adv-birthdate',
                                name: 'birthdate',
                                className: 'pg-input',
                                value: advancedForm.birthdate,
                                onChange: handleAdvancedChange
                              }
                            )
                          ]
                        ),
                        
                        // Campo: Ocupación
                        React.createElement(
                          'div',
                          {
                            key: 'occupation',
                            className: `pg-form-group ${advancedErrors.occupation ? 'pg-form-error' : ''}`
                          },
                          [
                            React.createElement('label', { key: 'label', htmlFor: 'adv-occupation' }, 'Ocupación:'),
                            React.createElement(
                              'select',
                              {
                                key: 'input',
                                id: 'adv-occupation',
                                name: 'occupation',
                                className: 'pg-select',
                                value: advancedForm.occupation,
                                onChange: handleAdvancedChange
                              },
                              occupations.map(option => React.createElement(
                                'option',
                                { key: option.value, value: option.value },
                                option.label
                              ))
                            ),
                            advancedErrors.occupation && React.createElement(
                              'div',
                              { key: 'error', className: 'pg-error-message' },
                              advancedErrors.occupation
                            )
                          ]
                        )
                      ]
                    )
                  ]
                ),
                
                // Sección: Preferencias
                React.createElement(
                  'fieldset',
                  { key: 'preferences', className: 'pg-form-section' },
                  [
                    React.createElement('legend', { key: 'title' }, 'Preferencias'),
                    
                    // Campo: Intereses (checkboxes)
                    React.createElement(
                      'div',
                      {
                        key: 'interests',
                        className: `pg-form-group ${advancedErrors.interests ? 'pg-form-error' : ''}`
                      },
                      [
                        React.createElement('label', { key: 'label' }, 'Intereses:'),
                        React.createElement(
                          'div',
                          { key: 'options', className: 'pg-checkbox-group' },
                          interestOptions.map(option => React.createElement(
                            'label',
                            { key: option.value, className: 'pg-checkbox-label' },
                            [
                              React.createElement(
                                'input',
                                {
                                  key: 'input',
                                  type: 'checkbox',
                                  name: 'interests',
                                  value: option.value,
                                  checked: advancedForm.interests.includes(option.value),
                                  onChange: handleAdvancedChange
                                }
                              ),
                              option.label
                            ]
                          ))
                        ),
                        advancedErrors.interests && React.createElement(
                          'div',
                          { key: 'error', className: 'pg-error-message' },
                          advancedErrors.interests
                        )
                      ]
                    ),
                    
                    // Campo: Notificaciones (checkbox único)
                    React.createElement(
                      'div',
                      { key: 'notifications', className: 'pg-form-group' },
                      [
                        React.createElement(
                          'label',
                          { key: 'label', className: 'pg-checkbox-label pg-single-checkbox' },
                          [
                            React.createElement(
                              'input',
                              {
                                key: 'input',
                                type: 'checkbox',
                                name: 'notifications',
                                checked: advancedForm.notifications,
                                onChange: handleAdvancedChange
                              }
                            ),
                            'Recibir notificaciones por email'
                          ]
                        )
                      ]
                    ),
                    
                    // Campo: Suscripción (radio buttons)
                    React.createElement(
                      'div',
                      { key: 'subscription', className: 'pg-form-group' },
                      [
                        React.createElement('label', { key: 'label' }, 'Tipo de suscripción:'),
                        React.createElement(
                          'div',
                          { key: 'options', className: 'pg-radio-group' },
                          subscriptionOptions.map(option => React.createElement(
                            'label',
                            { key: option.value, className: 'pg-radio-label' },
                            [
                              React.createElement(
                                'input',
                                {
                                  key: 'input',
                                  type: 'radio',
                                  name: 'subscription',
                                  value: option.value,
                                  checked: advancedForm.subscription === option.value,
                                  onChange: handleAdvancedChange
                                }
                              ),
                              option.label
                            ]
                          ))
                        )
                      ]
                    ),
                    
                    // Campo: Comentarios
                    React.createElement(
                      'div',
                      { key: 'comments', className: 'pg-form-group' },
                      [
                        React.createElement('label', { key: 'label', htmlFor: 'adv-comments' }, 'Comentarios adicionales:'),
                        React.createElement(
                          'textarea',
                          {
                            key: 'input',
                            id: 'adv-comments',
                            name: 'comments',
                            className: 'pg-textarea',
                            rows: 4,
                            value: advancedForm.comments,
                            onChange: handleAdvancedChange,
                            placeholder: 'Opcional'
                          }
                        )
                      ]
                    )
                  ]
                ),
                
                // Botones
                React.createElement(
                  'div',
                  { key: 'buttons', className: 'pg-form-buttons' },
                  [
                    React.createElement(
                      'button',
                      {
                        key: 'submit',
                        type: 'submit',
                        className: 'pg-button pg-button-primary'
                      },
                      'Enviar'
                    ),
                    React.createElement(
                      'button',
                      {
                        key: 'reset',
                        type: 'button',
                        className: 'pg-button',
                        onClick: handleNewForm
                      },
                      'Limpiar'
                    )
                  ]
                )
              ]
            )
      ),
      
      // Instrucciones
      React.createElement(
        'div',
        { key: 'instructions', className: 'pg-instructions' },
        [
          React.createElement('h3', { key: 'title' }, 'Implementación de formularios'),
          React.createElement(
            'p',
            { key: 'desc' },
            'Los formularios son una parte crucial de muchas aplicaciones. Estas demostraciones muestran cómo implementar formularios simples y complejos con validación.'
          ),
          React.createElement(
            'ul',
            { key: 'list' },
            [
              React.createElement('li', { key: 'tip1' }, 'Siempre valida los datos antes de procesarlos.'),
              React.createElement('li', { key: 'tip2' }, 'Proporciona retroalimentación clara sobre errores.'),
              React.createElement('li', { key: 'tip3' }, 'Usa etiquetas descriptivas y ayudas visuales.'),
              React.createElement('li', { key: 'tip4' }, 'Considera la accesibilidad en tus formularios.')
            ]
          )
        ]
      )
    ]
  );
}

export default FormsDemo;
document.addEventListener('DOMContentLoaded', function () {
    // Verificar si estamos en la página de responder encuesta
    if (!window.location.pathname.includes('responder-encuesta') &&
        !window.location.search.includes('encuestaId')) {
        return;
    }

    // Obtener parámetros de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const encuestaId = urlParams.get('encuestaId');

    // Validar encuestaId
    if (!encuestaId || isNaN(parseInt(encuestaId))) {
        mostrarError('No se especificó una encuesta válida');
        return;
    }

    // Elementos del DOM con verificación
    const getElement = (id) => {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`Elemento con ID '${id}' no encontrado`);
            return null;
        }
        return element;
    };

    const listaPreguntas = getElement('listaPreguntas');
    const btnEnviar = getElement('btnEnviar');
    const nombreEncuesta = getElement('nombreEncuesta');
    const descripcionEncuesta = getElement('descripcionEncuesta');
    const fechaLimite = getElement('fechaLimite');

    // Configurar headers con token de autenticación
    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No se encontró token en localStorage');
            window.location.href = '/login';
            return {};
        }
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    };

    // Cargar datos de la encuesta y preguntas
    async function cargarDatosEncuesta() {
        try {
            // Cargar información básica de la encuesta
            const responseEncuesta = await fetch(`/api/encuestas/${encuestaId}`, {
                headers: getAuthHeaders()
            });

            if (!responseEncuesta.ok) {
                if (responseEncuesta.status === 401 || responseEncuesta.status === 403) {
                    window.location.href = '/login';
                }
                throw new Error('Error al cargar encuesta');
            }

            const encuesta = await responseEncuesta.json();

            // Actualizar información de la encuesta
            if (nombreEncuesta) nombreEncuesta.textContent = encuesta.Nombre;
            if (descripcionEncuesta) descripcionEncuesta.textContent = encuesta.Descripcion || 'Sin descripción';
            if (fechaLimite) fechaLimite.textContent = `Vence: ${formatearFecha(encuesta.FechaLimite)}`;

            // Cargar preguntas
            await cargarPreguntas();
        } catch (error) {
            console.error('Error:', error);
            mostrarError(`Error al cargar la encuesta: ${error.message}`);
        }
    }

    // Cargar preguntas de la encuesta
    async function cargarPreguntas() {
        try {
            const response = await fetch(`/api/preguntas/${encuestaId}`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Error al cargar preguntas');

            const preguntas = await response.json();

            if (!listaPreguntas) return;

            // Limpiar lista de preguntas
            listaPreguntas.innerHTML = '';

            if (!preguntas || preguntas.length === 0) {
                listaPreguntas.innerHTML = `
                    <div class="alert alert-info">
                        Esta encuesta no tiene preguntas aún.
                    </div>
                `;
                return;
            }

            // Generar HTML para cada pregunta
            preguntas.forEach((pregunta, index) => {
                const preguntaHtml = crearHtmlPregunta(pregunta, index);
                listaPreguntas.insertAdjacentHTML('beforeend', preguntaHtml);
            });

            // Configurar botón de enviar si existe
            if (btnEnviar) {
                btnEnviar.disabled = false;
                btnEnviar.addEventListener('click', enviarRespuestas);
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarError(`Error al cargar las preguntas: ${error.message}`);
        }
    }

    // Crear HTML para una pregunta según su tipo
    function crearHtmlPregunta(pregunta, index) {
        // Normalizar el tipo de pregunta
        const tipoPregunta = pregunta.TipoPregunta.toLowerCase().replace(/[_\s]/g, '');

        // Determinar qué tipo de control mostrar
        let opcionesHtml = '';

        if (tipoPregunta.includes('texto') || tipoPregunta.includes('abierta')) {
            opcionesHtml = crearInputTexto(pregunta);
        }
        else if (tipoPregunta.includes('opcionunica') || tipoPregunta.includes('radio')) {
            opcionesHtml = crearOpcionesRadio(pregunta);
        }
        else if (tipoPregunta.includes('seleccionmultiple') || tipoPregunta.includes('checkbox')) {
            opcionesHtml = crearOpcionesCheckbox(pregunta);
        }
        else if (tipoPregunta.includes('escala') || tipoPregunta.includes('likert')) {
            opcionesHtml = crearEscala(pregunta);
        }
        else {
            // Por defecto, mostrar como pregunta abierta
            opcionesHtml = crearInputTexto(pregunta);
        }

        return `
            <div class="card mb-4 pregunta-item" data-pregunta-id="${pregunta.PreguntaID}">
                <div class="card-body">
                    <h5 class="card-title d-flex justify-content-between align-items-center">
                        <span>${index + 1}. ${pregunta.TextoPregunta}</span>
                        ${pregunta.EsObligatoria ? '<span class="badge bg-danger">Obligatoria</span>' : ''}
                    </h5>
                    ${opcionesHtml}
                </div>
            </div>
        `;
    }

    function crearInputTexto(pregunta) {
        return `
            <div class="mb-3">
                <textarea class="form-control respuesta-input" 
                          data-pregunta-id="${pregunta.PreguntaID}"
                          rows="3" 
                          placeholder="Escribe tu respuesta aquí..."
                          ${pregunta.EsObligatoria ? 'required' : ''}></textarea>
            </div>
        `;
    }

    function crearOpcionesRadio(pregunta) {
        // Opciones por defecto si no hay definidas
        const opciones = pregunta.Opciones || [
            { Texto: "Sí", Valor: "si" },
            { Texto: "No", Valor: "no" }
        ];

        return opciones.map((opcion, i) => `
            <div class="form-check">
                <input class="form-check-input respuesta-input" 
                       type="radio" 
                       name="pregunta-${pregunta.PreguntaID}" 
                       data-pregunta-id="${pregunta.PreguntaID}"
                       value="${opcion.Valor || opcion.Texto}"
                       id="radio-${pregunta.PreguntaID}-${i}"
                       ${pregunta.EsObligatoria ? 'required' : ''}>
                <label class="form-check-label" for="radio-${pregunta.PreguntaID}-${i}">
                    ${opcion.Texto || `Opción ${i + 1}`}
                </label>
            </div>
        `).join('');
    }

    function crearOpcionesCheckbox(pregunta) {
        // Opciones por defecto si no hay definidas
        const opciones = pregunta.Opciones || [
            { Texto: "Opción 1", Valor: "opcion1" },
            { Texto: "Opción 2", Valor: "opcion2" }
        ];

        return opciones.map((opcion, i) => `
            <div class="form-check">
                <input class="form-check-input respuesta-input" 
                       type="checkbox" 
                       data-pregunta-id="${pregunta.PreguntaID}"
                       value="${opcion.Valor || opcion.Texto}"
                       id="check-${pregunta.PreguntaID}-${i}">
                <label class="form-check-label" for="check-${pregunta.PreguntaID}-${i}">
                    ${opcion.Texto || `Opción ${i + 1}`}
                </label>
            </div>
        `).join('');
    }

    function crearEscala(pregunta) {
        const max = pregunta.EscalaMaxima || 5;
        return `
            <div class="d-flex justify-content-between align-items-center">
                <span>${pregunta.EscalaMinimaTexto || 'Mínimo'}</span>
                <div class="d-flex gap-2">
                    ${Array.from({ length: max }, (_, i) => i + 1).map(num => `
                        <div class="form-check">
                            <input class="form-check-input respuesta-input" 
                                   type="radio" 
                                   name="pregunta-${pregunta.PreguntaID}" 
                                   data-pregunta-id="${pregunta.PreguntaID}"
                                   value="${num}"
                                   ${pregunta.EsObligatoria ? 'required' : ''}>
                            <label class="form-check-label">${num}</label>
                        </div>
                    `).join('')}
                </div>
                <span>${pregunta.EscalaMaximaTexto || 'Máximo'}</span>
            </div>
        `;
    }

    function formatearFecha(fechaString) {
        try {
            if (!fechaString) return 'Sin fecha definida';
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return new Date(fechaString).toLocaleDateString('es-ES', options);
        } catch (e) {
            console.error('Error formateando fecha:', e);
            return fechaString;
        }
    }

    function mostrarError(mensaje) {
        if (listaPreguntas) {
            listaPreguntas.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    ${mensaje}
                    <button class="btn btn-sm btn-outline-danger ms-3" onclick="window.location.reload()">
                        <i class="bi bi-arrow-clockwise"></i> Reintentar
                    </button>
                </div>
            `;
        } else {
            console.error(mensaje);
        }
    }

    // Función para obtener el ID de usuario desde localStorage o token JWT
    function obtenerUsuarioId() {
        try {
            // 1. Intentar desde userData en localStorage
            const userData = localStorage.getItem('userData');
            if (userData) {
                const parsedData = JSON.parse(userData);
                if (parsedData?.id) return parsedData.id;
                if (parsedData?.usuarioId) return parsedData.usuarioId;
            }

            // 2. Intentar desde el token JWT
            const token = localStorage.getItem('token');
            if (token) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return payload.sub || payload.userId || payload.id || payload.usuarioId;
            }

            // 3. Si no se encuentra, mostrar error
            console.error('No se pudo obtener el ID de usuario');
            return null;
        } catch (error) {
            console.error('Error al obtener usuarioId:', error);
            return null;
        }
    }

    // Función para enviar respuestas (versión completa corregida)
    async function enviarRespuestas() {
        if (!btnEnviar) return;

        // 1. Obtener y validar usuarioId
        const usuarioId = obtenerUsuarioId();
        if (!usuarioId) {
            mostrarError('No se pudo identificar tu usuario. Redirigiendo...');
            setTimeout(() => window.location.href = '/login', 2000);
            return;
        }

        // 2. Validar respuestas obligatorias
        const preguntasObligatorias = document.querySelectorAll('.pregunta-item [required]');
        let todasValidas = true;

        preguntasObligatorias.forEach(input => {
            const preguntaItem = input.closest('.pregunta-item');
            let respuestaValida = true;

            if (input.type === 'radio') {
                respuestaValida = document.querySelector(`input[name="${input.name}"]:checked`) !== null;
            } else {
                respuestaValida = input.value.trim() !== '';
            }

            if (!respuestaValida) {
                preguntaItem.classList.add('border-danger');
                todasValidas = false;
            } else {
                preguntaItem.classList.remove('border-danger');
            }
        });

        if (!todasValidas) {
            mostrarError('Por favor responde todas las preguntas obligatorias marcadas');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        // 3. Recolectar respuestas en el formato que espera el backend
        const respuestasParaEnviar = [];

        document.querySelectorAll('.pregunta-item').forEach(preguntaItem => {
            const preguntaId = parseInt(preguntaItem.dataset.preguntaId);
            if (isNaN(preguntaId)) return;

            // Determinar el tipo de pregunta
            const esRadio = preguntaItem.querySelector('input[type="radio"]') !== null;
            const esCheckbox = preguntaItem.querySelector('input[type="checkbox"]') !== null;
            const esTexto = preguntaItem.querySelector('textarea, input[type="text"]') !== null;

            if (esRadio) {
                // Manejar pregunta de opción única (radio buttons)
                const radioSeleccionado = preguntaItem.querySelector('input[type="radio"]:checked');
                if (radioSeleccionado) {
                    respuestasParaEnviar.push({
                        PreguntaID: preguntaId,
                        RespuestaTexto: null,
                        // Convertir a booleano como espera el backend
                        RespuestaOpcion: radioSeleccionado.value === 'si' ? true : false
                    });
                }
            } else if (esCheckbox) {
                // Manejar pregunta de selección múltiple (checkboxes)
                const checkboxesSeleccionados = Array.from(
                    preguntaItem.querySelectorAll('input[type="checkbox"]:checked')
                );

                if (checkboxesSeleccionados.length > 0) {
                    // Enviar cada checkbox seleccionado como respuesta individual
                    checkboxesSeleccionados.forEach(checkbox => {
                        respuestasParaEnviar.push({
                            PreguntaID: preguntaId,
                            RespuestaTexto: checkbox.value,
                            RespuestaOpcion: null
                        });
                    });
                }
            } else if (esTexto) {
                // Manejar pregunta abierta (texto)
                const inputTexto = preguntaItem.querySelector('textarea, input[type="text"]');
                if (inputTexto && inputTexto.value.trim()) {
                    respuestasParaEnviar.push({
                        PreguntaID: preguntaId,
                        RespuestaTexto: inputTexto.value.trim(),
                        RespuestaOpcion: null
                    });
                }
            }
        });

        // 4. Validar que hay respuestas
        if (respuestasParaEnviar.length === 0) {
            mostrarError('No se encontraron respuestas válidas para enviar');
            return;
        }

        // 5. Preparar payload EXACTAMENTE como lo espera el backend
        const payload = {
            EncuestaID: parseInt(encuestaId),
            UsuarioID: usuarioId,
            respuestas: respuestasParaEnviar
        };

        console.log('Payload a enviar:', JSON.stringify(payload, null, 2));

        // 6. Configurar estado de carga
        btnEnviar.disabled = true;
        const originalText = btnEnviar.innerHTML;
        btnEnviar.innerHTML = `
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Enviando respuestas...
        `;

        try {
            // 7. Obtener token
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Token de autenticación no encontrado');

            // 8. Enviar al servidor
            const response = await fetch('/api/respuestas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            // 9. Manejar respuesta
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.message || 'Error en el servidor';

                // Mostrar mensaje más descriptivo para el usuario
                let mensajeError = 'Error al enviar respuestas';
                if (errorMessage.includes('obligatorias')) {
                    mensajeError = 'Faltan respuestas obligatorias. Por favor completa todas las preguntas requeridas.';
                }

                throw new Error(mensajeError);
            }

            // 10. Mostrar éxito
            mostrarMensajeExito('¡Tus respuestas se enviaron correctamente!');

            // Redirigir después de 2 segundos
            setTimeout(() => {
                window.location.href = '/empleado';
            }, 2000);

        } catch (error) {
            console.error('Error al enviar respuestas:', error);

            let mensajeError = error.message || 'Error al enviar respuestas';
            if (error.message.includes('token')) {
                mensajeError = 'Sesión expirada. Redirigiendo...';
                setTimeout(() => window.location.href = '/login', 2000);
            }

            mostrarError(mensajeError);
            btnEnviar.disabled = false;
            btnEnviar.innerHTML = originalText;
        }
    }

    function mostrarMensajeExito(mensaje) {
        const container = document.getElementById('mensaje-container') || document.body;
        const alertHtml = `
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <i class="bi bi-check-circle-fill me-2"></i>
                ${mensaje}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        // Insertar mensaje
        container.insertAdjacentHTML('afterbegin', alertHtml);

        // Autoeliminar después de 5 segundos
        setTimeout(() => {
            const alertElement = document.querySelector('.alert-success');
            if (alertElement) alertElement.remove();
        }, 5000);
    }
    // Iniciar carga de datos
    cargarDatosEncuesta();
});
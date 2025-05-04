const API_URL = "/api/encuestas";
const token = localStorage.getItem('token');
const usuario = JSON.parse(localStorage.getItem('usuario'));

// Verificar autenticación y permisos
if (!token || !usuario?.EsAdmin) {
  window.location.href = "/login";
}

// Elementos del DOM
const tablaEncuestasAdmin = document.getElementById('tablaEncuestasAdmin');
const formNuevaEncuesta = document.getElementById('formNuevaEncuesta');
const formEditarEncuesta = document.getElementById('formEditarEncuesta');
const btnCerrarSesion = document.getElementById('btnCerrarSesion');

// Función para mostrar errores
function mostrarError(mensaje) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'alert alert-danger mt-3';
  errorDiv.textContent = mensaje;
  document.querySelector('.container').prepend(errorDiv);
  setTimeout(() => errorDiv.remove(), 5000);
}

// Función para mostrar éxito
function mostrarExito(mensaje) {
  const successDiv = document.createElement('div');
  successDiv.className = 'alert alert-success mt-3';
  successDiv.textContent = mensaje;
  document.querySelector('.container').prepend(successDiv);
  setTimeout(() => successDiv.remove(), 5000);
}

// Función para formatear fechas
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

// Función para cargar encuestas
async function cargarEncuestas() {
  try {
    const response = await fetch(`${API_URL}`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al cargar encuestas');
    }
    
    const encuestas = await response.json();
    renderizarEncuestas(encuestas);
  } catch (error) {
    mostrarError(error.message);
    console.error('Error al cargar encuestas:', error);
  }
}

// Función para renderizar encuestas en la tabla
function renderizarEncuestas(encuestas) {
  if (!tablaEncuestasAdmin) return;
  
  tablaEncuestasAdmin.innerHTML = '';
  
  if (!encuestas || encuestas.length === 0) {
    tablaEncuestasAdmin.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">No hay encuestas disponibles</td>
      </tr>
    `;
    return;
  }
  
  encuestas.forEach((encuesta, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="text-center">${index + 1}</td>
      <td class="fw-semibold">${encuesta.Nombre || 'Sin nombre'}</td>
      <td class="text-center">${formatDate(encuesta.FechaCreacion)}</td>
      <td class="text-center">${formatDate(encuesta.FechaLimite)}</td>
      <td>${encuesta.Descripcion || 'Sin descripción'}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-outline-primary action-btn me-1" onclick="editarEncuesta(${encuesta.EncuestaID})">
          <i class="bi bi-pencil-square"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger action-btn" onclick="eliminarEncuesta(${encuesta.EncuestaID})">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    tablaEncuestasAdmin.appendChild(row);
  });
}

// Función para mostrar modal de nueva encuesta
function mostrarModalNuevaEncuesta() {
  const modal = new bootstrap.Modal(document.getElementById('modalNuevaEncuesta'));
  if (formNuevaEncuesta) formNuevaEncuesta.reset();
  const listaPreguntas = document.getElementById('listaPreguntas');
  if (listaPreguntas) listaPreguntas.innerHTML = '';
  modal.show();
}

// Función para agregar pregunta al formulario
function agregarPregunta() {
  const template = document.getElementById('templatePregunta');
  if (!template) return;
  
  const clone = template.content.cloneNode(true);
  const listaPreguntas = document.getElementById('listaPreguntas');
  if (!listaPreguntas) return;
  
  const preguntaNum = listaPreguntas.children.length + 1;
  const preguntaNumero = clone.querySelector('.pregunta-numero');
  if (preguntaNumero) preguntaNumero.textContent = preguntaNum;
  
  // Configurar eventos para preguntas dependientes
  const tipoSelect = clone.querySelector('.pregunta-tipo');
  if (tipoSelect) {
    tipoSelect.addEventListener('change', function() {
      const dependienteConfig = this.closest('.pregunta-item').querySelector('.dependiente-config');
      if (dependienteConfig) {
        dependienteConfig.style.display = this.value === 'Dependiente' ? 'block' : 'none';
      }
    });
  }
  
  // Llenar opciones de preguntas padre
  const padreSelect = clone.querySelector('.pregunta-padre');
  if (padreSelect) {
    padreSelect.innerHTML = '<option value="">Seleccione una pregunta</option>';
    const preguntasAnteriores = listaPreguntas.querySelectorAll('.pregunta-item');
    
    preguntasAnteriores.forEach((pregunta, index) => {
      const texto = pregunta.querySelector('.pregunta-texto')?.value || `Pregunta ${index + 1}`;
      padreSelect.innerHTML += `<option value="${index + 1}">${texto}</option>`;
    });
  }
  
  listaPreguntas.appendChild(clone);
}

// Función para eliminar pregunta del formulario
function eliminarPregunta(btn) {
  const preguntaItem = btn.closest('.pregunta-item');
  if (!preguntaItem) return;
  
  preguntaItem.remove();
  
  // Renumerar las preguntas restantes
  const listaPreguntas = document.getElementById('listaPreguntas');
  if (listaPreguntas) {
    listaPreguntas.querySelectorAll('.pregunta-item').forEach((item, index) => {
      const numero = item.querySelector('.pregunta-numero');
      if (numero) {
        numero.textContent = index + 1;
      }
    });
  }
}

// Evento para enviar nueva encuesta con preguntas
if (formNuevaEncuesta) {
  formNuevaEncuesta.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validar campos básicos
    const Nombre = document.getElementById('NombreEncuesta')?.value.trim();
    const Descripcion = document.getElementById('DescripcionEncuesta')?.value.trim();
    const FechaLimite = document.getElementById('FechaLimite')?.value;
    
    if (!Nombre || !FechaLimite) {
      mostrarError('Nombre y Fecha Límite son campos requeridos');
      return;
    }
    
    // Validar que haya al menos una pregunta
    const preguntas = document.querySelectorAll('.pregunta-item');
    if (preguntas.length === 0) {
      mostrarError('Debe agregar al menos una pregunta a la encuesta');
      return;
    }
    
    // Preparar datos de preguntas
    const preguntasData = [];
    let preguntasValidas = true;
    
    preguntas.forEach((pregunta, index) => {
      const texto = pregunta.querySelector('.pregunta-texto')?.value.trim();
      const tipo = pregunta.querySelector('.pregunta-tipo')?.value;
      const obligatoria = pregunta.querySelector('.pregunta-obligatoria')?.checked || false;
      
      if (!texto || !tipo) {
        pregunta.classList.add('border-danger');
        preguntasValidas = false;
        return;
      }
      
      pregunta.classList.remove('border-danger');
      
      const preguntaData = {
        TextoPregunta: texto,
        TipoPregunta: tipo,
        Orden: index + 1,
        EsObligatoria: obligatoria
      };
      
      // Si es dependiente, agregar datos adicionales
      if (tipo === 'Dependiente') {
        const padreId = pregunta.querySelector('.pregunta-padre')?.value;
        const respuesta = pregunta.querySelector('.pregunta-respuesta')?.value;
        
        if (!padreId) {
          pregunta.classList.add('border-danger');
          preguntasValidas = false;
          return;
        }
        
        preguntaData.PreguntaPadreID = parseInt(padreId);
        preguntaData.DependeDeRespuesta = respuesta;
      }
      
      preguntasData.push(preguntaData);
    });
    
    if (!preguntasValidas) {
      mostrarError('Por favor complete todos los campos de las preguntas');
      return;
    }
    
    try {
      // Mostrar estado de carga
      const submitBtn = e.target.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Procesando...';
      submitBtn.disabled = true;
      
      // Enviar datos al backend
      const response = await fetch(`${API_URL}/crear-con-preguntas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          encuesta: {
            Nombre, 
            Descripcion: Descripcion || null, 
            FechaLimite: new Date(FechaLimite).toISOString(), 
            CreadaPor: usuario.UsuarioID,
            Estado: 'Activa',
            Archivada: false
          },
          preguntas: preguntasData
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Error al crear encuesta con preguntas');
      }
      
      // Cerrar modal y actualizar tabla
      const modal = bootstrap.Modal.getInstance(document.getElementById('modalNuevaEncuesta'));
      if (modal) modal.hide();
      
      mostrarExito('Encuesta creada correctamente con ' + preguntasData.length + ' preguntas');
      await cargarEncuestas();
    } catch (error) {
      console.error('Error al crear encuesta:', error);
      
      let mensajeError = error.message;
      if (error.message.includes('Fecha') || error.message.includes('date')) {
        mensajeError = 'Formato de fecha inválido. Use YYYY-MM-DD';
      } else if (error.message.includes('pregunta') || error.message.includes('Pregunta')) {
        mensajeError = 'Error en las preguntas: ' + error.message;
      }
      
      mostrarError(mensajeError);
    } finally {
      // Restaurar botón
      const submitBtn = e.target.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.innerHTML = 'Crear Encuesta';
        submitBtn.disabled = false;
      }
    }
  });
}

// Función para editar encuesta
async function editarEncuesta(id) {
  try {
    // Cargar datos de la encuesta desde el backend
    const response = await fetch(`${API_URL}/${id}`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const encuesta = await response.json();
    
    // 🚫 Bloquear edición si la encuesta ya venció
    const fechaLimite = new Date(encuesta.FechaLimite);
    const ahora = new Date();
    if (fechaLimite < ahora) {
      mostrarError('No se puede editar una encuesta que ya ha vencido.');
      return;
    }

    // Llenar formulario de edición
    document.getElementById('editNombreEncuesta').value = encuesta.Nombre || '';
    document.getElementById('editDescripcionEncuesta').value = encuesta.Descripcion || '';

    const fechaFormateada = fechaLimite.toISOString().split('T')[0];
    document.getElementById('editFechaLimite').value = fechaFormateada;
    document.getElementById('editEncuestaId').value = encuesta.EncuestaID;

    // Mostrar el modal de edición
    const modal = new bootstrap.Modal(document.getElementById('modalEditarEncuesta'));
    modal.show();

  } catch (error) {
    console.error('Error en editarEncuesta:', error);
    mostrarError(`Error al cargar encuesta: ${error.message}`);
  }
}


// Evento para guardar cambios en edición
if (formEditarEncuesta) {
  formEditarEncuesta.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('editEncuestaId')?.value;
    if (!id) {
      mostrarError('ID de encuesta no válido');
      return;
    }
    
    const datos = {
      Nombre: document.getElementById('editNombreEncuesta')?.value.trim(),
      Descripcion: document.getElementById('editDescripcionEncuesta')?.value.trim(),
      FechaLimite: document.getElementById('editFechaLimite')?.value,
      ModificadoPor: usuario.UsuarioID
    };

    // Validación básica
    if (!datos.Nombre || !datos.FechaLimite) {
      mostrarError('Nombre y Fecha Límite son campos requeridos');
      return;
    }

    try {
      // Mostrar estado de carga
      const submitBtn = e.target.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando...';
      submitBtn.disabled = true;
      
      // Enviar actualización
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datos)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || result.error || 'Error al guardar cambios');
      }

      // Cerrar modal y actualizar vista
      const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarEncuesta'));
      if (modal) modal.hide();
      
      mostrarExito('Encuesta actualizada correctamente');
      await cargarEncuestas();
      
    } catch (error) {
      console.error('Error en guardar cambios:', error);
      mostrarError(`Error al actualizar: ${error.message}`);
    } finally {
      // Restaurar botón
      const submitBtn = e.target.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.innerHTML = 'Guardar Cambios';
        submitBtn.disabled = false;
      }
    }
  });
}

// Función para eliminar encuesta
async function eliminarEncuesta(id) {
  try {
    const confirmacion = await Swal.fire({
      title: '¿Eliminar encuesta?',
      text: "¡Esta acción no se puede deshacer!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || 'Error al eliminar encuesta');
    }
    
    await Swal.fire(
      '¡Eliminada!',
      'La encuesta ha sido eliminada correctamente.',
      'success'
    );
    
    await cargarEncuestas();
  } catch (error) {
    console.error('Error al eliminar encuesta:', error);
    Swal.fire(
      'Error',
      error.message || 'Ocurrió un error al eliminar la encuesta',
      'error'
    );
  }
}

// Función para cerrar sesión
function cerrarSesion() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = "/login";
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  cargarEncuestas();
  
  // Asignar evento al botón de agregar encuesta
  document.querySelector('.btn-oomapas[data-bs-target="#modalNuevaEncuesta"]')
    ?.addEventListener('click', mostrarModalNuevaEncuesta);
  
  // Asignar evento al botón de agregar pregunta
  document.getElementById('btnAgregarPregunta')
    ?.addEventListener('click', agregarPregunta);
  
  // Configurar datepicker para fechas
  if (typeof flatpickr !== 'undefined') {
    flatpickr("#FechaLimite", {
      dateFormat: "Y-m-d",
      minDate: "today"
    });
    
    flatpickr("#editFechaLimite", {
      dateFormat: "Y-m-d",
      minDate: "today"
    });
  }
  
  // Asignar evento al botón de cerrar sesión
  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener('click', cerrarSesion);
  }
});

async function verEstadisticas(encuestaId) {
  try {
    const response = await fetch(`${API_URL}/${encuestaId}/estadisticas`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Error al obtener estadísticas');

    let html = `
      <h5 class="mb-3">${data.encuesta.nombre}</h5>
      <p><strong>Descripción:</strong> ${data.encuesta.descripcion || 'Sin descripción'}</p>
      <p><strong>Fecha Límite:</strong> ${formatDate(data.encuesta.fechaLimite)}</p>
      <hr>

      <div class="alert alert-secondary">
        <strong>📋 Encuestas respondidas por usuario:</strong><br>
        <span>${data.resultados[0]?.EncuestasRespondidasPorUsuario || 'Sin información disponible'}</span>
      </div>

      <div class="list-group">
    `;

    if (data.resultados.length === 0) {
      html += `<div class="alert alert-info">Aún no hay respuestas para esta encuesta.</div>`;
    } else {
      data.resultados.forEach(p => {
        html += `
          <div class="list-group-item">
            <h6 class="mb-1">${p.TextoPregunta}</h6>
            <small>
              <strong>Tipo:</strong> ${p.TipoPregunta}<br>
              👥 <strong>Total Usuarios:</strong> ${p.TotalUsuarios} &nbsp; | &nbsp;
              📝 <strong>Total Respuestas:</strong> ${p.TotalRespuestas}<br>
              ✔️ <strong>Sí:</strong> ${p.RespuestasSI || 0} (${p.PorcentajeSI || 0}%) &nbsp;
              ❌ <strong>No:</strong> ${p.RespuestasNO || 0} (${p.PorcentajeNO || 0}%)<br>
              📊 <strong>Promedio de respuestas por usuario:</strong> ${p.PromedioRespuestasPorUsuario || 0}
            </small>
          </div>
        `;
      });
    }

    html += `</div>`;
    document.getElementById('contenidoEstadisticas').innerHTML = html;
    new bootstrap.Modal(document.getElementById('modalEstadisticas')).show();

  } catch (error) {
    console.error('Error al mostrar estadísticas:', error);
    Swal.fire('Error', error.message, 'error');
  }
}

//FUNCION PARA RENDERIZAR ENCUESTAS EN LA TABLA
function renderizarEncuestas(encuestas) {
  if (!tablaEncuestasAdmin) return;

  tablaEncuestasAdmin.innerHTML = '';

  if (!encuestas || encuestas.length === 0) {
    tablaEncuestasAdmin.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">No hay encuestas disponibles</td>
      </tr>
    `;
    return;
  }

  encuestas.forEach((encuesta, index) => {
    const fechaLimite = new Date(encuesta.FechaLimite);
    const fechaHoy = new Date();
    const mostrarEstadisticas = fechaHoy >= fechaLimite;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="text-center">${index + 1}</td>
      <td class="fw-semibold">${encuesta.Nombre || 'Sin nombre'}</td>
      <td class="text-center">${formatDate(encuesta.FechaCreacion)}</td>
      <td class="text-center">${formatDate(encuesta.FechaLimite)}</td>
      <td>${encuesta.Descripcion || 'Sin descripción'}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-outline-primary action-btn me-1" onclick="editarEncuesta(${encuesta.EncuestaID})" title="Editar">
          <i class="bi bi-pencil-square"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger action-btn me-1" onclick="eliminarEncuesta(${encuesta.EncuestaID})" title="Eliminar">
          <i class="bi bi-trash"></i>
        </button>
        ${mostrarEstadisticas
          ? `<button class="btn btn-sm btn-outline-success action-btn" onclick="verEstadisticas(${encuesta.EncuestaID})" title="Ver estadísticas">
              <i class="bi bi-bar-chart-line-fill"></i>
            </button>`
          : ''
        }
      </td>
    `;
    tablaEncuestasAdmin.appendChild(row);
  });
}


// Hacer funciones accesibles globalmente para los eventos onclick en HTML
window.editarEncuesta = editarEncuesta;
window.eliminarEncuesta = eliminarEncuesta;
window.eliminarPregunta = eliminarPregunta;
window.verEstadisticas = verEstadisticas;
window.cerrarSesion = cerrarSesion;


window.exportarEstadisticasPDF = async function () {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  const contenido = document.getElementById('contenidoEstadisticas');

  if (!contenido) {
    Swal.fire('Error', 'No hay contenido de estadísticas para exportar.', 'error');
    return;
  }

  try {
    const canvas = await html2canvas(contenido, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, pdfHeight);
    pdf.save('estadisticas_encuesta.pdf');
  } catch (error) {
    console.error('Error exportando PDF:', error);
    Swal.fire('Error', 'Ocurrió un problema al generar el PDF.', 'error');
  }
};

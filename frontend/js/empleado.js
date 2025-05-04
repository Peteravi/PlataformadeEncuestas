const API_URL = "/api";
const token = localStorage.getItem('token');
const usuario = JSON.parse(localStorage.getItem('usuario'));

// Verificar autenticación y permisos
if (!token || usuario?.EsAdmin) {
  window.location.href = "/login";
}

// Elementos del DOM
const tablaEncuestasEmpleado = document.getElementById('tablaEncuestasEmpleado');

// Función para mostrar errores
function mostrarError(mensaje) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'alert alert-danger mt-3';
  errorDiv.textContent = mensaje;
  document.querySelector('.container').prepend(errorDiv);
  setTimeout(() => errorDiv.remove(), 5000);
}

// Función para cargar encuestas
async function cargarEncuestas() {
  try {
    const response = await fetch(`${API_URL}/encuestas`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error('Error al cargar encuestas');
    }
    
    const encuestas = await response.json();
    tablaEncuestasEmpleado.innerHTML = '';
    
    if (encuestas.length === 0) {
      tablaEncuestasEmpleado.innerHTML = `
        <tr>
          <td colspan="4" class="text-center">No hay encuestas disponibles</td>
        </tr>
      `;
      return;
    }
    
    encuestas.forEach((encuesta) => {
      tablaEncuestasEmpleado.innerHTML += `
        <tr>
          <td>${encuesta.Nombre || 'Sin nombre'}</td>
          <td>${encuesta.Descripcion || 'Sin descripción'}</td>
          <td>${encuesta.FechaLimite ? new Date(encuesta.FechaLimite).toLocaleDateString() : 'N/A'}</td>
          <td>
            <a href="/preguntas.html?encuestaId=${encuesta.EncuestaID}" class="btn btn-primary btn-sm">Contestar</a>
          </td>
        </tr>
      `;
    });
  } catch (error) {
    mostrarError(error.message);
  }
}

// Función para cerrar sesión
function cerrarSesion() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = "/login";
}

async function enviarRespuestas() {
  const btnEnviar = document.getElementById('btnEnviar');
  if (!btnEnviar) return;

  // Recolectar respuestas
  const respuestas = [];
  const inputsRespuestas = document.querySelectorAll('.respuesta-input');
  
  inputsRespuestas.forEach(input => {
      if (input.type === 'radio' && input.checked) {
          respuestas.push({
              preguntaId: input.dataset.preguntaId,
              respuesta: input.value
          });
      } 
      else if (input.type === 'checkbox' && input.checked) {
          respuestas.push({
              preguntaId: input.dataset.preguntaId,
              respuesta: input.value
          });
      } 
      else if ((input.type === 'textarea' || input.type === 'text') && input.value.trim()) {
          respuestas.push({
              preguntaId: input.dataset.preguntaId,
              respuesta: input.value.trim()
          });
      }
  });

  // Validar que haya al menos una respuesta
  if (respuestas.length === 0) {
      mostrarError('Por favor, responda al menos una pregunta');
      return;
  }

  // Mostrar loading
  const originalContent = btnEnviar.innerHTML;
  btnEnviar.disabled = true;
  btnEnviar.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Enviando...';

  try {
      const response = await fetch('/api/respuestas', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
              encuestaId: obtenerIdEncuesta(),
              respuestas
          })
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al enviar respuestas');
      }

      // Mostrar SweetAlert de éxito
      await Swal.fire({
          title: '¡Éxito!',
          text: 'Tus respuestas han sido guardadas correctamente',
          icon: 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#005baa',
          timer: 3000,
          timerProgressBar: true,
          willClose: () => {
              // Redirigir después de cerrar el modal
              window.location.href = '/empleado.html';
          }
      });

  } catch (error) {
      // Mostrar SweetAlert de error
      await Swal.fire({
          title: 'Error',
          text: error.message,
          icon: 'error',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#dc3545'
      });
      
  } finally {
      // Restaurar el botón
      if (btnEnviar) {
          btnEnviar.disabled = false;
          btnEnviar.innerHTML = originalContent;
      }
  }
}

// Función para mostrar mensaje de éxito (opcional, si no usas SweetAlert)
function mostrarMensajeExito(mensaje) {
  const successDiv = document.createElement('div');
  successDiv.className = 'alert alert-success mt-3 alert-dismissible fade show';
  successDiv.innerHTML = `
      <strong>¡Éxito!</strong> ${mensaje}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  document.querySelector('.container').prepend(successDiv);
  setTimeout(() => successDiv.remove(), 5000);
} 

function obtenerIdEncuesta() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('encuestaId');
}

// Al cargar la página
document.addEventListener('DOMContentLoaded', cargarEncuestas);
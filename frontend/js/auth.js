const API_URL = "/api"; // Asegúrate de que esta URL sea la correcta para tu servidor

// Función para mostrar mensajes de error
function mostrarError(mensaje) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'alert alert-danger mt-3';
  errorDiv.textContent = mensaje;
  
  const forms = document.querySelectorAll('form');
  if (forms.length > 0) {
    forms[0].prepend(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
  } else {
    alert(mensaje);
  }
}

// Función para cerrar sesión
function cerrarSesion() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = "/login";
}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  // Verificar si ya está autenticado
  const token = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  
  if (token && usuario) {
    if (usuario.EsAdmin) {
      window.location.href = "/admin";
    } else {
      window.location.href = "/empleado";
    }
    return;
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const NombreUsuario = document.getElementById('NombreUsuario').value.trim();
      const Contraseña = document.getElementById('Contraseña').value.trim();

      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ NombreUsuario, Contraseña })
        });

        const data = await response.json();
        
        if (response.ok) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('usuario', JSON.stringify(data.usuario));
          
          if (data.usuario.EsAdmin) {
            window.location.href = "/admin";
          } else {
            window.location.href = "/empleado";
          }
        } else {
          mostrarError(data.message || 'Credenciales incorrectas');
        }
      } catch (error) {
        mostrarError('Error de conexión con el servidor');
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const Nombre = document.getElementById('Nombre').value.trim();
      const Apellido = document.getElementById('Apellido').value.trim();
      const NombreUsuario = document.getElementById('NombreUsuario').value.trim();
      const Contraseña = document.getElementById('Contraseña').value;

      if (Contraseña.length < 6) {
        mostrarError('La contraseña debe tener al menos 6 caracteres');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ Nombre, Apellido, NombreUsuario, Contraseña })
        });

        const data = await response.json();
        
        if (response.ok) {
          alert('Empleado registrado correctamente');
          window.location.href = "/login";
        } else {
          mostrarError(data.message || 'Error en el registro');
        }
      } catch (error) {
        mostrarError('Error de conexión con el servidor');
      }
    });
  }
});

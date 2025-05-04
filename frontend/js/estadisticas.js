 // Variables globales
 let graficoPrincipal, graficoSiNo, graficoParticipacion;
 let datosEstadisticas = {};
 let encuestasDisponibles = [];

 document.addEventListener('DOMContentLoaded', async function() {
     // Cargar encuestas disponibles
     await cargarEncuestas();
     
     // Configurar evento de cambio en el select
     document.getElementById('selectEncuesta').addEventListener('change', function() {
         if (this.value) {
             cargarEstadisticas(this.value);
         }
     });
 });

 async function cargarEncuestas() {
     try {
         const response = await fetch('/api/encuestas', {
             headers: {
                 'Authorization': `Bearer ${localStorage.getItem('token')}`
             }
         });
         
         encuestasDisponibles = await response.json();
         const select = document.getElementById('selectEncuesta');
         
         encuestasDisponibles.forEach(encuesta => {
             const option = document.createElement('option');
             option.value = encuesta.EncuestaID;
             option.textContent = encuesta.Nombre;
             select.appendChild(option);
         });
         
         // Seleccionar la primera encuesta por defecto
         if (encuestasDisponibles.length > 0) {
             select.value = encuestasDisponibles[0].EncuestaID;
             await cargarEstadisticas(select.value);
         }
     } catch (error) {
         console.error('Error cargando encuestas:', error);
         mostrarError('No se pudieron cargar las encuestas');
     }
 }

 async function cargarEstadisticas(encuestaId) {
     try {
         const response = await fetch(`/api/respuestas/estadisticas/${encuestaId}`, {
             headers: {
                 'Authorization': `Bearer ${localStorage.getItem('token')}`
             }
         });
         
         datosEstadisticas = await response.json();
         actualizarEstadisticas();
         renderizarGraficos();
         renderizarListaPreguntas();
     } catch (error) {
         console.error('Error cargando estadísticas:', error);
         mostrarError('No se pudieron cargar las estadísticas');
     }
 }

 function actualizarEstadisticas() {
     // Calcular métricas
     const totalRespuestas = datosEstadisticas.reduce((sum, p) => sum + p.totalRespuestas, 0);
     const totalPreguntas = datosEstadisticas.length;
     const participantesUnicos = 0; // Deberías obtener este dato del backend
     const tasaCompletitud = totalRespuestas > 0 ? Math.round((totalRespuestas / (totalPreguntas * participantesUnicos)) * 100) : 0;
     
     // Actualizar UI
     document.getElementById('totalRespuestas').textContent = totalRespuestas;
     document.getElementById('totalPreguntas').textContent = totalPreguntas;
     document.getElementById('participantes').textContent = participantesUnicos;
     document.getElementById('completadas').textContent = `${tasaCompletitud}%`;
 }

 function renderizarGraficos() {
     // Destruir gráficos existentes
     if (graficoPrincipal) graficoPrincipal.destroy();
     if (graficoSiNo) graficoSiNo.destroy();
     if (graficoParticipacion) graficoParticipacion.destroy();

     // Filtrar preguntas de opción única (Sí/No)
     const preguntasSiNo = datosEstadisticas.filter(p => p.tipo === 'OpcionUnica');
     
     // Gráfico principal (bar/pie)
     const ctxPrincipal = document.getElementById('graficoPrincipal').getContext('2d');
     graficoPrincipal = new Chart(ctxPrincipal, {
         type: 'bar',
         data: {
             labels: datosEstadisticas.map(p => p.textoPregunta.substring(0, 25) + (p.textoPregunta.length > 25 ? '...' : '')),
             datasets: [{
                 label: 'Respuestas',
                 data: datosEstadisticas.map(p => p.totalRespuestas),
                 backgroundColor: '#4e73df',
                 borderColor: '#4e73df',
                 borderWidth: 1
             }]
         },
         options: {
             responsive: true,
             maintainAspectRatio: false,
             plugins: {
                 legend: {
                     display: false
                 },
                 tooltip: {
                     callbacks: {
                         label: function(context) {
                             return `Respuestas: ${context.raw}`;
                         }
                     }
                 }
             },
             scales: {
                 y: {
                     beginAtZero: true,
                     ticks: {
                         precision: 0
                     }
                 },
                 x: {
                     ticks: {
                         autoSkip: false,
                         maxRotation: 45,
                         minRotation: 45
                     }
                 }
             }
         }
     });

     // Gráfico de Sí/No
     if (preguntasSiNo.length > 0) {
         const ctxSiNo = document.getElementById('graficoSiNo').getContext('2d');
         graficoSiNo = new Chart(ctxSiNo, {
             type: 'doughnut',
             data: {
                 labels: ['Sí', 'No'],
                 datasets: [{
                     data: [
                         preguntasSiNo.reduce((sum, p) => sum + p.conteo.si, 0),
                         preguntasSiNo.reduce((sum, p) => sum + p.conteo.no, 0)
                     ],
                     backgroundColor: ['#1cc88a', '#e74a3b'],
                     hoverBackgroundColor: ['#17a673', '#be2617']
                 }]
             },
             options: {
                 responsive: true,
                 maintainAspectRatio: false,
                 plugins: {
                     legend: {
                         position: 'bottom'
                     },
                     tooltip: {
                         callbacks: {
                             label: function(context) {
                                 const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                 const value = context.raw;
                                 const percentage = Math.round((value / total) * 100);
                                 return `${context.label}: ${value} (${percentage}%)`;
                             }
                         }
                     }
                 }
             }
         });
     }

     // Gráfico de participación (simulado)
     const ctxParticipacion = document.getElementById('graficoParticipacion').getContext('2d');
     graficoParticipacion = new Chart(ctxParticipacion, {
         type: 'line',
         data: {
             labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
             datasets: [{
                 label: 'Respuestas por día',
                 data: [12, 19, 8, 15, 12, 5, 10],
                 backgroundColor: 'rgba(78, 115, 223, 0.05)',
                 borderColor: 'rgba(78, 115, 223, 1)',
                 borderWidth: 2,
                 pointBackgroundColor: 'rgba(78, 115, 223, 1)',
                 pointBorderColor: '#fff',
                 pointHoverRadius: 5,
                 pointHoverBackgroundColor: 'rgba(78, 115, 223, 1)',
                 pointHoverBorderColor: 'rgba(78, 115, 223, 1)',
                 pointHitRadius: 10,
                 pointBorderWidth: 2,
                 fill: true
             }]
         },
         options: {
             responsive: true,
             maintainAspectRatio: false,
             plugins: {
                 legend: {
                     display: false
                 }
             },
             scales: {
                 y: {
                     beginAtZero: true,
                     ticks: {
                         precision: 0
                     }
                 }
             }
         }
     });

     // Configurar botones de cambio de tipo de gráfico
     document.querySelectorAll('.chart-type').forEach(btn => {
         btn.addEventListener('click', function() {
             document.querySelectorAll('.chart-type').forEach(b => b.classList.remove('active'));
             this.classList.add('active');
             
             graficoPrincipal.config.type = this.dataset.type;
             graficoPrincipal.update();
         });
     });
 }

 function renderizarListaPreguntas() {
     const container = document.getElementById('listaPreguntas');
     container.innerHTML = '';
     
     datosEstadisticas.forEach(pregunta => {
         const item = document.createElement('div');
         item.className = 'question-item';
         
         let contenido = `
             <h6 class="fw-bold">${pregunta.textoPregunta}</h6>
             <div class="d-flex justify-content-between small">
                 <span class="text-muted">${pregunta.tipo}</span>
                 <span class="badge bg-primary">${pregunta.totalRespuestas} respuestas</span>
             </div>
         `;
         
         if (pregunta.tipo === 'OpcionUnica') {
             const total = pregunta.conteo.si + pregunta.conteo.no;
             const porcentajeSi = Math.round((pregunta.conteo.si / total) * 100);
             const porcentajeNo = Math.round((pregunta.conteo.no / total) * 100);
             
             contenido += `
                 <div class="progress mt-2" style="height: 10px;">
                     <div class="progress-bar bg-success" role="progressbar" 
                          style="width: ${porcentajeSi}%" 
                          aria-valuenow="${porcentajeSi}" 
                          aria-valuemin="0" 
                          aria-valuemax="100"></div>
                     <div class="progress-bar bg-danger" role="progressbar" 
                          style="width: ${porcentajeNo}%" 
                          aria-valuenow="${porcentajeNo}" 
                          aria-valuemin="0" 
                          aria-valuemax="100"></div>
                 </div>
                 <div class="d-flex justify-content-between small mt-1">
                     <span>Sí: ${pregunta.conteo.si} (${porcentajeSi}%)</span>
                     <span>No: ${pregunta.conteo.no} (${porcentajeNo}%)</span>
                 </div>
             `;
         }
         
         item.innerHTML = contenido;
         container.appendChild(item);
     });
 }

 function mostrarError(mensaje) {
     const container = document.getElementById('listaPreguntas');
     container.innerHTML = `
         <div class="alert alert-danger">
             <i class="bi bi-exclamation-triangle-fill me-2"></i>
             ${mensaje}
         </div>
     `;
 }

 function obtenerIdEncuesta() {
     const urlParams = new URLSearchParams(window.location.search);
     return urlParams.get('encuestaId');
 }

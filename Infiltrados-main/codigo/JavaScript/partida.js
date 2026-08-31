// ================================
// ESCALADO DEL TABLERO
// ================================
function ajustarEscalaLienzo() {
    const ANCHO_BASE = 1920;
    const ALTO_BASE = 1080;
    const contenedor = document.getElementById('contenedor-juego');

    if (!contenedor) return;

    const escalaAncho = window.innerWidth / ANCHO_BASE;
    const escalaAlto = window.innerHeight / ALTO_BASE;
    const escalaFinal = Math.min(escalaAncho, escalaAlto);

    contenedor.style.transform = `scale(${escalaFinal})`;
}

window.addEventListener('resize', ajustarEscalaLienzo);
window.addEventListener('load', ajustarEscalaLienzo);

// ================================
// GESTIÓN DE PARTIDAS (LOCALSTORAGE)
// ================================
let partidas = JSON.parse(localStorage.getItem('infiltrados_partidas')) || [];
let partidaSeleccionadaId = null;

const contenedorLista = document.getElementById('contenedor-lista-partidas');
const panelInfo = document.getElementById('panel-info-partida');
const btnJugar = document.getElementById('btn-jugar');
const btnEliminar = document.getElementById('btn-eliminar');
const btnNueva = document.getElementById('btn-nueva');

// Elementos del Modal
const modalNueva = document.getElementById('modal-nueva-partida');
const inputNombre = document.getElementById('input-nombre-partida');
const btnModalCrear = document.getElementById('btn-modal-crear');
const btnModalCancelar = document.getElementById('btn-modal-cancelar');

function guardarEnMemoria() {
    localStorage.setItem('infiltrados_partidas', JSON.stringify(partidas));
}

function renderizarPartidas() {
    contenedorLista.innerHTML = '';

    if (partidas.length === 0) {
        contenedorLista.innerHTML = `
            <div class="mensaje-vacio">
                NO HAY PARTIDAS.<br>CREA UNA NUEVA PARA EMPEZAR.
            </div>
        `;
        btnJugar.disabled = true;
        btnEliminar.disabled = true;
        panelInfo.innerHTML = `<span class="texto-placeholder">SIN PARTIDA SELECCIONADA</span>`;
        partidaSeleccionadaId = null;
        return;
    }

    partidas.forEach(partida => {
        const slot = document.createElement('div');
        slot.classList.add('slot-partida');
        if (partida.id === partidaSeleccionadaId) {
            slot.classList.add('seleccionado');
        }

        slot.innerHTML = `
            <span>${partida.nombre}</span>
            <span style="font-size: 14px; opacity: 0.8;">${partida.fecha}</span>
        `;

        slot.addEventListener('click', () => {
            partidaSeleccionadaId = partida.id;
            renderizarPartidas();
            mostrarDetallesPartida(partida);
        });

        contenedorLista.appendChild(slot);
    });
}

function mostrarDetallesPartida(partida) {
    btnJugar.disabled = false;
    btnEliminar.disabled = false;

    panelInfo.innerHTML = `
        <h3 style="color: #f7ca40; font-size: 26px; margin-top: 0; text-shadow: 2px 2px 0px #000;">${partida.nombre}</h3>
        <p style="color: #fdfae7; font-size: 18px; text-shadow: 2px 2px 0px #000;">Última vez jugado:</p>
        <p style="color: #f7ca40; font-size: 16px; text-shadow: 2px 2px 0px #000;">${partida.fecha}</p>
    `;
}

// Abrir Modal para Nueva Partida
btnNueva.addEventListener('click', () => {
    inputNombre.value = `Agente_${partidas.length + 1}`;
    modalNueva.style.display = 'flex';
    inputNombre.focus();
});

btnModalCancelar.addEventListener('click', () => {
    modalNueva.style.display = 'none';
});

// Crear partida desde el Modal
btnModalCrear.addEventListener('click', () => {
    const nombre = inputNombre.value.trim() || `Partida_${partidas.length + 1}`;
    
    const nuevaPartida = {
        id: Date.now(),
        nombre: nombre,
        fecha: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };

    partidas.push(nuevaPartida);
    guardarEnMemoria();
    modalNueva.style.display = 'none';

    // Seleccionar automáticamente la nueva partida creada
    partidaSeleccionadaId = nuevaPartida.id;
    renderizarPartidas();
    mostrarDetallesPartida(nuevaPartida);
});

// Eliminar Partida
btnEliminar.addEventListener('click', () => {
    if (!partidaSeleccionadaId) return;

    partidas = partidas.filter(p => p.id !== partidaSeleccionadaId);
    guardarEnMemoria();
    partidaSeleccionadaId = null;
    renderizarPartidas();
});

// Jugar Partida Seleccionada
btnJugar.addEventListener('click', () => {
    if (!partidaSeleccionadaId) return;
    
    const partidaActiva = partidas.find(p => p.id === partidaSeleccionadaId);
    sessionStorage.setItem('partida_activa', JSON.stringify(partidaActiva));

    // Redirigir a la cinemática de inicio
    window.location.href = "cinematica_inicial.html";
});

// Botón Volver al menú principal
const botonVolver = document.getElementById('boton-volver-menu');
if (botonVolver) {
    botonVolver.addEventListener('click', () => {
        window.location.href = "index.html";
    });
}

// Inicializar la lista al cargar
renderizarPartidas();
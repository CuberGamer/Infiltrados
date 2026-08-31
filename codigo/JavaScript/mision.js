// ESCALADO DEL LIENZO
function ajustarEscalaLienzo() {
    const ANCHO_BASE = 1920;
    const ALTO_BASE = 1080;
    const contenedor = document.getElementById('contenedor-juego');
    if (!contenedor) return;
    const escalaAncho = window.innerWidth / ANCHO_BASE;
    const escalaAlto = window.innerHeight / ALTO_BASE;
    const escalaFinal = Math.min(escalaAncho, escalaAlto);
    contenedor.style.transform = `translate(-50%, -50%) scale(${escalaFinal})`;
}

// Aseguramos posicionamiento absoluto centrado para que funcione el translate del scale
const contenedorJuego = document.getElementById('contenedor-juego');
if (contenedorJuego) {
    contenedorJuego.style.position = 'absolute';
    contenedorJuego.style.left = '50%';
    contenedorJuego.style.top = '50%';
}

window.addEventListener('resize', ajustarEscalaLienzo);
window.addEventListener('load', ajustarEscalaLienzo);

// SISTEMA DE NODOS / ZONAS DEL MAPA
const zonas = {
    centro: {
        fondo: "url('/Recursos_graficos/Fondos/Fondo_Juego1.png')",
        flechasVisibles: ['abajo', 'izquierda', 'derecha']
    },
    izquierda: {
        fondo: "url('../../Recursos_graficos/Fondos/Fondo_Izquierdo.png')",
        flechasVisibles: ['derecha'] 
    },
    derecha: {
        fondo: "url('../../Recursos_graficos/Fondos/Fondo_Derecho.png')",
        flechasVisibles: ['izquierda'] 
    }
};

const escenaMundo = document.getElementById('escena-mundo');
const btnAbajo = document.getElementById('btn-abajo');
const btnIzquierda = document.getElementById('btn-izquierda');
const btnDerecha = document.getElementById('btn-derecha');
const flechaNpc = document.getElementById('btn-flecha-npc');
let zonaActual = 'centro';

function cambiarZona(nombreZona) {
    zonaActual = nombreZona;
    const zona = zonas[nombreZona];
    if (!zona) return;
    
    escenaMundo.style.backgroundImage = zona.fondo;
    
    // Mostrar/ocultar botones según la zona
    btnAbajo.style.display = zona.flechasVisibles.includes('abajo') ? 'block' : 'none';
    btnIzquierda.style.display = zona.flechasVisibles.includes('izquierda') ? 'block' : 'none';
    btnDerecha.style.display = zona.flechasVisibles.includes('derecha') ? 'block' : 'none';
    
    // REUBICACIÓN DINÁMICA DE FLECHAS (Usando los nombres correctos: btnIzquierda y btnDerecha)
    if (nombreZona === 'centro') {
        btnIzquierda.style.left = '810px';
        btnIzquierda.style.top = '450px';
        btnDerecha.style.left = '994px';
        btnDerecha.style.top = '450px';
    } else if (nombreZona === 'izquierda') {
        // Al estar a la izquierda, movemos la flecha derecha para volver al centro
        btnDerecha.style.left = '850px';
        btnDerecha.style.top = '500px';
    } else if (nombreZona === 'derecha') {
        // Al estar a la derecha, movemos la flecha izquierda para volver al centro
        btnIzquierda.style.left = '850px';
        btnIzquierda.style.top = '500px';
    }

    // Control de la flecha del NPC
    if (zonaActual !== 'centro' && flechaNpc && flechaNpc.style.display === 'block') {
        flechaNpc.style.display = 'none';
    }
}

// Lógica de navegación en las flechas
btnIzquierda.addEventListener('click', () => {
    if (zonaActual === 'centro') cambiarZona('izquierda');
    else if (zonaActual === 'derecha') cambiarZona('centro');
});

btnDerecha.addEventListener('click', () => {
    if (zonaActual === 'centro') cambiarZona('derecha');
    else if (zonaActual === 'izquierda') cambiarZona('centro');
});

btnAbajo.addEventListener('click', () => {
    cambiarZona('centro');
});

// CONTROL DEL MODAL DE MISIONES
const hudMisiones = document.querySelector('.hud-misiones');
const modalMision = document.getElementById('modal-mision');
const btnCerrarMision = document.getElementById('btn-cerrar-mision');
const btnIniciarMision = document.getElementById('btn-iniciar-mision');

if (hudMisiones && modalMision) {
    hudMisiones.addEventListener('click', () => {
        modalMision.style.display = 'flex';
    });
}

if (btnCerrarMision && modalMision) {
    btnCerrarMision.addEventListener('click', () => {
        modalMision.style.display = 'none';
    });
}

if (btnIniciarMision && modalMision) {
    btnIniciarMision.addEventListener('click', () => {
        modalMision.style.display = 'none';
        cambiarZona('centro'); 
        if (flechaNpc) flechaNpc.style.display = 'block'; 
    });
}

// Ir a la encuesta al hacer clic en el NPC
if (flechaNpc) {
    flechaNpc.addEventListener('click', () => {
        window.location.href = "pregunta.html";
    });
}

// CONTROL DEL MODAL DE MAPA
const hudMapa = document.getElementById('btn-abrir-mapa');
const modalMapa = document.getElementById('modal-mapa');
const btnCerrarMapa = document.getElementById('btn-cerrar-mapa');

if (hudMapa && modalMapa) {
    hudMapa.addEventListener('click', () => {
        modalMapa.style.display = 'flex';
    });
}

if (btnCerrarMapa && modalMapa) {
    btnCerrarMapa.addEventListener('click', () => {
        modalMapa.style.display = 'none';
    });
}

// Iniciar el juego en la zona central por defecto
cambiarZona('centro');
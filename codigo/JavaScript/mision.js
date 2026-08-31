// ================================
// ESCALADO DEL LIENZO
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
// SISTEMA DE NODOS / ZONAS DEL MAPA
// ================================

// Definimos los lugares a los que se puede mover el jugador
const zonas = {
    centro: {
        fondo: "url('/Recursos_graficos/Fondos/Fondo_Juego1.png')", // Tu imagen de la plaza central
        flechasVisibles: ['arriba', 'abajo', 'izq', 'der'] // Qué flechas se muestran aquí
    },
    izquierda: {
        fondo: "url('/Recursos_graficos/Fondos/Fondo_callejon.png')", // Imagen del sector izquierdo (cámbiala por tu ruta real)
        flechasVisibles: ['abajo'] // En este callejón solo hay flecha para volver
    },
    preguntaNPC: {
        // Si vas hacia arriba y te cruzas con el contacto, te manda a tu archivo de pregunta
        accion: () => {
            window.location.href = "pregunta.html";
        }
    }
};

// Elementos del DOM
const escenaMundo = document.getElementById('escena-mundo');
const btnArriba = document.getElementById('btn-arriba');
const btnAbajo = document.getElementById('btn-abajo');
const btnIzq = document.getElementById('btn-izq');
const btnDer = document.getElementById('btn-der');

// Función para cambiar de zona dinámicamente
function cambiarZona(nombreZona) {
    const zona = zonas[nombreZona];

    if (!zona) return;

    // Si la zona tiene una acción especial (como abrir pregunta.html)
    if (zona.accion) {
        zona.accion();
        return;
    }

    // Cambiar la imagen de fondo del mapa
    escenaMundo.style.backgroundImage = zona.fondo;

    // Mostrar u ocultar las flechas según corresponda en esta zona
    btnArriba.style.display = zona.flechasVisibles.includes('arriba') ? 'flex' : 'none';
    btnAbajo.style.display = zona.flechasVisibles.includes('abajo') ? 'flex' : 'none';
    btnIzq.style.display = zona.flechasVisibles.includes('izq') ? 'flex' : 'none';
    btnDer.style.display = zona.flechasVisibles.includes('der') ? 'flex' : 'none';
}

// ================================
// CONFIGURACIÓN DE CLICS EN LAS FLECHAS
// ================================

// Flecha Arriba (Desde el centro te lleva a hablar con el NPC / Pregunta)
btnArriba.addEventListener('click', () => {
    cambiarZona('preguntaNPC'); 
});

// Flecha Izquierda (Te lleva al callejón sin salida de la segunda imagen)
btnIzq.addEventListener('click', () => {
    cambiarZona('izquierda');
});

// Flecha Abajo (Sirve para volver al centro desde cualquier lado)
btnAbajo.addEventListener('click', () => {
    cambiarZona('centro');
});

// Flecha Derecha (Por si quieres llevarlo a otra zona, ej: puerto o sur)
btnDer.addEventListener('click', () => {
    // Puedes crear más zonas aquí si lo deseas
    alert("¡Zona en exploración!");
});

// Iniciar el juego en la zona central por defecto
cambiarZona('centro');


// ================================
// CONTROL DEL MODAL DE MISIONES
// ================================
const hudMisiones = document.querySelector('.hud-misiones');
const modalMision = document.getElementById('modal-mision');
const btnCerrarMision = document.getElementById('btn-cerrar-mision');
const btnIniciarMision = document.getElementById('btn-iniciar-mision');

// 1. Al hacer clic en el pergamino pequeño del HUD, se abre el modal grande
hudMisiones.addEventListener('click', () => {
    modalMision.style.display = 'flex';
});

// 2. Al hacer clic en la 'X', se cierra el modal grande
btnCerrarMision.addEventListener('click', () => {
    modalMision.style.display = 'none';
});

// 3. Al hacer clic en 'INICIAR', te lleva a la pantalla de la misión/pregunta
btnIniciarMision.addEventListener('click', () => {
    window.location.href = "pregunta.html"; // Cambia por tu archivo de destino real
});

// ================================
// CONTROL DEL MODAL DE MAPA
// ================================
const hudMapa = document.getElementById('btn-abrir-mapa');
const modalMapa = document.getElementById('modal-mapa');
const btnCerrarMapa = document.getElementById('btn-cerrar-mapa');

if (hudMapa && modalMapa && btnCerrarMapa) {
    // 1. Al hacer clic en el minimapa, se abre el mapa grande
    hudMapa.addEventListener('click', () => {
        modalMapa.style.display = 'flex';
    });

    // 2. Al hacer clic en la 'X', se cierra el mapa grande
    btnCerrarMapa.addEventListener('click', () => {
        modalMapa.style.display = 'none';
    });
}
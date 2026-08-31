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
// SISTEMA DE DIÁLOGOS DE LA CINEMÁTICA
// ================================
const lineasDialogo = [
    "Escúchame bien, paisano. La patria no espera, y la causa necesita de hombres que no teman al barro ni al plomo. Te encomiendo esta tarea porque confío en tu valor.",
    "Lleva este mensaje, asegura el territorio y no vuelvas sin haber cumplido."
    // Puedes agregar más líneas de texto aquí si quieres extender la conversación
];

let indiceActual = 0;
const textoElemento = document.getElementById('texto-dialogo');
const cajaDialogo = document.getElementById('caja-dialogo');
const btnSkip = document.getElementById('btn-skip');

function mostrarSiguienteDialogo() {
    if (indiceActual < lineasDialogo.length) {
        textoElemento.textContent = lineasDialogo[indiceActual];
        indiceActual++;
    } else {
        finalizarCinematica();
    }
}

function finalizarCinematica() {
    // AQUÍ CAMBIAS A LA RUTA DE TU SIGUIENTE PANTALLA DE JUEGO PRINCIPAL:
    // window.location.href = "juego.html";
    // Debe apuntar exactamente al nombre de tu archivo de misión real
    window.location.href = "mision.html"; 
}

// Avanzar diálogo al hacer clic en la caja
cajaDialogo.addEventListener('click', mostrarSiguienteDialogo);

// Botón Skip para ir directo al juego
btnSkip.addEventListener('click', (e) => {
    e.stopPropagation(); // Evita que se active el evento de la caja
    finalizarCinematica();
});

// Inicializar el primer diálogo
mostrarSiguienteDialogo();
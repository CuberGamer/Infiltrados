// ================================
// ESCALADO DEL TABLERO DE CONFIGURACIÓN
// ================================
function ajustarEscalaLienzo() {
    const ANCHO_BASE = 1920;
    const ALTO_BASE = 1080;
    const contenedor = document.getElementById('contenedor-juego');

    if (!contenedor) return;

    const escalaAncho = window.innerWidth / ANCHO_BASE;
    const escalaAlto = window.innerHeight / ALTO_BASE;
    
    // CAMBIO CLAVE: Usamos Math.min para que encaje completo dentro de la pantalla sin salirse
    const escalaFinal = Math.min(escalaAncho, escalaAlto);

    contenedor.style.transform = `scale(${escalaFinal})`;
}

window.addEventListener('resize', ajustarEscalaLienzo);
window.addEventListener('load', ajustarEscalaLienzo);

// Volver al menú principal
const botonVolver = document.getElementById('boton-volver-menu');
if (botonVolver) {
    botonVolver.addEventListener('click', () => {
        window.location.href = "../codigo/index.html";
    });
}
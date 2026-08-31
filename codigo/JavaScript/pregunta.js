// ESCALADO DEL LIENZO (Requerido en todas las pantallas)
function ajustarEscalaLienzo() {
    const contenedor = document.getElementById('contenedor-juego');
    if (!contenedor) return;
    const escala = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    contenedor.style.position = 'absolute';
    contenedor.style.left = '50%';
    contenedor.style.top = '50%';
    contenedor.style.transform = `translate(-50%, -50%) scale(${escala})`;
}
window.addEventListener('resize', ajustarEscalaLienzo);
window.addEventListener('load', ajustarEscalaLienzo);

// Función que evalúa la respuesta
function responder(esCorrecto) {
    if (esCorrecto) {
        window.location.href = "victoria.html"; // Rojo punzó[cite: 4]
    } else {
        window.location.href = "gameover.html"; // Azul[cite: 4]
    }
}
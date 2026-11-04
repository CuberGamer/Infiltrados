// Escalado del tablero de configuración.
function ajustarEscalaLienzo() {
    const contenedor = document.getElementById('contenedor-juego');
    if (!contenedor) return;
    const escalaFinal = Math.min(window.innerWidth / 1500, window.innerHeight / 900, 1);
    contenedor.style.transform = `scale(${escalaFinal})`;
}
window.addEventListener('resize', ajustarEscalaLienzo);
window.addEventListener('load', ajustarEscalaLienzo);

const botonVolver = document.getElementById('boton-volver-menu');
if (botonVolver) botonVolver.addEventListener('click', () => {
    window.location.href = 'index.html';
});

const sliderVolumen = document.getElementById('slider-volumen');
const textoVolumen = document.getElementById('valor-volumen');
const CLAVE_VOLUMEN = 'infiltrados_volumen_maestro';
function aplicarVolumenConfiguracion(valor) {
    const nivel = Math.max(0, Math.min(100, Number(valor) || 0));
    if (sliderVolumen) sliderVolumen.value = String(nivel);
    if (textoVolumen) textoVolumen.textContent = `${nivel}%`;
    try { localStorage.setItem(CLAVE_VOLUMEN, String(nivel)); } catch (_) {}
    // audio.js expone este método en todas las pantallas.
    window.InfiltradosAudio?.setMasterVolume(nivel);
}
if (sliderVolumen) {
    let inicial = 70;
    try {
        const guardado = localStorage.getItem(CLAVE_VOLUMEN);
        if (guardado !== null && Number.isFinite(Number(guardado))) inicial = Number(guardado);
    } catch (_) {}
    sliderVolumen.value = String(inicial);
    if (textoVolumen) textoVolumen.textContent = `${inicial}%`;
    sliderVolumen.addEventListener('input', evento => aplicarVolumenConfiguracion(evento.target.value));
    sliderVolumen.addEventListener('change', evento => aplicarVolumenConfiguracion(evento.target.value));
    // Si audio.js ya se ejecutó, aplicar inmediatamente el valor visible.
    window.addEventListener('load', () => window.InfiltradosAudio?.setMasterVolume(inicial), { once: true });
}

/*const ANCHO_BASE = 1920;
const ALTO_BASE = 1080;

function ajustarEscalaLienzo() {
  const contenedor = document.getElementById('contenedor-juego');
  if (!contenedor) return;

  const escalaAncho = window.innerWidth / ANCHO_BASE;
  const escalaAlto = window.innerHeight / ALTO_BASE;
  const escalaFinal = Math.min(escalaAncho, escalaAlto);

  contenedor.style.position = 'absolute';
  contenedor.style.left = '50%';
  contenedor.style.top = '50%';
  contenedor.style.transform = `translate(-50%, -50%) scale(${escalaFinal})`;
}

window.addEventListener("resize", ajustarEscalaLienzo);
window.addEventListener("load", ajustarEscalaLienzo); */
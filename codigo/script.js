const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let bandoJugador = "";
let estadoJuego = "INICIO";
let mapaAbierto = false;
let juegoTerminado = false; // Controla si perdiste
let policias = []; // Almacena a los enemigos

// Estado del flujo de misiones
let pasoMision = 1;

const keys = {};
const jugador = { x: 190, y: 110, ancho: 12, alto: 18, velocidad: 1.2 };

const npcOficial = { x: 162, y: 40, ancho: 12, alto: 18, cerca: false };
const npcInformante = { x: 50, y: 185, ancho: 12, alto: 18, cerca: false, tipo: "chaleco" };
const npcsAmbiente = [
  { x: 270, y: 75, ancho: 12, alto: 18, tipo: "chaleco" },
  { x: 265, y: 185, ancho: 12, alto: 18, tipo: "abrigo" }
];

const obstaculosEstructura = [
  { x: 120, y: 0, ancho: 160, alto: 38 },
  { x: 248, y: 65, ancho: 7, alto: 25 }
];

const secuenciaDialogosOficial = [
  "¡ALTO! ¿QUIÉN ANDA AHÍ EN LA PLAZA MAYOR?",
  "SI DICES SER DE LOS NUESTROS, DEMUÉSTRALO.",
  "PREGUNTA: ¿CON QUÉ COLOR SE IDENTIFICA AL PARTIDO FEDERAL?"
];
let indiceDialogo = 0;

window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;

  if (e.key.toLowerCase() === "m") toggleMapa(!mapaAbierto);

  if (e.key.toLowerCase() === "e" && !mapaAbierto) {
    if (estadoJuego === "EXPLORACION") {
      if (npcOficial.cerca && pasoMision <= 2) {
        iniciarConversacionOficial();
      } else if (npcInformante.cerca && pasoMision === 3) {
        entregarCartaInformante();
      }
    } else if (estadoJuego === "DIALOGO") {
      avanzarDialogo();
    }
  }
});

window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

function iniciarJuego(bando) {
  bandoJugador = bando;
  document.getElementById("bando-modal").style.display = "none";
  estadoJuego = "EXPLORACION";
  actualizarTablaMisiones();
  bucle(); // Iniciamos el juego
}

function toggleMapa(forzar) {
  mapaAbierto = (forzar !== undefined) ? forzar : !mapaAbierto;
  document.getElementById("map-modal").style.display = mapaAbierto ? "flex" : "none";
  
  if (mapaAbierto) {
    const pin = document.getElementById("map-player-pin");
    let relX = (jugador.x / canvas.width) * 260 + 30;
    let relY = (jugador.y / canvas.height) * 260 + 30;
    pin.style.left = relX + "px";
    pin.style.top = relY + "px";
  }
}

function actualizarTablaMisiones() {
  const titulo = document.getElementById("mision-titulo");
  const guia = document.getElementById("mision-guia");
  const statusFill = document.getElementById("status-fill");

  if (pasoMision === 1) {
    titulo.innerText = "1. HABLAR CON EL OFICIAL";
    guia.innerText = "📍 Dirígete a: Plaza Mayor (Norte) e interactúa [E]";
    statusFill.style.width = "25%";
  } else if (pasoMision === 2) {
    titulo.innerText = "2. DEMOSTRAR LEALTAD";
    guia.innerText = "📍 Responde la trivia del Oficial";
    statusFill.style.width = "50%";
  } else if (pasoMision === 3) {
    titulo.innerText = "3. LLEVAR CARTA AL CONVENTO";
    guia.innerText = "📍 Dirígete a: Convento (Suroeste) y habla con el Informante";
    statusFill.style.width = "75%";
    document.getElementById("slot-letter").style.display = "block";
  } else if (pasoMision === 4) {
    titulo.innerText = "✔ MISIÓN COMPLETADA";
    guia.innerText = "📍 Has entregado el mensaje secreto con éxito.";
    statusFill.style.width = "100%";
  }
}

function hayColision(nx, ny) {
  const boxJugador = { x: nx, y: ny, ancho: jugador.ancho, alto: jugador.alto };
  const solidos = [npcOficial, npcInformante, ...npcsAmbiente, ...obstaculosEstructura];

  for (let obs of solidos) {
    if (
      boxJugador.x < obs.x + obs.ancho &&
      boxJugador.x + boxJugador.ancho > obs.x &&
      boxJugador.y < obs.y + obs.alto &&
      boxJugador.y + boxJugador.alto > obs.y
    ) {
      return true;
    }
  }
  return false;
}

/* --- SISTEMA DE DIÁLOGOS --- */
function iniciarConversacionOficial() {
  estadoJuego = "DIALOGO";
  indiceDialogo = 0;
  pasoMision = 2;
  actualizarTablaMisiones();
  mostrarPasoDialogo();
  document.getElementById("dialogue-box").style.display = "flex";
}

function avanzarDialogo() {
  if (indiceDialogo < secuenciaDialogosOficial.length - 1) {
    indiceDialogo++;
    mostrarPasoDialogo();
  }
}

function mostrarPasoDialogo() {
  const textoUI = document.getElementById("dialogue-text");
  const opcionesUI = document.getElementById("dialogue-options");

  textoUI.innerText = secuenciaDialogosOficial[indiceDialogo];
  opcionesUI.innerHTML = "";

  if (indiceDialogo === secuenciaDialogosOficial.length - 1) {
    opcionesUI.innerHTML = `
      <button class="btn-pill" onclick="responderTrivia(0)">EL ROJO PUNZÓ</button>
      <button class="btn-pill" onclick="responderTrivia(1)">EL AZUL CELESTE</button>
    `;
  } else {
    opcionesUI.innerHTML = `<button class="btn-pill" onclick="avanzarDialogo()">CONTINUAR (E)</button>`;
  }
}

function responderTrivia(opcion) {
  const textoUI = document.getElementById("dialogue-text");
  const opcionesUI = document.getElementById("dialogue-options");

  if (opcion === 0) {
    pasoMision = 3;
    actualizarTablaMisiones();
    textoUI.innerText = "¡CORRECTO! TOMA ESTA CARTA Y LLÉVALA DE INMEDIATO AL INFORMANTE EN EL CONVENTO.";
    setTimeout(() => {
      document.getElementById("dialogue-box").style.display = "none";
      estadoJuego = "EXPLORACION";
    }, 3000);
  } else {
    textoUI.innerText = "¡INCORRECTO! UN INFILTRADO... ¡GUARDIAS!";
    invocarPolicias(); // ¡LA TRAMPA SE ACTIVA AQUÍ!
    
    // Le damos al jugador 2 segundos de ventaja antes de devolverle el control para correr
    setTimeout(() => {
      document.getElementById("dialogue-box").style.display = "none";
      estadoJuego = "EXPLORACION"; 
    }, 2000);
  }
  opcionesUI.innerHTML = "";
}

function entregarCartaInformante() {
  estadoJuego = "DIALOGO";
  const box = document.getElementById("dialogue-box");
  const textoUI = document.getElementById("dialogue-text");

  box.style.display = "flex";
  textoUI.innerText = "¡EXCELENTE TRABAJO! RECIBÍ LA CARTA SECRETA. MISIÓN CUMPLIDA.";
  document.getElementById("dialogue-options").innerHTML = "";

  pasoMision = 4;
  actualizarTablaMisiones();

  setTimeout(() => {
    box.style.display = "none";
    estadoJuego = "EXPLORACION";
  }, 3500);
}

/* --- TRAMPA Y POLICIAS --- */
function invocarPolicias() {
  for(let i = 0; i < 4; i++) {
    let desdeHorizontal = Math.random() < 0.5;
    policias.push({
      x: desdeHorizontal ? (Math.random() < 0.5 ? -20 : canvas.width + 20) : Math.random() * canvas.width,
      y: !desdeHorizontal ? (Math.random() < 0.5 ? -20 : canvas.height + 20) : Math.random() * canvas.height,
      velocidad: 1.05 // Apenas más lentos que el jugador (1.2) para dar chance a huir
    });
  }
}

function actualizar() {
  if (estadoJuego === "EXPLORACION" && !mapaAbierto && !juegoTerminado) {
    let nuevoX = jugador.x;
    let nuevoY = jugador.y;

    if (keys["w"] || keys["arrowup"]) nuevoY -= jugador.velocidad;
    if (keys["s"] || keys["arrowdown"]) nuevoY += jugador.velocidad;
    if (keys["a"] || keys["arrowleft"]) nuevoX -= jugador.velocidad;
    if (keys["d"] || keys["arrowright"]) nuevoX += jugador.velocidad;

    if (!hayColision(nuevoX, jugador.y)) jugador.x = Math.max(10, Math.min(canvas.width - 20, nuevoX));
    if (!hayColision(jugador.x, nuevoY)) jugador.y = Math.max(10, Math.min(canvas.height - 25, nuevoY));

    npcOficial.cerca = Math.hypot(jugador.x - npcOficial.x, jugador.y - npcOficial.y) < 24;
    npcInformante.cerca = Math.hypot(jugador.x - npcInformante.x, jugador.y - npcInformante.y) < 24;

    // Lógica de persecución
    policias.forEach(policia => {
      if (policia.x < jugador.x) policia.x += policia.velocidad;
      if (policia.x > jugador.x) policia.x -= policia.velocidad;
      if (policia.y < jugador.y) policia.y += policia.velocidad;
      if (policia.y > jugador.y) policia.y -= policia.velocidad;

      // Colisión con los policías
      let distancia = Math.hypot(jugador.x - policia.x, jugador.y - policia.y);
      if (distancia < 12) {
        juegoTerminado = true;
        document.getElementById("game-over-screen").style.display = "flex";
      }
    });
  }
}

/* --- INVENTARIO --- */
function inspeccionarItem(event, titulo, desc) {
  event.stopPropagation();
  const modal = document.getElementById("item-inspect-modal");
  document.getElementById("inspect-title").innerText = titulo;
  document.getElementById("inspect-desc").innerText = desc;
  modal.style.display = "block";
  setTimeout(() => { modal.style.display = "none"; }, 3000);
}
function toggleInventarioInfo() {
  inspeccionarItem({ stopPropagation: ()=>{} }, "Inventario", "Haz clic en cada objeto para ver sus detalles.");
}

/* --- RENDERIZADO PIXEL ART --- */
function dibujarJugador(x, y) {
  ctx.fillStyle = "#221915"; ctx.fillRect(x + 2, y + 0, 8, 3);
  ctx.fillStyle = "#3a2a22"; ctx.fillRect(x + 1, y + 3, 10, 1);
  ctx.fillStyle = "#110b08"; ctx.fillRect(x + 3, y + 4, 6, 2);
  ctx.fillStyle = "#6e4726"; ctx.fillRect(x + 2, y + 6, 8, 7);
  ctx.fillStyle = "#8b5a2b"; ctx.fillRect(x + 3, y + 6, 6, 7);
  ctx.fillStyle = "#523319"; ctx.fillRect(x + 1, y + 7, 2, 5);
  ctx.fillStyle = "#523319"; ctx.fillRect(x + 9, y + 7, 2, 5);
  ctx.fillStyle = "#331f0f"; ctx.fillRect(x + 2, y + 11, 8, 1);
  ctx.fillStyle = "#1a1a1a"; ctx.fillRect(x + 3, y + 13, 2, 3);
  ctx.fillStyle = "#1a1a1a"; ctx.fillRect(x + 7, y + 13, 2, 3);
  ctx.fillStyle = "#000000"; ctx.fillRect(x + 2, y + 16, 3, 2);
  ctx.fillStyle = "#000000"; ctx.fillRect(x + 7, y + 16, 3, 2);
}

function dibujarNPCOficial(x, y) {
  ctx.fillStyle = "#111111"; ctx.fillRect(x + 2, y + 0, 8, 3);
  ctx.fillStyle = "#2a2a2a"; ctx.fillRect(x + 0, y + 3, 12, 1);
  ctx.fillStyle = "#ffdbac"; ctx.fillRect(x + 3, y + 4, 6, 3);
  ctx.fillStyle = "#000000"; ctx.fillRect(x + 4, y + 5, 1, 1);
  ctx.fillStyle = "#000000"; ctx.fillRect(x + 7, y + 5, 1, 1);
  ctx.fillStyle = "#1a1a1a"; ctx.fillRect(x + 2, y + 7, 8, 6);
  ctx.fillStyle = "#ffffff"; ctx.fillRect(x + 5, y + 7, 2, 3);
  ctx.fillStyle = "#111111"; ctx.fillRect(x + 1, y + 7, 2, 5);
  ctx.fillStyle = "#111111"; ctx.fillRect(x + 9, y + 7, 2, 5);
  ctx.fillStyle = "#111111"; ctx.fillRect(x + 3, y + 13, 2, 3);
  ctx.fillStyle = "#111111"; ctx.fillRect(x + 7, y + 13, 2, 3);
}

function dibujarNPCPoblador(x, y, tipo) {
  if (tipo === "chaleco") {
    ctx.fillStyle = "#4a3328"; ctx.fillRect(x + 2, y + 0, 8, 2);
    ctx.fillStyle = "#2d1e18"; ctx.fillRect(x + 1, y + 2, 10, 1);
    ctx.fillStyle = "#e0ac69"; ctx.fillRect(x + 3, y + 3, 6, 3);
    ctx.fillStyle = "#ffffff"; ctx.fillRect(x + 2, y + 6, 8, 6);
    ctx.fillStyle = "#5c3d2e"; ctx.fillRect(x + 2, y + 6, 2, 6);
    ctx.fillStyle = "#5c3d2e"; ctx.fillRect(x + 8, y + 6, 2, 6);
    ctx.fillStyle = "#333333"; ctx.fillRect(x + 3, y + 12, 2, 4);
    ctx.fillStyle = "#333333"; ctx.fillRect(x + 7, y + 12, 2, 4);
  } else {
    ctx.fillStyle = "#222222"; ctx.fillRect(x + 2, y + 0, 8, 3);
    ctx.fillStyle = "#ffdbac"; ctx.fillRect(x + 3, y + 3, 6, 3);
    ctx.fillStyle = "#3d4a3e"; ctx.fillRect(x + 2, y + 6, 8, 6);
    ctx.fillStyle = "#1a1a1a"; ctx.fillRect(x + 3, y + 12, 2, 4);
    ctx.fillStyle = "#1a1a1a"; ctx.fillRect(x + 7, y + 12, 2, 4);
  }
}

function dibujarGuardia(x, y) {
  ctx.fillStyle = "#111111"; ctx.fillRect(x + 2, y + 0, 8, 3); // sombrero
  ctx.fillStyle = "#1d4ed8"; ctx.fillRect(x + 2, y + 6, 8, 7); // saco azul
  ctx.fillStyle = "#ffffff"; ctx.fillRect(x + 4, y + 6, 4, 3); // detalle pecho
  ctx.fillStyle = "#000000"; ctx.fillRect(x + 3, y + 13, 2, 3); // piernas
  ctx.fillStyle = "#000000"; ctx.fillRect(x + 7, y + 13, 2, 3);
}

function dibujarGlobo(x, y) {
  ctx.fillStyle = "#ffffff"; ctx.fillRect(x - 2, y - 18, 16, 12);
  ctx.strokeStyle = "#000000"; ctx.strokeRect(x - 2, y - 18, 16, 12);
  ctx.fillStyle = "#000000"; ctx.font = "8px monospace";
  ctx.fillText("...", x + 2, y - 9);
}

function dibujar() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#3d522b"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#8c7b60"; ctx.fillRect(140, 20, 120, 205); ctx.fillRect(20, 90, 360, 45);

  ctx.fillStyle = "#7a6a52";
  for(let i=140; i<260; i+=10) {
    for(let j=20; j<225; j+=10) {
      if((i+j)%20===0) ctx.fillRect(i, j, 4, 4);
    }
  }

  ctx.fillStyle = "#9c8e79"; ctx.fillRect(120, 0, 160, 38);
  ctx.fillStyle = "#4a3322"; ctx.fillRect(180, 15, 20, 23);
  ctx.fillStyle = "#111"; ctx.fillRect(248, 65, 3, 20);
  ctx.fillStyle = "#fde047"; ctx.fillRect(247, 62, 5, 5);

  npcsAmbiente.forEach(npc => dibujarNPCPoblador(npc.x, npc.y, npc.tipo));
  dibujarNPCPoblador(npcInformante.x, npcInformante.y, npcInformante.tipo);
  dibujarNPCOficial(npcOficial.x, npcOficial.y);

  if (npcOficial.cerca && pasoMision <= 2) dibujarGlobo(npcOficial.x, npcOficial.y);
  if (npcInformante.cerca && pasoMision === 3) dibujarGlobo(npcInformante.x, npcInformante.y);

  dibujarJugador(jugador.x, jugador.y);

  // Dibujamos a los enemigos si fueron invocados
  policias.forEach(policia => dibujarGuardia(policia.x, policia.y));
}

function bucle() {
  if (juegoTerminado) return; // Congela la pantalla si pierdes
  actualizar();
  dibujar();
  requestAnimationFrame(bucle);
}

 // ==========================================
 // ESCALADO DEL JUEGO
 // ==========================================

function ajustarEscalaLienzo() {

    const ANCHO_BASE = 1920;
    const ALTO_BASE = 1080;

    const contenedor = document.getElementById("contenedor-juego");

    if (!contenedor) return;

    const escalaAncho = window.innerWidth / ANCHO_BASE;
    const escalaAlto = window.innerHeight / ALTO_BASE;

    const escalaFinal = Math.min(escalaAncho, escalaAlto);

    contenedor.style.transform =
        `translate(-50%, -50%) scale(${escalaFinal})`;
}

const contenedorJuego =
    document.getElementById("contenedor-juego");

if (contenedorJuego) {

    contenedorJuego.style.position = "absolute";
    contenedorJuego.style.left = "50%";
    contenedorJuego.style.top = "50%";

}

window.addEventListener("resize", ajustarEscalaLienzo);
window.addEventListener("load", ajustarEscalaLienzo);


// ==========================================
// MAPA
// ==========================================

const canvas = document.getElementById("mapa-juego");
const ctx = canvas.getContext("2d");

const TILE_SIZE = 32;

let mapa = null;

// ==========================================
// SISTEMA DINÁMICO DE SOSPECHA
// ==========================================
const MAX_SOSPECHA = 100;
let nivelSospecha = 0;
let ultimoAumentoSospecha = 0;
let ultimoTickSospecha = 0;
let ultimaZonaDetectada = "";
const hudSospecha = document.querySelector(".hud-barra-sospecha");
const barraSospecha = document.getElementById("barra-sospecha");
const textoSospecha = document.getElementById("texto-sospecha");
const estadoSospecha = document.getElementById("estado-sospecha");

function cambiarSospecha(cantidad, motivo = "") {
    nivelSospecha = Math.max(0, Math.min(MAX_SOSPECHA, nivelSospecha + cantidad));
    if (cantidad > 0) ultimoAumentoSospecha = Date.now();
    if (barraSospecha) barraSospecha.style.width = `${nivelSospecha}%`;
    if (textoSospecha) textoSospecha.textContent = `${nivelSospecha}%`;
    const barra = barraSospecha?.parentElement;
    if (barra) barra.setAttribute("aria-valuenow", String(nivelSospecha));
    hudSospecha?.classList.toggle("nivel-alerta", nivelSospecha >= 50 && nivelSospecha < 80);
    hudSospecha?.classList.toggle("nivel-critico", nivelSospecha >= 80);
    if (estadoSospecha) {
        estadoSospecha.textContent = nivelSospecha >= 100 ? "¡ALERTA MÁXIMA! Te descubrieron" :
            nivelSospecha >= 80 ? "¡Peligro! Están por descubrirte" :
            nivelSospecha >= 50 ? "Los guardias están alerta" :
            nivelSospecha > 0 ? (motivo || "Mantené un perfil bajo") : "Pasá desapercibido";
    }
    if (nivelSospecha >= 100 && typeof mostrarGameOver === "function") mostrarGameOver();
}

let penalizacionFalloAplicada = false;
function penalizarFalloMinijuego(motivo = "Fallaste un minijuego", cantidad = 15) {
    if (penalizacionFalloAplicada) return;
    penalizacionFalloAplicada = true;
    cambiarSospecha(cantidad, motivo);
}

function dialogoConAdvertenciaDeSospecha(texto) {
    if (nivelSospecha >= 50) {
        return `${texto}\n\n— La verdad, últimamente hablás de una manera bastante sospechosa. Varios te vimos merodeando y ya no confiamos tanto en vos. Será mejor que nos expliques qué estás haciendo.`;
    }
    return texto;
}

// Lee zonas y guardias si se agregan como objetos en Tiled.
// Capas admitidas: "zonas_restringidas" y "guardias".
function obtenerObjetosMapa(nombreCapa) {
    const capa = mapa?.layers?.find(l => l.name?.toLowerCase() === nombreCapa && l.type === "objectgroup");
    return capa?.objects || [];
}

// Inventario real: los objetos se definen en una capa de objetos
// de Tiled llamada "objetos_recolectables". Propiedades opcionales:
// icono, descripcion e idObjeto.
const inventarioJugador = [];
const CAPACIDAD_INVENTARIO = 6;
const objetosRecolectados = new Set();
let ultimoChequeoObjetos = 0;
let indiceObjetoSeleccionado = -1;

function renderizarInventario() {
    document.querySelectorAll("#hud-inventario .slot-item").forEach((slot, indice) => {
        const objeto = inventarioJugador[indice];
        slot.textContent = objeto ? objeto.icono : "＋";
        slot.title = objeto ? `${objeto.nombre}: ${objeto.descripcion}` : "Espacio vacío";
        slot.setAttribute("aria-label", slot.title);
        slot.classList.toggle("activo", Boolean(objeto));
        slot.classList.toggle("seleccionado", indice === indiceObjetoSeleccionado);
    });
    const contador = document.getElementById("inventario-contador");
    if (contador) contador.textContent = `${inventarioJugador.length}/${CAPACIDAD_INVENTARIO}`;
    const detalle = document.getElementById("inventario-detalle");
    const objeto = inventarioJugador[indiceObjetoSeleccionado];
    if (detalle) detalle.innerHTML = objeto
        ? `<span class="detalle-icono">${objeto.icono}</span><span><strong>${objeto.nombre}</strong><small>${objeto.descripcion}</small></span>`
        : '<span class="detalle-icono">🎒</span><span>Seleccioná un objeto para ver sus detalles.</span>';
    const descartar = document.getElementById("btn-descartar-objeto");
    if (descartar) descartar.disabled = !objeto;
}

function agregarObjetoInventario(objeto) {
    if (!objeto || inventarioJugador.length >= CAPACIDAD_INVENTARIO) {
        if (inventarioJugador.length >= CAPACIDAD_INVENTARIO) mostrarAvisoInventario("Inventario lleno. Descartá algo para recoger este objeto.");
        return false;
    }
    inventarioJugador.push({
        nombre: objeto.nombre || "Objeto",
        icono: objeto.icono || "📦",
        descripcion: objeto.descripcion || "Un objeto encontrado durante la misión."
    });
    indiceObjetoSeleccionado = inventarioJugador.length - 1;
    renderizarInventario();
    mostrarAvisoInventario(`Objeto agregado: ${objeto.nombre || "Objeto"}`);
    return true;
}

function mostrarAvisoInventario(mensaje) {
    let aviso = document.getElementById("aviso-inventario");
    if (!aviso) {
        aviso = document.createElement("div");
        aviso.id = "aviso-inventario";
        aviso.className = "aviso-inventario";
        document.getElementById("contenedor-juego")?.appendChild(aviso);
    }
    aviso.textContent = mensaje;
    aviso.classList.add("visible");
    clearTimeout(aviso._temporizador);
    aviso._temporizador = setTimeout(() => aviso.classList.remove("visible"), 2300);
}

document.getElementById("hud-inventario")?.addEventListener("click", evento => {
    const slot = evento.target.closest(".slot-item");
    if (slot) {
        const indice = Number(slot.dataset.slot);
        indiceObjetoSeleccionado = inventarioJugador[indice] ? indice : -1;
        renderizarInventario();
    }
});

document.getElementById("btn-inventario-expandir")?.addEventListener("click", () => {
    document.getElementById("hud-inventario")?.classList.toggle("inventario-expandido");
});
document.getElementById("btn-descartar-objeto")?.addEventListener("click", () => {
    if (indiceObjetoSeleccionado < 0) return;
    const descartado = inventarioJugador.splice(indiceObjetoSeleccionado, 1)[0];
    indiceObjetoSeleccionado = inventarioJugador.length ? Math.min(indiceObjetoSeleccionado, inventarioJugador.length - 1) : -1;
    renderizarInventario();
    mostrarAvisoInventario(`${descartado.nombre} descartado.`);
});

function revisarObjetosRecolectables() {
    if (!mapa) return;
    const ahora = Date.now();
    if (ahora - ultimoChequeoObjetos < 350) return;
    ultimoChequeoObjetos = ahora;
    const capa = mapa.layers?.find(l => l.name?.toLowerCase() === "objetos_recolectables" && l.type === "objectgroup");
    if (!capa) return;
    const px = jugadorX + 16, py = jugadorY + 16;
    capa.objects?.forEach(obj => {
        const id = String(obj.properties?.find(p => p.name === "idObjeto")?.value ?? obj.id);
        if (objetosRecolectados.has(id)) return;
        const ox = obj.x + (obj.width || 0) / 2;
        const oy = obj.y + (obj.height || 0) / 2;
        if (Math.hypot(px - ox, py - oy) > 28) return;
        const prop = nombre => obj.properties?.find(p => p.name === nombre)?.value;
        const agregado = agregarObjetoInventario({
            nombre: obj.name || "Objeto", icono: prop("icono") || "📦",
            descripcion: prop("descripcion") || "Un objeto encontrado durante la misión."
        });
        if (agregado) {
            objetosRecolectados.add(id);
            obj.visible = false;
            if (typeof dibujarMapa === "function") dibujarMapa();
        }
    });
}

function revisarSospechaMundo() {
    if (!mapa || minijuegoAbierto || ventanaDialogoNPC?.style.display === "flex") return;
    const ahora = Date.now();
    if (ahora - ultimoTickSospecha < 1200) return;
    ultimoTickSospecha = ahora;
    const px = jugadorX + 16;
    const py = jugadorY + 16;
    const zona = obtenerObjetosMapa("zonas_restringidas").find(o =>
        px >= o.x && px <= o.x + o.width && py >= o.y && py <= o.y + o.height
    );
    const guardiaCerca = obtenerObjetosMapa("guardias").some(g => {
        const gx = g.x + (g.width || 32) / 2;
        const gy = g.y + (g.height || 32) / 2;
        return Math.hypot(px - gx, py - gy) <= (g.properties?.find(p => p.name === "radioVision")?.value || 150);
    });
    if (zona) {
        const id = `zona-${zona.id}`;
        if (ultimaZonaDetectada !== id) cambiarSospecha(12, "Entraste en una zona restringida");
        ultimaZonaDetectada = id;
    } else if (guardiaCerca) {
        cambiarSospecha(5, "Un guardia te vio");
        ultimaZonaDetectada = "guardia";
    } else {
        ultimaZonaDetectada = "";
        if (ahora - ultimoAumentoSospecha > 5000 && nivelSospecha > 0) cambiarSospecha(-2);
    }
}



/* ==========================================
   CÁMARA DE SEGUIMIENTO Y ZOOM
   ========================================== */

const ZOOM_INICIAL = 2;
const SUAVIDAD_CAMARA = 0.12;

let camaraX = 0;
let camaraY = 0;
let camaraInicializada = false;

function actualizarCamara() {

    if (!mapa) return;

    const anchoVista = canvas.parentElement.clientWidth;
    const altoVista = canvas.parentElement.clientHeight;

    const anchoMapa = mapa.width * TILE_SIZE;
    const altoMapa = mapa.height * TILE_SIZE;

    // Cuánto terreno cabe en la pantalla con el zoom actual.

    const anchoVisible = anchoVista / ZOOM_INICIAL;
    const altoVisible = altoVista / ZOOM_INICIAL;

    // Centrar la cámara sobre el jugador.

    let objetivoX = jugadorX + 16 - anchoVisible / 2;
    let objetivoY = jugadorY + 16 - altoVisible / 2;

    // Evitar mostrar espacio fuera del mapa.

    objetivoX = Math.max(
        0,
        Math.min(objetivoX, Math.max(0, anchoMapa - anchoVisible))
    );

    objetivoY = Math.max(
        0,
        Math.min(objetivoY, Math.max(0, altoMapa - altoVisible))
    );

    // Posicionar la cámara directamente al iniciar.

    if (!camaraInicializada) {

        camaraX = objetivoX;
        camaraY = objetivoY;
        camaraInicializada = true;

    } else {

        // Movimiento suave de la cámara.

        camaraX += (objetivoX - camaraX) * SUAVIDAD_CAMARA;
        camaraY += (objetivoY - camaraY) * SUAVIDAD_CAMARA;

    }

    // Aplicar zoom y desplazamiento al mapa.

    canvas.style.left = `${-camaraX * ZOOM_INICIAL}px`;
    canvas.style.top = `${-camaraY * ZOOM_INICIAL}px`;
    canvas.style.transformOrigin = "top left";
    canvas.style.transform = `scale(${ZOOM_INICIAL})`;

    // El personaje comparte el desplazamiento de la cámara.

    jugador.style.left =
        `${(jugadorX - 8 - camaraX) * ZOOM_INICIAL}px`;

    jugador.style.top =
        `${(jugadorY - 8 - camaraY) * ZOOM_INICIAL}px`;

    jugador.style.transformOrigin = "top left";
    jugador.style.transform = `scale(${ZOOM_INICIAL})`;
    jugador.style.zIndex = String(Math.round(jugadorY + 48));

    // Mantener los NPC alineados con la cámara.

    posicionarNPCsFederales();
    posicionarEntidadesPueblo();
    actualizarFlechaMision();
    actualizarPuntoMapaVivo();

}


// ==========================================
// TILESETS DEL MAPA MP3
// ==========================================

// ==========================================
// TILESETS DE MAPPRUEBA.JSON
// ==========================================

const tilesets = [
    {
        firstgid: 1,
        lastgid: 1,
        imagen: "../Recursos_graficos/Tilesets/pasto1.png",
        columnas: 2
    },
    {
        firstgid: 2,
        lastgid: 2,
        imagen: "../Recursos_graficos/Tilesets/piso1.png",
        columnas: 2
    },
    {
        firstgid: 3,
        lastgid: 11,
        imagen: "../Recursos_graficos/Tilesets/casa2.png",
        columnas: 3
    },
    {
        firstgid: 12,
        lastgid: 31,
        imagen: "../Recursos_graficos/Tilesets/casa1.png",
        columnas: 4
    },
    {
        firstgid: 32,
        lastgid: 35,
        imagen: "../Recursos_graficos/Tilesets/arbol2.png",
        columnas: 2
    },
    {
        firstgid: 36,
        lastgid: 39,
        imagen: "../Recursos_graficos/Tilesets/arbol1.png",
        columnas: 2
    },
    {
        firstgid: 40,
        lastgid: 40,
        imagen: "../Recursos_graficos/Tilesets/pasto2.png",
        columnas: 1
    },
    {
        firstgid: 41,
        lastgid: 56,
        imagen: "../Recursos_graficos/Tilesets/Casa6.png",
        columnas: 4
    },
    {
        firstgid: 57,
        lastgid: 88,
        imagen: "../Recursos_graficos/Tilesets/Casa5.png",
        columnas: 4
    },
    {
        firstgid: 89,
        lastgid: 137,
        imagen: "../Recursos_graficos/Tilesets/Casa4.png",
        columnas: 7
    },
    {
        firstgid: 138,
        lastgid: 186,
        imagen: "../Recursos_graficos/Tilesets/Granja1.png",
        columnas: 7
    },
    {
        firstgid: 187,
        lastgid: 187,
        imagen: "../Recursos_graficos/Tilesets/leña2.png",
        columnas: 1
    },
    {
        firstgid: 188,
        lastgid: 191,
        imagen: "../Recursos_graficos/Tilesets/leña1.png",
        columnas: 4
    },
    {
        firstgid: 192,
        lastgid: 195,
        imagen: "../Recursos_graficos/Tilesets/pozo1.png",
        columnas: 4
    },
    {
        firstgid: 196,
        lastgid: 196,
        imagen: "../Recursos_graficos/Tilesets/fogata1.png",
        columnas: 4
    },
    {
        firstgid: 197,
        lastgid: 200,
        imagen: "../Recursos_graficos/Tilesets/CarrozaVacia1.png",
        columnas: 2
    },
    {
        firstgid: 201,
        lastgid: 208,
        imagen: "../Recursos_graficos/Tilesets/cARROZA3.png",
        columnas: 4
    },
    {
        firstgid: 209,
        lastgid: 212,
        imagen: "../Recursos_graficos/Tilesets/CarrCarbon1.png",
        columnas: 2
    },
    {
        firstgid: 213,
        lastgid: 218,
        imagen: "../Recursos_graficos/Tilesets/cajas.png",
        columnas: 3
    }
];

const imagenesTilesets = {};


// ==========================================
// CARGAR IMÁGENES DE LOS TILESETS
// ==========================================

function cargarImagenes() {

    const promesas = [];

    tilesets.forEach((tileset) => {

        const imagen = new Image();

        imagenesTilesets[tileset.firstgid] = imagen;

        const promesa = new Promise((resolve, reject) => {

            imagen.onload = resolve;

            imagen.onerror = () => {

                reject(
                    new Error(
                        "No se pudo cargar la imagen: " +
                        tileset.imagen
                    )
                );

            };

            imagen.src = tileset.imagen;

        });

        promesas.push(promesa);

    });

    return Promise.all(promesas);

}


// ==========================================
// BUSCAR TILESET
// ==========================================

function obtenerTileset(gid) {

    for (let i = tilesets.length - 1; i >= 0; i--) {

        const tileset = tilesets[i];

        if (
            gid >= tileset.firstgid &&
            gid <= tileset.lastgid
        ) {
            return tileset;
        }

    }

    return null;
}


// ==========================================
// DIBUJAR TILE
// ==========================================

function dibujarTile(gid, x, y) {

    if (gid === 0) return;

    const tileset = obtenerTileset(gid);

    if (!tileset) return;

    const imagen =
        imagenesTilesets[tileset.firstgid];

    if (!imagen) return;

    const idLocal =
        gid - tileset.firstgid;

    const columna =
        idLocal % tileset.columnas;

    const fila =
        Math.floor(idLocal / tileset.columnas);

    const origenX =
        columna * TILE_SIZE;

    const origenY =
        fila * TILE_SIZE;

    ctx.drawImage(

        imagen,

        origenX,
        origenY,

        TILE_SIZE,
        TILE_SIZE,

        x,
        y,

        TILE_SIZE,
        TILE_SIZE

    );

}


// ==========================================
// DIBUJAR MAPA
// ==========================================

function dibujarMapa() {

    if (!mapa) return;

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    mapa.layers.forEach((capa) => {

        if (capa.type !== "tilelayer") return;

        for (let y = 0; y < capa.height; y++) {

            for (let x = 0; x < capa.width; x++) {

                const indice =
                    y * capa.width + x;

                const gid =
                    capa.data[indice];

                dibujarTile(
                    gid,
                    x * TILE_SIZE,
                    y * TILE_SIZE
                );

            }

        }

    });

}


renderizarInventario();

// ==========================================
// MAPA DINÁMICO: MISMO TERRENO QUE LA PARTIDA
// ==========================================
let fondoMinimapa = null;
function prepararMapaVivo() {
    if (!mapa) return;
    const mini = document.getElementById("mapa-vivo-mini");
    const grande = document.getElementById("mapa-vivo-grande");
    if (!mini || !grande) return;
    const ancho = mapa.width * 4;
    const alto = mapa.height * 4;
    fondoMinimapa = document.createElement("canvas");
    fondoMinimapa.width = ancho;
    fondoMinimapa.height = alto;
    const mctx = fondoMinimapa.getContext("2d");
    mctx.fillStyle = "#547b43";
    mctx.fillRect(0, 0, ancho, alto);
    mapa.layers.filter(c => c.type === "tilelayer").forEach(capa => {
        for (let y = 0; y < capa.height; y++) for (let x = 0; x < capa.width; x++) {
            const gid = capa.data[y * capa.width + x];
            if (!gid) continue;
            const ts = obtenerTileset(gid);
            const img = ts && imagenesTilesets[ts.firstgid];
            if (!ts || !img || !img.complete) continue;
            const local = gid - ts.firstgid;
            mctx.drawImage(img, (local % ts.columnas) * TILE_SIZE, Math.floor(local / ts.columnas) * TILE_SIZE,
                TILE_SIZE, TILE_SIZE, x * 4, y * 4, 4, 4);
        }
    });
    [mini, grande].forEach((c, i) => {
        c.width = ancho; c.height = alto;
        c.style.aspectRatio = `${ancho} / ${alto}`;
    });
    actualizarPuntoMapaVivo();
}

function actualizarPuntoMapaVivo() {
    if (!fondoMinimapa || typeof jugadorX !== "number" || typeof jugadorY !== "number") return;
    ["mapa-vivo-mini", "mapa-vivo-grande"].forEach(id => {
        const c = document.getElementById(id);
        if (!c) return;
        const g = c.getContext("2d");
        g.clearRect(0, 0, c.width, c.height);
        g.drawImage(fondoMinimapa, 0, 0);
        const px = (jugadorX + 16) / (mapa.width * TILE_SIZE) * c.width;
        const py = (jugadorY + 16) / (mapa.height * TILE_SIZE) * c.height;
        g.beginPath(); g.arc(px, py, id.endsWith("grande") ? 10 : 7, 0, Math.PI * 2);
        g.fillStyle = "#ffdf45"; g.fill();
        g.lineWidth = id.endsWith("grande") ? 4 : 3; g.strokeStyle = "#7b1e16"; g.stroke();
        g.beginPath(); g.arc(px, py, id.endsWith("grande") ? 3 : 2, 0, Math.PI * 2);
        g.fillStyle = "#fff"; g.fill();
    });
}

// ==========================================
// NPC FEDERALES Y SUS MINIJUEGOS
// ==========================================

const contenedorNPCs =
    document.getElementById("contenedor-npcs");


// Cada NPC tiene una etapa, un diálogo y un minijuego.
// Solo se puede iniciar el minijuego de la etapa actual.

const NPCS_FEDERALES = [

    {
        nombre: "Manuel Ibarra",

        imagen:
            "../Recursos_graficos/NPC/FEDERAL/Manuel%20Ibarra/south.png",

        tileX: 35,
        tileY: 12,

        etapa: 0,

        dialogo:
            "La Secretaría necesita un agente capaz de distinguir aliados de adversarios. Revisá cada informe, compará las ideas y clasificá los doce documentos sin agotar tus oportunidades.",

        minijuego: {

            tipo: "clasificacion",

            titulo: "Misión 1: Los federales",

            instrucciones:
                "Clasificá los informes entre FEDERAL y UNITARIO. Leé las pistas: tenés tiempo limitado y tres oportunidades de error.",

            tarjetas: [
                { texto: "Autonomía de las provincias", bando: "federal" },
                { texto: "Gobierno centralizado", bando: "unitario" },
                { texto: "Defensa de intereses provinciales", bando: "federal" },
                { texto: "Concentración del poder nacional", bando: "unitario" },
                { texto: "Pactos entre provincias", bando: "federal" },
                { texto: "Organización política central", bando: "unitario" }
            ]

        }

    },

    {
        nombre: "Juan Aguirre",

        imagen:
            "../Recursos_graficos/NPC/FEDERAL/Juan%20Aguirre/south.png",

        tileX: 26,
        tileY: 30,

        etapa: 1,

        dialogo:
            "Un despacho fue dividido para que no caiga en manos equivocadas. Reuní sus tres fragmentos, evitá la patrulla que recorre los senderos y llevá la carta hasta la posta.",

        minijuego: {

            tipo: "laberinto",

            titulo: "Misión 2: El mensaje federal",

            instrucciones:
                "Recogé los tres fragmentos del despacho y entregá la carta en la posta. Las paredes verdes bloquean el camino; usá flechas o WASD."

        }

    },

    {
        nombre: "Ramón Barrientos",

        imagen:
            "../Recursos_graficos/NPC/FEDERAL/Ramon%20Barrientos/south.png",

        tileX: 45,
        tileY: 8,

        etapa: 2,

        dialogo:
            "El documento está en un sector vigilado. Estudiá los recorridos, aprovechá los matorrales para ocultarte, recuperá las dos pistas y el despacho, y escapá sin acumular demasiadas alertas.",

        minijuego: {

            tipo: "sigilo",

            titulo: "Misión 3: El despacho secreto",

            instrucciones:
                "En un pueblo vigilado durante los conflictos entre unitarios y federales, recuperá el despacho y llegá a la salida. Movete con flechas o WASD; los matorrales te ocultan."

        }

    },

    {
        nombre: "Nicolás Pereyra",

        imagen:
            "../Recursos_graficos/NPC/FEDERAL/Nicolas%20Pereyra/south.png",

        tileX: 50,
        tileY: 44,

        etapa: 3,

        dialogo:
            "La ruta está bajo ataque. Defendé tu posición, buscá cobertura cuando los tiradores abran fuego y administrá la munición: necesitás neutralizar ocho hostiles para asegurar el paso.",

        minijuego: {

            tipo: "tiro",

            titulo: "Misión 4: Práctica de puntería",

            instrucciones:
                "Defendé la posición y neutralizá 8 hostiles. Movete con WASD o flechas, apuntá con el mouse, dispará y recargá con R. Usá los parapetos para bloquear los disparos enemigos y conservá tu vida."

        }

    },

    {
        nombre: "Vecino del pueblo",
        imagen: "../Recursos_graficos/NPC/FEDERAL/NPC_6/south.png",
        tileX: 39,
        tileY: 27,
        etapa: 4,
        dialogo: "Necesito que reconstruyas una serie de palabras clave de la causa federal. Leé las pistas y completá el crucigrama: cada respuesta te va a acercar a la información que estamos buscando.",
        minijuego: {
            tipo: "crucigrama",
            titulo: "Misión 5: Palabras de la causa",
            instrucciones: "Completá el crucigrama con las palabras de la historia. Seleccioná las casillas y escribí una letra por espacio. Las pistas están debajo del tablero."
        }
    },

    {
        nombre: "Bernabé Gómez",

        imagen:
            "../Recursos_graficos/NPC/FEDERAL/Bernabe%20Gomez/south.png",

        tileX: 15,
        tileY: 54,

        etapa: 5,

        dialogo:
            "El último expediente está desordenado en tres folios. Reconstruí cada texto de principio a fin, prestá atención a las pistas y recuperá el informe completo sobre Facundo.",

        minijuego: {

            tipo: "archivo",

            titulo: "Misión 6: La obra Facundo",

            instrucciones:
                "Reconstruí el despacho de Bernabé. Elegí los fragmentos en el orden correcto para completar la ficha sobre Facundo."

        }

    }

];


// ==========================================
// PROGRESO DE LAS MISIONES
// ==========================================

const CLAVE_ETAPA_MISION = "infiltrados_etapa_mision";

// Al corregir el orden de las misiones, migramos una sola vez el progreso
// anterior para que la partida comience correctamente por Federal/Unitario.
const VERSION_ORDEN_MISIONES = "orden-federal-unitario-2026-11";
if (localStorage.getItem("infiltrados_version_orden_misiones") !== VERSION_ORDEN_MISIONES) {
    localStorage.setItem(CLAVE_ETAPA_MISION, "0");
    localStorage.setItem("infiltrados_version_orden_misiones", VERSION_ORDEN_MISIONES);
}
let etapaMision = Number.parseInt(
    localStorage.getItem(CLAVE_ETAPA_MISION) || "0",
    10
);

// Se permite que la etapa sea igual a la cantidad
// de NPC cuando todas las misiones estén terminadas.

if (
    !Number.isInteger(etapaMision) ||
    etapaMision < 0 ||
    etapaMision > NPCS_FEDERALES.length
) {

    etapaMision = 0;

}


function guardarProgresoMision() {

    localStorage.setItem(
        CLAVE_ETAPA_MISION,
        String(etapaMision)
    );

}


function reiniciarProgresoMision() {

    limpiarEstadoJuego();

    etapaMision = 0;

    guardarProgresoMision();

    if (elementosNPCs.length > 0) {

        posicionarNPCsFederales();

    }

}


function obtenerNPCDisponible() {

    return NPCS_FEDERALES[etapaMision] || null;

}


// ==========================================
// ELEMENTOS VISUALES DE LOS NPC
// ==========================================

const elementosNPCs = [];


// ==========================================
// CREAR NPC
// ==========================================

function crearNPCsFederales() {

    if (!contenedorNPCs) {

        console.error(
            "No se encontró el contenedor de NPC."
        );

        return;

    }

    contenedorNPCs.innerHTML = "";

    elementosNPCs.length = 0;

    NPCS_FEDERALES.forEach((npc) => {

        const elemento = document.createElement("div");

        elemento.classList.add("npc-federal");

        elemento.dataset.nombre = npc.nombre;

        elemento.title = npc.nombre;

        elemento.style.backgroundImage =
            `url("${npc.imagen}")`;

        // Las etapas anteriores y posteriores se muestran
        // con menos opacidad para indicar el progreso.

        elemento.style.opacity =
            npc.etapa === etapaMision ? "1" : "0.35";

        // Convertir las coordenadas de tiles a píxeles.
        // Centrar el sprite de 48x48 sobre la casilla.

        // Buscar una casilla realmente transitable para evitar que los
        // personajes queden dentro de casas, árboles o fuera del camino.
        const posicionSegura = centroLibreCercano(npc.tileX, npc.tileY, { exigirZonaAmplia: true, separacion: 58 });
        if (!posicionSegura) {
            console.warn(`Se omitió el NPC de misión ${npc.nombre}: no hay una baldosa segura cercana.`);
            return;
        }
        npc.x = posicionSegura.x;
        npc.y = posicionSegura.y;
        npc.tileXSeguro = posicionSegura.tileX;
        npc.tileYSeguro = posicionSegura.tileY;

        contenedorNPCs.appendChild(elemento);

        elementosNPCs.push({

            elemento: elemento,

            datos: npc

        });

    });

    posicionarNPCsFederales();

}


// ==========================================
// POSICIONAR NPC SEGÚN LA CÁMARA
// ==========================================

function posicionarNPCsFederales() {

    elementosNPCs.forEach(({ elemento, datos }) => {

        elemento.style.left =
            `${(datos.x - camaraX) * ZOOM_INICIAL}px`;

        elemento.style.top =
            `${(datos.y - camaraY) * ZOOM_INICIAL}px`;

        elemento.style.transform =
            `scale(${ZOOM_INICIAL})`;

        elemento.style.transformOrigin =
            "top left";
        elemento.style.zIndex = String(Math.round(datos.y + 48));

        elemento.style.opacity =
            datos.etapa === etapaMision ? "1" : "0.35";

    });

}


// ==========================================
// VIDA DEL PUEBLO: NPC AMBIENTALES Y ANIMALES
// ==========================================
// Estos personajes son independientes de la cadena de misiones.
// Sus coordenadas se expresan en tiles y se ajustan a una casilla libre.
const ciudadanosPueblo = [];
const animalesPueblo = [];
let entidadAmbientalCercana = null;
let ultimoPasoAmbiental = 0;

const SPRITES_NPC6 = {
    abajo: "../Recursos_graficos/NPC/FEDERAL/NPC_6/south.png",
    arriba: "../Recursos_graficos/NPC/FEDERAL/NPC_6/north.png",
    izquierda: "../Recursos_graficos/NPC/FEDERAL/NPC_6/west.png",
    derecha: "../Recursos_graficos/NPC/FEDERAL/NPC_6/east.png"
};

// Los habitantes que caminan utilizan los sprites animados Ciudadano_1
// y Ciudadano_2. NPC_6 queda reservado para el vecino que permanece quieto.
const SPRITES_CIUDADANOS = [1, 2].map(numero => {
    const carpeta = `../Recursos_graficos/NPC/FEDERAL/Ciudadano_${numero}/animations/`;
    return {
        sur: `${carpeta}Idle_v3_walking_south.gif`,
        norte: `${carpeta}Idle_v3_walking_north.gif`,
        este: `${carpeta}Idle_v3_walking_east.gif`,
        oeste: `${carpeta}Idle_v3_walking_west.gif`
    };
});

function tileDelMapaEsTransitable(tx, ty) {
    if (!mapa || tx < 0 || ty < 0 || tx >= mapa.width || ty >= mapa.height) return false;
    for (const capa of mapa.layers || []) {
        if (capa.type !== "tilelayer" || !capa.data) continue;
        const gid = capa.data[ty * capa.width + tx];
        if (gid && esTileSolido(gid)) return false;
    }
    return true;
}

// El punto lógico de cada personaje se centra en una baldosa. Los sprites
// miden 48 px, por eso se desplazan 8 px a la izquierda y 16 px hacia arriba.
function posicionDesdeTile(tx, ty) {
    return { x: tx * TILE_SIZE - 8, y: ty * TILE_SIZE - 16 };
}

function zonaDePasoAmplia(tx, ty) {
    if (!tileDelMapaEsTransitable(tx, ty)) return false;
    const vecinos = [[1,0],[-1,0],[0,1],[0,-1]];
        const salidas = vecinos.filter(([dx,dy]) => tileDelMapaEsTransitable(tx + dx, ty + dy)).length;
    let libresCercanos = 0;
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (tileDelMapaEsTransitable(tx + dx, ty + dy)) libresCercanos++;
        }
    }
    // Evita callejones y comprueba el espacio que ocupa visualmente el sprite:
    // baldosa central, laterales y baldosa superior despejadas.
    const espacioSprite = [[-1, 0], [1, 0], [0, -1]].every(([dx, dy]) =>
        tileDelMapaEsTransitable(tx + dx, ty + dy)
    );
    return salidas >= 2 && libresCercanos >= 6 && espacioSprite;
}

function centroLibreCercano(tileX, tileY, opciones = {}) {
    if (!mapa) return null;
    const exigirZonaAmplia = opciones.exigirZonaAmplia !== false;
    const separacion = opciones.separacion ?? 46;
    const candidatos = [];

    // Se evalúa todo el mapa y se elige la baldosa segura más cercana.
    // Así nunca se utiliza como último recurso una posición bloqueada.
    for (let ty = 1; ty < mapa.height - 1; ty++) {
        for (let tx = 1; tx < mapa.width - 1; tx++) {
            if (exigirZonaAmplia ? !zonaDePasoAmplia(tx, ty) : !tileDelMapaEsTransitable(tx, ty)) continue;
            const pos = posicionDesdeTile(tx, ty);
            const ocupadoPorMision = typeof elementosNPCs !== "undefined" && elementosNPCs.some(({ datos }) =>
                Math.hypot((datos.x ?? -1000) - pos.x, (datos.y ?? -1000) - pos.y) < separacion
            );
            const ocupadoPorHabitante = [...ciudadanosPueblo, ...animalesPueblo].some(e =>
                Math.hypot(e.x - pos.x, e.y - pos.y) < separacion
            );
            if (ocupadoPorMision || ocupadoPorHabitante) continue;
            const distancia = (tx - tileX) ** 2 + (ty - tileY) ** 2;
            candidatos.push({ ...pos, tx, ty, distancia });
        }
    }
    candidatos.sort((a, b) => a.distancia - b.distancia);
    for (const candidato of candidatos) {
        const hitbox = obtenerHitboxAmbiental(candidato.x, candidato.y);
        const jugadorOcupando = typeof jugadorX === "number" && typeof jugadorY === "number" &&
            rectangulosSeSuperponen(hitbox, obtenerHitboxAmbiental(jugadorX, jugadorY));
        if (jugadorOcupando) continue;
        return { x: candidato.x, y: candidato.y, tileX: candidato.tx, tileY: candidato.ty };
    }
    console.warn("No se encontró una zona amplia y transitable para la entidad.", tileX, tileY);
    return null;
}

function crearEntidadVisual(clase, imagen, nombre) {
    const elemento = document.createElement("div");
    elemento.className = clase;
    elemento.title = nombre;
    elemento.setAttribute("aria-label", nombre);
    elemento.style.backgroundImage = `url("${imagen}")`;
    contenedorNPCs.appendChild(elemento);
    return elemento;
}

function inicializarVidaPueblo() {
    if (!contenedorNPCs || !mapa) return;
    ciudadanosPueblo.forEach(c => c.elemento.remove());
    animalesPueblo.forEach(a => a.elemento.remove());
    ciudadanosPueblo.length = 0;
    animalesPueblo.length = 0;

    // NPC_6 queda fijo y no participa de las misiones.
    const fijoPos = centroLibreCercano(39, 27, { exigirZonaAmplia: true, separacion: 58 });
    if (fijoPos) {
        const fijo = crearEntidadVisual("npc-ambiental npc-estatico", "../Recursos_graficos/NPC/FEDERAL/Ciudadano_2/rotations/south.png", "Vecino de la plaza");
        ciudadanosPueblo.push({
            nombre: "Vecino de la plaza", elemento: fijo, x: fijoPos.x, y: fijoPos.y,
            fijo: true, direccion: "abajo", anclaX: fijoPos.x, anclaY: fijoPos.y,
            dialogo: "¡Buenas! El pueblo está tranquilo, aunque últimamente se ven movimientos extraños cerca de los caminos. Andá con cuidado."
        });
    }

    // Los vecinos móviles alternan entre Ciudadano_1 y Ciudadano_2.
    // Cada uno conserva sus GIF animados y cambia de orientación al caminar.
    const rutasVecinos = [
        { x: 20, y: 18, nombre: "Vecina del mercado", dialogo: "Vengo de hacer las compras. Hoy hay bastante movimiento en el pueblo." },
        { x: 31, y: 39, nombre: "Campesino", dialogo: "El camino del sur suele estar despejado. Evitá meterte entre las construcciones." },
        { x: 57, y: 20, nombre: "Habitante", dialogo: "Dicen que hay gente buscando información por estos pagos. Yo no vi nada..." },
        { x: 66, y: 49, nombre: "Viajera", dialogo: "Estoy de paso. Ojalá los caminos sigan seguros." }
    ];
    rutasVecinos.forEach((v, i) => {
        const pos = centroLibreCercano(v.x, v.y, { exigirZonaAmplia: true, separacion: 72 });
        if (!pos) return;
        const sprites = SPRITES_CIUDADANOS[i % SPRITES_CIUDADANOS.length];
        const el = crearEntidadVisual("npc-ambiental npc-ciudadano", sprites.sur, v.nombre);
        ciudadanosPueblo.push({ ...v, elemento: el, x: pos.x, y: pos.y,
            anclaX: pos.x, anclaY: pos.y, radioPatrulla: 112,
            base: sprites, fijo: false, direccion: "abajo", velocidad: 0.38 + (i % 2) * 0.08,
            cambiarDireccionEn: 0, dx: 0, dy: 0 });
    });

    const definirAnimal = (tipo, nombre, x, y, base) => {
        const pos = centroLibreCercano(x, y, { exigirZonaAmplia: true, separacion: 76 });
        if (!pos) return;
        const elemento = crearEntidadVisual(`animal-pueblo animal-${tipo}`, base.sur, nombre);
        animalesPueblo.push({ elemento, x: pos.x, y: pos.y, nombre, tipo,
            anclaX: pos.x, anclaY: pos.y, radioPatrulla: tipo === "caballo" ? 128 : 88,
            direccion: "sur", dx: 0, dy: 0, cambiarDireccionEn: 0,
            velocidad: tipo === "caballo" ? 0.28 : 0.21, fijo: false, base,
            asustadoHasta: 0, velocidadHuida: tipo === "caballo" ? 0.88 : 0.72 });
    };
    const caballo = {
        sur: "../Recursos_graficos/Animales/Caballo/animations/Idle_v3_walking_south.gif",
        norte: "../Recursos_graficos/Animales/Caballo/animations/Idle_v3_walking_north.gif",
        este: "../Recursos_graficos/Animales/Caballo/animations/Idle_v3_walking_east.gif",
        oeste: "../Recursos_graficos/Animales/Caballo/animations/Idle_v3_walking_west.gif"
    };
    const gallina = {
        sur: "../Recursos_graficos/Animales/gallina/animations/Idle_walk_south.gif",
        norte: "../Recursos_graficos/Animales/gallina/animations/Idle_walk_north.gif",
        este: "../Recursos_graficos/Animales/gallina/animations/Idle_walk_east.gif",
        oeste: "../Recursos_graficos/Animales/gallina/animations/Idle_walk_west.gif"
    };
    definirAnimal("caballo", "Caballo", 12, 22, caballo);
    definirAnimal("caballo", "Caballo", 71, 35, caballo);
    definirAnimal("gallina", "Gallina", 17, 48, gallina);
    definirAnimal("gallina", "Gallina", 24, 51, gallina);
    definirAnimal("gallina", "Gallina", 62, 57, gallina);
    posicionarEntidadesPueblo();
}

function posicionarEntidadesPueblo() {
    [...ciudadanosPueblo, ...animalesPueblo].forEach(e => {
        e.elemento.style.left = `${(e.x - camaraX) * ZOOM_INICIAL}px`;
        e.elemento.style.top = `${(e.y - camaraY) * ZOOM_INICIAL}px`;
        e.elemento.style.transform = `scale(${ZOOM_INICIAL})`;
        e.elemento.style.zIndex = String(Math.round(e.y + 48));
    });
}

function actualizarVidaPueblo() {
    if (!mapa || minijuegoAbierto || ventanaDialogoNPC?.style.display === "flex") return;
    const ahora = Date.now();
    const delta = Math.min(2, (ahora - (ultimoPasoAmbiental || ahora)) / 16.67);
    ultimoPasoAmbiental = ahora;
    const mover = entidad => {
        if (entidad.fijo) return;
        const esAnimal = animalesPueblo.includes(entidad);
        let velocidadActual = entidad.velocidad;
        if (esAnimal) {
            const ax = entidad.x + 24, ay = entidad.y + 24;
            const px = jugadorX + 16, py = jugadorY + 16;
            const dxJugador = ax - px, dyJugador = ay - py;
            const distanciaJugador = Math.hypot(dxJugador, dyJugador);
            // Los animales detectan al jugador y huyen durante un breve lapso.
            if (distanciaJugador < 132) {
                entidad.asustadoHasta = ahora + 1500;
                const modulo = Math.max(1, distanciaJugador);
                entidad.dx = dxJugador / modulo;
                entidad.dy = dyJugador / modulo;
                entidad.direccion = Math.abs(entidad.dx) > Math.abs(entidad.dy)
                    ? (entidad.dx < 0 ? "izquierda" : "derecha")
                    : (entidad.dy < 0 ? "arriba" : "abajo");
            }
            if (ahora < (entidad.asustadoHasta || 0)) {
                velocidadActual = entidad.velocidadHuida;
                entidad.radioPatrulla = Math.max(entidad.radioPatrulla, 150);
                entidad.elemento.classList.add("animal-asustado");
            } else {
                entidad.elemento.classList.remove("animal-asustado");
            }
        }
        const direcciones = [
            { nombre: "arriba", dx: 0, dy: -1 },
            { nombre: "abajo", dx: 0, dy: 1 },
            { nombre: "izquierda", dx: -1, dy: 0 },
            { nombre: "derecha", dx: 1, dy: 0 }
        ];
        const dentroDePatrulla = (x, y) => Math.hypot(x - entidad.anclaX, y - entidad.anclaY) <= (entidad.radioPatrulla || 100);
        const direccionValida = dir => {
            const nx = entidad.x + dir.dx * 9;
            const ny = entidad.y + dir.dy * 9;
            return dentroDePatrulla(nx, ny) && puedeMoverseAmbiental(nx, ny, entidad);
        };

        if ((!esAnimal || ahora >= (entidad.asustadoHasta || 0)) && ahora >= entidad.cambiarDireccionEn) {
            const opciones = direcciones.filter(direccionValida);
            if (opciones.length) {
                const sinRetroceso = opciones.filter(d => !(d.dx === -entidad.dx && d.dy === -entidad.dy));
                const elegibles = sinRetroceso.length ? sinRetroceso : opciones;
                const elegida = elegibles[Math.floor(Math.random() * elegibles.length)];
                entidad.direccion = elegida.nombre;
                entidad.dx = elegida.dx;
                entidad.dy = elegida.dy;
            } else {
                entidad.dx = 0;
                entidad.dy = 0;
            }
            entidad.cambiarDireccionEn = ahora + 1300 + Math.random() * 1800;
        }

        let nx = entidad.x + entidad.dx * velocidadActual * delta;
        let ny = entidad.y + entidad.dy * velocidadActual * delta;
        // Al llegar al límite de su zona de paseo, eligen otra salida libre.
        if (!dentroDePatrulla(nx, ny) || !puedeMoverseAmbiental(nx, ny, entidad)) {
            const opciones = direcciones.filter(direccionValida);
            if (opciones.length) {
                const elegida = opciones[Math.floor(Math.random() * opciones.length)];
                entidad.direccion = elegida.nombre;
                entidad.dx = elegida.dx;
                entidad.dy = elegida.dy;
                nx = entidad.x + entidad.dx * velocidadActual * delta;
                ny = entidad.y + entidad.dy * velocidadActual * delta;
            } else {
                entidad.dx = 0;
                entidad.dy = 0;
                entidad.cambiarDireccionEn = ahora + 450;
            }
        }
        if (entidad.dx || entidad.dy) {
            if (dentroDePatrulla(nx, ny) && puedeMoverseAmbiental(nx, ny, entidad)) {
                entidad.x = nx;
                entidad.y = ny;
            }
        }
        const mapaDireccion = { arriba: "norte", abajo: "sur", izquierda: "oeste", derecha: "este" };
        const dir = mapaDireccion[entidad.direccion];
        const sprite = entidad.base ? entidad.base[dir] : SPRITES_NPC6[entidad.direccion];
        if (entidad.ultimoSprite !== sprite) {
            entidad.elemento.style.backgroundImage = `url("${sprite}")`;
            entidad.ultimoSprite = sprite;
        }
    };
    ciudadanosPueblo.forEach(mover);
    animalesPueblo.forEach(mover);
    posicionarEntidadesPueblo();
}

function obtenerHitboxAmbiental(x, y) {
    return { left: x + 14, right: x + 34, top: y + 27, bottom: y + 43 };
}

function rectangulosSeSuperponen(a, b) {
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function puedeMoverseAmbiental(x, y, entidadActual) {
    if (!mapa) return false;
    const hitbox = obtenerHitboxAmbiental(x, y);
    const anchoMapa = mapa.width * TILE_SIZE;
    const altoMapa = mapa.height * TILE_SIZE;
    if (hitbox.left < 0 || hitbox.top < 0 || hitbox.right > anchoMapa || hitbox.bottom > altoMapa) return false;

    const tx0 = Math.floor(hitbox.left / TILE_SIZE);
    const tx1 = Math.floor((hitbox.right - 1) / TILE_SIZE);
    const ty0 = Math.floor(hitbox.top / TILE_SIZE);
    const ty1 = Math.floor((hitbox.bottom - 1) / TILE_SIZE);
    for (const capa of mapa.layers || []) {
        if (capa.type !== "tilelayer" || !capa.data) continue;
        for (let ty = ty0; ty <= ty1; ty++) {
            for (let tx = tx0; tx <= tx1; tx++) {
                if (tx < 0 || ty < 0 || tx >= capa.width || ty >= capa.height) return false;
                const gid = capa.data[ty * capa.width + tx];
                if (gid && esTileSolido(gid)) return false;
            }
        }
    }

    if (rectangulosSeSuperponen(hitbox, obtenerHitboxAmbiental(jugadorX, jugadorY))) return false;
    const otras = [...ciudadanosPueblo, ...animalesPueblo].filter(e => e !== entidadActual);
    if (otras.some(e => rectangulosSeSuperponen(hitbox, obtenerHitboxAmbiental(e.x, e.y)))) return false;
    const npcsDeMision = (typeof elementosNPCs !== "undefined" ? elementosNPCs : []);
    if (npcsDeMision.some(({ datos }) => rectangulosSeSuperponen(hitbox, obtenerHitboxAmbiental(datos.x, datos.y)))) return false;
    return true;
}

function hayEntidadCerca(x, y, entidadActual) {
    return !puedeMoverseAmbiental(x, y, entidadActual);
}

function buscarEntidadAmbientalCercana() {
    const px = jugadorX + 16, py = jugadorY + 16;
    let mejor = null, distancia = 70;
    ciudadanosPueblo.forEach(e => {
        const d = Math.hypot(px - (e.x + 24), py - (e.y + 24));
        if (d < distancia) { distancia = d; mejor = e; }
    });
    return mejor;
}


// ==========================================
// INTERACCIÓN CON NPC
// ==========================================

// Distancia máxima para hablar con un NPC.

const DISTANCIA_INTERACCION_NPC = 75;


// NPC más cercano al jugador.

let npcCercano = null;


// Control del minijuego actual.

let minijuegoAbierto = false;

let npcDelMinijuego = null;


// ==========================================
// CREAR AVISO PARA HABLAR
// ==========================================

const avisoNPC = document.createElement("div");

avisoNPC.className = "aviso-interaccion-npc";

avisoNPC.textContent = "Presioná E para hablar";

avisoNPC.style.display = "none";

document.body.appendChild(avisoNPC);


// ==========================================
// VENTANA DE DIÁLOGO ESTILO RPG
// ==========================================

const ventanaDialogoNPC = document.createElement("div");

ventanaDialogoNPC.className = "ventana-dialogo-npc";

ventanaDialogoNPC.style.display = "none";

ventanaDialogoNPC.innerHTML = `
    <div class="dialogo-npc-contenido">

        <div class="retrato-npc">
            <img id="imagen-retrato-npc" src="" alt="Retrato del personaje">
        </div>

        <div class="caja-dialogo-npc">

            <h2 id="nombre-dialogo-npc"></h2>

            <p id="texto-dialogo-npc"></p>

            <button id="btn-iniciar-minijuego" type="button">
                Comenzar minijuego
            </button>

            <button id="btn-cerrar-dialogo-npc" type="button">
                Cerrar
            </button>

        </div>

    </div>
`;

document.body.appendChild(ventanaDialogoNPC);


// Referencias de la ventana.

const nombreDialogoNPC =
    ventanaDialogoNPC.querySelector("#nombre-dialogo-npc");

const textoDialogoNPC =
    ventanaDialogoNPC.querySelector("#texto-dialogo-npc");

const btnIniciarMinijuego =
    ventanaDialogoNPC.querySelector("#btn-iniciar-minijuego");

const btnCerrarDialogoNPC =
    ventanaDialogoNPC.querySelector("#btn-cerrar-dialogo-npc");


// ==========================================
// BUSCAR NPC CERCANO
// ==========================================

function actualizarInteraccionNPC() {

    if (
        !mapa ||
        ventanaDialogoNPC.style.display === "flex" ||
        minijuegoAbierto
    ) {

        avisoNPC.style.display = "none";

        return;

    }

    npcCercano = null;

    // No hay más NPC disponibles cuando todas
    // las etapas se completaron.

    const npcDisponible = obtenerNPCDisponible();


    let distanciaMinima = DISTANCIA_INTERACCION_NPC;

    // Centro aproximado del jugador.

    const centroJugadorX = jugadorX + 16;

    const centroJugadorY = jugadorY + 16;

    elementosNPCs.forEach(({ datos }) => {

        // Solo el NPC de la etapa actual puede iniciar
        // una conversación o un minijuego.

        if (!npcDisponible || datos.etapa !== etapaMision) return;

        // Centro del NPC.

        const centroNPCX = datos.x + 24;

        const centroNPCY = datos.y + 24;

        const diferenciaX =
            centroJugadorX - centroNPCX;

        const diferenciaY =
            centroJugadorY - centroNPCY;

        const distancia = Math.sqrt(
            diferenciaX * diferenciaX +
            diferenciaY * diferenciaY
        );

        if (distancia < distanciaMinima) {

            distanciaMinima = distancia;

            npcCercano = datos;

        }

    });

    entidadAmbientalCercana = buscarEntidadAmbientalCercana();
    if (npcCercano) {
        avisoNPC.textContent = `E — Hablar con ${npcCercano.nombre}`;
        avisoNPC.style.display = "block";
    } else if (entidadAmbientalCercana) {
        avisoNPC.textContent = `E — Hablar con ${entidadAmbientalCercana.nombre}`;
        avisoNPC.style.display = "block";
    } else {
        avisoNPC.style.display = "none";
    }

}


// ==========================================
// ABRIR DIÁLOGO
// ==========================================

function hablarConNPC() {

    if (
        !npcCercano ||
        npcCercano.etapa !== etapaMision ||
        minijuegoAbierto
    ) {

        return;

    }

    // Mostrar el nombre.

    btnIniciarMinijuego.style.display = "";
    nombreDialogoNPC.textContent =
        npcCercano.nombre;

    // Mostrar el diálogo.

    textoDialogoNPC.textContent =
        dialogoConAdvertenciaDeSospecha(npcCercano.dialogo);

    // Mostrar el retrato del NPC.

    const imagenRetrato =
        ventanaDialogoNPC.querySelector("#imagen-retrato-npc");

    imagenRetrato.src = npcCercano.imagen;

    imagenRetrato.alt = npcCercano.nombre;

    // Guardar qué NPC inició la conversación.

    npcDelMinijuego = npcCercano;

    const tipoMinijuego = npcDelMinijuego.minijuego?.tipo;

    const textosInicioMinijuego = {
        clasificacion: "Clasificar ideas",
        laberinto: "Recorrer el laberinto",
        sigilo: "Infiltrarse",
        tiro: "Empezar práctica",
        archivo: "Reconstruir informe",
        crucigrama: "Resolver crucigrama"
    };

    btnIniciarMinijuego.textContent =
        textosInicioMinijuego[tipoMinijuego] || "Comenzar minijuego";

    // Abrir la ventana.

    ventanaDialogoNPC.style.display = "flex";

    avisoNPC.style.display = "none";

}


// ==========================================
// CERRAR DIÁLOGO
// ==========================================

function cerrarDialogoNPCFuncion() {

    ventanaDialogoNPC.style.display = "none";

    npcDelMinijuego = null;

    actualizarInteraccionNPC();

}


btnCerrarDialogoNPC.addEventListener(
    "click",
    cerrarDialogoNPCFuncion
);


// ==========================================
// TECLA E
// ==========================================

document.addEventListener("keydown", (evento) => {

    if (evento.key.toLowerCase() !== "e") return;

    // Evitar que mantener E abra y cierre
    // repetidamente la conversación.

    if (evento.repeat) return;

    // No abrir conversaciones encima del minijuego.

    if (minijuegoAbierto) return;

    window.InfiltradosAudio?.play("interaccion");

    // Si el diálogo está abierto, E lo cierra.

    if (ventanaDialogoNPC.style.display === "flex") {

        cerrarDialogoNPCFuncion();

        return;

    }

    actualizarInteraccionNPC();

    if (!npcCercano && entidadAmbientalCercana) {
        nombreDialogoNPC.textContent = entidadAmbientalCercana.nombre;
        textoDialogoNPC.textContent = dialogoConAdvertenciaDeSospecha(entidadAmbientalCercana.dialogo);
        const retrato = ventanaDialogoNPC.querySelector("#imagen-retrato-npc");
        retrato.src = SPRITES_NPC6.abajo;
        retrato.alt = entidadAmbientalCercana.nombre;
        npcDelMinijuego = null;
        btnIniciarMinijuego.style.display = "none";
        ventanaDialogoNPC.style.display = "flex";
        avisoNPC.style.display = "none";
        return;
    }

    btnIniciarMinijuego.style.display = "";
    hablarConNPC();

});


// ==========================================
// SISTEMA DE MINIJUEGOS
// ==========================================

const ventanaMinijuego = document.createElement("div");

ventanaMinijuego.id = "ventana-minijuego";

ventanaMinijuego.style.display = "none";

ventanaMinijuego.innerHTML = `
    <div class="minijuego-contenido">

        <button id="btn-salir-minijuego" type="button" aria-label="Salir del minijuego" title="Salir del minijuego">×</button>
        <h2 id="titulo-minijuego"></h2>

        <p id="pregunta-minijuego"></p>

        <div id="area-juego-minijuego"></div>

        <div id="opciones-minijuego"></div>

        <p id="resultado-minijuego"></p>

        <button
            id="btn-continuar-minijuego"
            type="button"
            style="display:none"
        >
            Continuar
        </button>

    </div>
`;

document.body.appendChild(ventanaMinijuego);


// Referencias de los elementos del minijuego.

const tituloMinijuego =
    ventanaMinijuego.querySelector("#titulo-minijuego");

const preguntaMinijuego =
    ventanaMinijuego.querySelector("#pregunta-minijuego");

const opcionesMinijuego =
    ventanaMinijuego.querySelector("#opciones-minijuego");

const areaJuegoMinijuego =
    ventanaMinijuego.querySelector("#area-juego-minijuego");

const resultadoMinijuego =
    ventanaMinijuego.querySelector("#resultado-minijuego");

const btnContinuarMinijuego =
    ventanaMinijuego.querySelector("#btn-continuar-minijuego");
const btnSalirMinijuego = ventanaMinijuego.querySelector("#btn-salir-minijuego");

function salirDelMinijuego() {
    if (!minijuegoAbierto) return;
    if (!respuestaCorrecta) penalizarFalloMinijuego("Abandonaste el minijuego antes de completarlo", 10);
    limpiarEstadoJuego();
    minijuegoAbierto = false;
    npcDelMinijuego = null;
    npcCercano = null;
    respuestaCorrecta = false;
    ventanaMinijuego.style.display = "none";
    areaJuegoMinijuego.innerHTML = "";
    resultadoMinijuego.textContent = "";
    btnContinuarMinijuego.style.display = "none";
    avisoNPC.style.display = "none";
    actualizarInteraccionNPC();
}
btnSalirMinijuego.addEventListener("click", salirDelMinijuego);


// Control de respuesta.

let respuestaCorrecta = false;

let temporizadorTiro = null;
let tiempoRestanteTiro = 25;
let blancosAcertados = 0;
let disparosRestantes = 8;
let posicionJugadorLaberinto = { x: 0, y: 0 };
let manejadorTecladoLaberinto = null;
let animacionTiro = null;
let manejadoresTiro = null;


function limpiarEstadoJuego() {

    if (temporizadorTiro !== null) {

        window.clearInterval(temporizadorTiro);

        temporizadorTiro = null;

    }

    if (manejadorTecladoLaberinto) {
        document.removeEventListener("keydown", manejadorTecladoLaberinto, true);
        manejadorTecladoLaberinto = null;
    }

    if (animacionTiro !== null) {
        cancelAnimationFrame(animacionTiro);
        animacionTiro = null;
    }
    if (manejadoresTiro) {
        document.removeEventListener("keydown", manejadoresTiro.teclado, true);
        document.removeEventListener("keyup", manejadoresTiro.soltar, true);
        manejadoresTiro = null;
    }
}


function completarMinijuego(mensaje) {

    if (respuestaCorrecta) return;

    respuestaCorrecta = true;

    limpiarEstadoJuego();

    resultadoMinijuego.textContent = mensaje;

    resultadoMinijuego.style.color = "#4caf50";
    actualizarTextoMision(true);
    ocultarFlechaMision();

    btnContinuarMinijuego.textContent =
        etapaMision === NPCS_FEDERALES.length - 1
            ? "Terminar aventura"
            : "Continuar al siguiente NPC";

    btnContinuarMinijuego.style.display = "block";

    // El cierre se encadena automáticamente al terminar la quinta misión.
    if (etapaMision === NPCS_FEDERALES.length - 1) {
        btnContinuarMinijuego.style.display = "none";
        resultadoMinijuego.textContent = `${mensaje} · Preparando el expediente final...`;
        setTimeout(() => {
            if (!respuestaCorrecta || !minijuegoAbierto || etapaMision !== NPCS_FEDERALES.length - 1) return;
            etapaMision++;
            guardarProgresoMision();
            minijuegoAbierto = false;
            npcDelMinijuego = null;
            ventanaMinijuego.style.display = "none";
            iniciarBonusFinal();
        }, 1800);
    }

}


function crearSpriteMinijuego(tipo, etiqueta) {

    const sprite = document.createElement("span");

    sprite.className = `sprite-minijuego sprite-${tipo}`;
    sprite.setAttribute("aria-label", etiqueta);
    sprite.setAttribute("role", "img");

    if (tipo === "mensajero") {

        sprite.style.backgroundImage =
            'url("../Recursos_graficos/Sprites/AbajoP1.png")';

    } else if (tipo === "guardia-secundario") {

        sprite.style.backgroundImage =
            'url("../Recursos_graficos/NPC/FEDERAL/Minijuegos/guardia-pixel.svg")';

    } else {

        sprite.style.backgroundImage =
            'url("../Recursos_graficos/NPC/FEDERAL/Ramon%20Barrientos/south.png")';

    }

    return sprite;

}


function iniciarLaberinto() {
    // Laberinto ampliado: una red de caminos rurales generada en cada intento.
    // Se conserva el objetivo original: recuperar tres fragmentos y llegar a la posta.
    const columnas = 17, filas = 13;
    const recorrido = Array.from({ length: filas }, () => Array(columnas).fill("#"));
    const inicio = { x: 1, y: 1 };
    const salida = { x: 15, y: 11 };
    const pila = [inicio];
    recorrido[inicio.y][inicio.x] = ".";
    while (pila.length) {
        const actual = pila[pila.length - 1];
        const vecinos = [[0,-2],[2,0],[0,2],[-2,0]]
            .map(([dx,dy]) => ({ x: actual.x + dx, y: actual.y + dy, dx, dy }))
            .filter(n => n.x > 0 && n.x < columnas - 1 && n.y > 0 && n.y < filas - 1 && recorrido[n.y][n.x] === "#");
        if (!vecinos.length) { pila.pop(); continue; }
        const siguiente = vecinos[Math.floor(Math.random() * vecinos.length)];
        recorrido[actual.y + siguiente.dy / 2][actual.x + siguiente.dx / 2] = ".";
        recorrido[siguiente.y][siguiente.x] = ".";
        pila.push({ x: siguiente.x, y: siguiente.y });
    }
    // Abrimos paredes interiores para trenzar el laberinto: aparecen bucles,
    // atajos y rutas alternativas en lugar de un único corredor obligatorio.
    const paredesCandidatas = [];
    for (let y = 1; y < filas - 1; y++) {
        for (let x = 1; x < columnas - 1; x++) {
            if (recorrido[y][x] !== "#") continue;
            const vertical = recorrido[y-1][x] !== "#" && recorrido[y+1][x] !== "#";
            const horizontal = recorrido[y][x-1] !== "#" && recorrido[y][x+1] !== "#";
            if (vertical || horizontal) paredesCandidatas.push({x,y});
        }
    }
    paredesCandidatas.sort(() => Math.random() - 0.5);
    paredesCandidatas.slice(0, Math.max(8, Math.floor(paredesCandidatas.length * .38)))
        .forEach(p => { recorrido[p.y][p.x] = "."; });
    recorrido[salida.y][salida.x] = "E";

    // BFS para calcular accesibilidad y una ruta de patrulla válida.
    const clave = p => `${p.x},${p.y}`;
    const distancias = new Map([[clave(inicio), 0]]);
    const padres = new Map();
    const cola = [inicio];
    while (cola.length) {
        const p = cola.shift();
        for (const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]) {
            const n = { x:p.x+dx, y:p.y+dy };
            if (n.x < 0 || n.x >= columnas || n.y < 0 || n.y >= filas || recorrido[n.y][n.x] === "#" || distancias.has(clave(n))) continue;
            distancias.set(clave(n), distancias.get(clave(p)) + 1);
            padres.set(clave(n), p);
            cola.push(n);
        }
    }
    const ruta = [];
    let cursor = salida;
    while (cursor) { ruta.unshift(cursor); cursor = padres.get(clave(cursor)); }
    const celdasDisponibles = [...distancias.entries()]
        .map(([id, distancia]) => ({ id, distancia }))
        .filter(p => p.distancia > 5 && p.distancia < distancias.get(clave(salida)) - 2)
        .sort((a,b) => a.distancia - b.distancia);
    const puntosFragmento = [];
    [0.28, 0.53, 0.76].forEach((factor, indice) => {
        const objetivo = distancias.get(clave(salida)) * factor;
        const candidatos = celdasDisponibles.filter(p =>
            Math.abs(p.distancia - objetivo) < 4 && !puntosFragmento.some(q => q.id === p.id));
        const elegido = candidatos[Math.floor(Math.random() * Math.max(1, candidatos.length))];
        if (elegido) puntosFragmento.push(elegido);
    });
    const fragmentos = new Set(puntosFragmento.map(p => p.id));
    recorrido[salida.y][salida.x] = "E";
    let pasos = 0, vidasLaberinto = 3, indiceVigilante = Math.max(2, Math.floor(ruta.length*.38));
    let alerta = 0;

    const tablero = document.createElement("div");
    tablero.className = "tablero-laberinto laberinto-expandido";
    tablero.setAttribute("role", "grid");
    tablero.setAttribute("aria-label", "Red de caminos rurales con patrulla y tres documentos para recuperar");
    areaJuegoMinijuego.dataset.escena = "correo";
    posicionJugadorLaberinto = { ...inicio };

    const panel = document.createElement("section");
    panel.className = "laberinto-briefing";
    panel.innerHTML = '<div class="laberinto-kicker">OPERACIÓN · RED DE POSTAS · 1830</div><h3>EL MENSAJE ENTRE PROVINCIAS</h3><p>Recuperá los tres fragmentos, elegí entre varios desvíos y llegá a la posta. La patrulla recorre los caminos: usá los cruces y callejones para esquivarla.</p>';
    areaJuegoMinijuego.appendChild(panel);

    function renderizarLaberinto() {
        tablero.innerHTML = "";
        recorrido.forEach((fila, y) => fila.forEach((celda, x) => {
            const casilla = document.createElement("div");
            casilla.className = "casilla-laberinto";
            casilla.setAttribute("role", "gridcell");
            if (celda === "#") casilla.classList.add("casilla-muro");
            else if (celda === "E") casilla.classList.add("casilla-salida");
            else casilla.classList.add("casilla-camino");
            const id = `${x},${y}`;
            if (fragmentos.has(id)) {
                casilla.classList.add("casilla-fragmento");
                const papel = document.createElement("span");
                papel.className = "sprite-fragmento";
                papel.setAttribute("aria-label", "Fragmento del despacho");
                casilla.appendChild(papel);
            }
            const guardia = ruta[indiceVigilante];
            if (guardia && x === guardia.x && y === guardia.y) {
                casilla.classList.add("casilla-vigilante");
                const sprite = document.createElement("span");
                sprite.className = "sprite-vigilante-laberinto";
                sprite.setAttribute("role", "img");
                sprite.setAttribute("aria-label", "Guardia unitario");
                sprite.title = "Guardia unitario";
                casilla.appendChild(sprite);
            }
            if (x === posicionJugadorLaberinto.x && y === posicionJugadorLaberinto.y) {
                casilla.classList.add("casilla-jugador");
                casilla.appendChild(crearSpriteMinijuego("mensajero", "Mensajero federal"));
            } else if (celda === "E") {
                const posta = document.createElement("span");
                posta.className = "sprite-posta";
                posta.setAttribute("aria-label", "Posta federal");
                casilla.appendChild(posta);
            }
            tablero.appendChild(casilla);
        }));
    }

    function actualizarEstado() {
        const hud = areaJuegoMinijuego.querySelector(".marcador-laberinto");
        if (!hud) return;
        hud.innerHTML = `<span>DESPACHO <b>${3-fragmentos.size}/3</b></span><span>PASOS <b>${pasos}</b></span><span>VIDAS <b>${vidasLaberinto}/3</b></span><span>ALERTA <b>${alerta}/3</b></span>`;
        hud.style.setProperty("--avance", `${((3-fragmentos.size)/3)*100}%`);
    }

    function moverJugador(dx, dy) {
        if (respuestaCorrecta) return;
        const nuevoX = posicionJugadorLaberinto.x + dx, nuevoY = posicionJugadorLaberinto.y + dy;
        if (nuevoX < 0 || nuevoX >= columnas || nuevoY < 0 || nuevoY >= filas || recorrido[nuevoY][nuevoX] === "#") return;
        posicionJugadorLaberinto = { x:nuevoX, y:nuevoY };
        pasos++;
        if (pasos % 2 === 0) indiceVigilante = (indiceVigilante + 1) % ruta.length;
        const guardia = ruta[indiceVigilante];
        if (guardia && guardia.x === nuevoX && guardia.y === nuevoY) {
            vidasLaberinto--; alerta++;
            resultadoMinijuego.textContent = `¡La patrulla te encontró! Perdiste una vida y volviste al refugio (${vidasLaberinto}/3).`;
            resultadoMinijuego.style.color = "#ffb36b";
            posicionJugadorLaberinto = { ...inicio };
            if (vidasLaberinto <= 0) {
                penalizarFalloMinijuego("La patrulla te atrapó y fallaste la operación");
                limpiarEstadoJuego();
                const retry = document.createElement("button"); retry.className = "opcion-minijuego"; retry.textContent = "Reintentar operación";
                retry.addEventListener("click", () => { penalizacionFalloAplicada = false; areaJuegoMinijuego.innerHTML=""; resultadoMinijuego.textContent=""; iniciarLaberinto(); });
                areaJuegoMinijuego.appendChild(retry); return;
            }
        }
        fragmentos.delete(clave(posicionJugadorLaberinto));
        renderizarLaberinto(); actualizarEstado();
        if (recorrido[posicionJugadorLaberinto.y][posicionJugadorLaberinto.x] === "E") {
            if (fragmentos.size) {
                resultadoMinijuego.textContent = `El despacho sigue incompleto: faltan ${fragmentos.size} fragmentos.`;
                resultadoMinijuego.style.color = "#ffb36b";
            } else completarMinijuego(`¡Despacho entregado tras ${pasos} pasos! Los tres fragmentos llegaron a salvo a la posta federal.`);
        }
    }

    const marcador = document.createElement("div");
    marcador.className = "marcador-laberinto laberinto-hud";
    areaJuegoMinijuego.appendChild(marcador);
    areaJuegoMinijuego.appendChild(tablero);
    const leyenda = document.createElement("div");
    leyenda.className = "laberinto-leyenda";
    leyenda.innerHTML = '<span>✦ Fragmento del despacho</span><span>♟ Guardia unitario</span><span>⚑ Posta federal</span><span>▧ Camino transitable</span>';
    areaJuegoMinijuego.appendChild(leyenda);
    const controles = document.createElement("div");
    controles.className = "controles-laberinto";
    [{t:"↑",x:0,y:-1},{t:"←",x:-1,y:0},{t:"↓",x:0,y:1},{t:"→",x:1,y:0}].forEach(c => {
        const b = document.createElement("button"); b.type="button"; b.className="control-laberinto"; b.textContent=c.t;
        b.addEventListener("click", () => moverJugador(c.x,c.y)); controles.appendChild(b);
    });
    areaJuegoMinijuego.appendChild(controles);
    const movimientos = { arrowup:[0,-1],w:[0,-1],arrowleft:[-1,0],a:[-1,0],arrowdown:[0,1],s:[0,1],arrowright:[1,0],d:[1,0] };
    manejadorTecladoLaberinto = evento => {
        const movimiento = movimientos[evento.key.toLowerCase()];
        if (!movimiento) return;
        evento.preventDefault(); evento.stopImmediatePropagation(); moverJugador(movimiento[0],movimiento[1]);
    };
    document.addEventListener("keydown", manejadorTecladoLaberinto, true);
    actualizarEstado(); renderizarLaberinto();
}

function iniciarGaleriaTiro() {
    // Shooter arcade de vista superior: movimiento, apuntado, coberturas y enemigos armados.
    limpiarEstadoJuego();
    const zona = document.createElement("div");
    zona.className = "zona-tiro zona-tiro-shooter";
    areaJuegoMinijuego.dataset.escena = "tiro";
    const marcador = document.createElement("p");
    marcador.className = "marcador-tiro";
    const ayuda = document.createElement("p");
    ayuda.className = "ayuda-shooter";
    ayuda.textContent = "FEDERAL: WASD / flechas para moverte · Mouse para apuntar y disparar · R para recargar · Cubrite tras los parapetos";
    const canvasTiro = document.createElement("canvas");
    canvasTiro.className = "canvas-shooter";
    canvasTiro.width = 900;
    canvasTiro.height = 500;
    canvasTiro.setAttribute("aria-label", "Campo de batalla: combatiente federal contra tropas unitarias. Movete, apuntá y defendé tu posición.");
    zona.append(canvasTiro);
    areaJuegoMinijuego.append(marcador, ayuda, zona);
    const g = canvasTiro.getContext("2d");

    const mundo = { w: 900, h: 500, tiempo: 0, bajas: 0, objetivo: 8, vida: 100, cargador: 12, reserva: 48, recargando: false, invulnerable: 0, oleada: 1, fin: false };
    const jugador = { x: 95, y: 250, r: 14, angulo: 0, velocidad: 3.1 };
    const teclas = {};
    const balasJugador = [];
    const balasEnemigas = [];
    const particulas = [];
    const obstaculos = [
        {x:260,y:95,w:90,h:45}, {x:430,y:205,w:115,h:50}, {x:245,y:355,w:105,h:48},
        {x:640,y:85,w:70,h:95}, {x:675,y:340,w:110,h:48}, {x:470,y:410,w:75,h:35}
    ];
    const enemigos = [];
    let ultimoDisparo = 0;
    let ultimoSpawn = 0;
    let mouse = {x:450,y:250,activo:false};
    let destelloDisparo = 0;
    const decoracion = Array.from({length:42},(_,i)=>({x:(i*173+47)%900,y:(i*97+31)%500,r:2+(i%4),a:.05+(i%5)*.018}));

    function crearEnemigo() {
        const lado = Math.floor(Math.random()*3);
        const x = lado===0 ? 850 : (lado===1 ? 480+Math.random()*360 : 120+Math.random()*650);
        const y = lado===0 ? 60+Math.random()*380 : (lado===1 ? 35 : 455);
        enemigos.push({x,y,r:13,vida:2,vel:0.72+Math.random()*0.35,disparo:50+Math.random()*70,parpadeo:0});
    }
    for(let i=0;i<3;i++) crearEnemigo();

    function colisionCirculoRect(cx,cy,r,o) {
        const px=Math.max(o.x,Math.min(cx,o.x+o.w));
        const py=Math.max(o.y,Math.min(cy,o.y+o.h));
        return (cx-px)**2+(cy-py)**2<r*r;
    }
    function libre(x,y,r) {
        if(x<r||y<r||x>mundo.w-r||y>mundo.h-r) return false;
        return !obstaculos.some(o=>colisionCirculoRect(x,y,r,o));
    }
    function lineaLibre(x1,y1,x2,y2) {
        const pasos=24;
        for(let i=1;i<pasos;i++){
            const t=i/pasos, x=x1+(x2-x1)*t, y=y1+(y2-y1)*t;
            if(obstaculos.some(o=>x>o.x&&x<o.x+o.w&&y>o.y&&y<o.y+o.h)) return false;
        }
        return true;
    }
    function actualizarHUD() {
        marcador.textContent=`FEDERALES  ·  BAJAS UNITARIAS ${mundo.bajas}/${mundo.objetivo}  ·  VIDA ${Math.max(0,Math.ceil(mundo.vida))}%  ·  FUSIL ${mundo.cargador}/${mundo.reserva}  ·  OLEADA ${mundo.oleada}`;
        marcador.dataset.aciertos=String(mundo.bajas);
        marcador.style.setProperty("--avance",`${mundo.bajas/mundo.objetivo*100}%`);
    }
    function recargar() {
        if(mundo.recargando||mundo.cargador===12||mundo.reserva<=0||mundo.fin) return;
        mundo.recargando=true;
        ayuda.textContent="RECARGANDO… Mantenete a cubierto.";
        window.setTimeout(()=>{
            if(mundo.fin) return;
            const cantidad=Math.min(12-mundo.cargador,mundo.reserva);
            mundo.cargador+=cantidad; mundo.reserva-=cantidad; mundo.recargando=false;
            ayuda.textContent="FEDERAL: WASD / flechas para moverte · Mouse para apuntar y disparar · R para recargar · Cubrite tras los parapetos";
            actualizarHUD();
        },1050);
    }
    function disparar() {
        if(mundo.fin||mundo.recargando||mundo.cargador<=0||performance.now()-ultimoDisparo<230) return;
        ultimoDisparo=performance.now(); mundo.cargador--; destelloDisparo=5;
        balasJugador.push({x:jugador.x+Math.cos(jugador.angulo)*18,y:jugador.y+Math.sin(jugador.angulo)*18,vx:Math.cos(jugador.angulo)*9,vy:Math.sin(jugador.angulo)*9,vida:75});
        actualizarHUD();
    }
    function terminar(ganado) {
        if(mundo.fin) return;
        mundo.fin=true;
        limpiarEstadoJuego();
        if(ganado) completarMinijuego(`¡Operación cumplida! Neutralizaste ${mundo.bajas} hostiles y sobreviviste al combate.`);
        else {
            penalizarFalloMinijuego("La unidad federal fue superada");
            resultadoMinijuego.textContent="La unidad fue superada. Reagrupate, usá las coberturas y volvé a intentarlo.";
            resultadoMinijuego.style.color="#ffb36b";
            const reintentar=document.createElement("button");
            reintentar.className="opcion-minijuego"; reintentar.textContent="Reintentar operación";
            reintentar.addEventListener("click",()=>{penalizacionFalloAplicada=false;areaJuegoMinijuego.innerHTML="";resultadoMinijuego.textContent="";iniciarGaleriaTiro();});
            areaJuegoMinijuego.appendChild(reintentar);
        }
    }
    function circulo(x,y,r,color) { g.fillStyle=color; g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fill(); }

    function actualizar() {
        if(mundo.fin) return;
        mundo.tiempo++;
        if(mundo.invulnerable>0) mundo.invulnerable--;
        if(mundo.vida<=0){terminar(false);return;}
        let dx=0,dy=0;
        if(teclas.w||teclas.arrowup)dy--;
        if(teclas.s||teclas.arrowdown)dy++;
        if(teclas.a||teclas.arrowleft)dx--;
        if(teclas.d||teclas.arrowright)dx++;
        const largo=Math.hypot(dx,dy)||1; dx=dx/largo*jugador.velocidad; dy=dy/largo*jugador.velocidad;
        if(libre(jugador.x+dx,jugador.y, jugador.r)) jugador.x+=dx;
        if(libre(jugador.x,jugador.y+dy, jugador.r)) jugador.y+=dy;
        jugador.angulo=Math.atan2(mouse.y-jugador.y,mouse.x-jugador.x);

        if(mundo.tiempo-ultimoSpawn>300 && enemigos.length<4+mundo.oleada){crearEnemigo();ultimoSpawn=mundo.tiempo;}
        enemigos.forEach((e,idx)=>{
            const vx=jugador.x-e.x, vy=jugador.y-e.y, dist=Math.hypot(vx,vy)||1;
            if(dist>145){const ex=vx/dist*e.vel,ey=vy/dist*e.vel;if(lineaLibre(e.x,e.y,jugador.x,jugador.y)){if(libre(e.x+ex,e.y,e.r))e.x+=ex;if(libre(e.x,e.y+ey,e.r))e.y+=ey;}}
            e.disparo--;
            if(e.disparo<=0&&dist<440&&lineaLibre(e.x,e.y,jugador.x,jugador.y)){
                balasEnemigas.push({x:e.x,y:e.y,vx:vx/dist*3.1,vy:vy/dist*3.1,vida:150});e.disparo=75+Math.random()*55;
            }
        });
        for(let i=balasJugador.length-1;i>=0;i--){const b=balasJugador[i];b.x+=b.vx;b.y+=b.vy;b.vida--;
            if(b.vida<=0||b.x<0||b.y<0||b.x>900||b.y>500||obstaculos.some(o=>b.x>o.x&&b.x<o.x+o.w&&b.y>o.y&&b.y<o.y+o.h)){balasJugador.splice(i,1);continue;}
            const hit=enemigos.findIndex(e=>Math.hypot(e.x-b.x,e.y-b.y)<e.r+4);
            if(hit>=0){
                const objetivo=enemigos[hit]; objetivo.vida--; objetivo.parpadeo=9;
                for(let n=0;n<7;n++){const a=Math.random()*Math.PI*2,v=1+Math.random()*2.8;particulas.push({x:b.x,y:b.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,vida:14+Math.random()*10,color:n%2?'#e9c17b':'#f4e6c3'});}
                balasJugador.splice(i,1);
                if(objetivo.vida<=0){for(let n=0;n<15;n++){const a=Math.random()*Math.PI*2,v=.8+Math.random()*3;particulas.push({x:objetivo.x,y:objetivo.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,vida:20+Math.random()*16,color:n%3?'#a78b5b':'#d6c18c'});}enemigos.splice(hit,1);mundo.bajas++;if(mundo.bajas%4===0)mundo.oleada++;if(mundo.bajas>=mundo.objetivo){terminar(true);return;}}}
        }
        for(let i=balasEnemigas.length-1;i>=0;i--){const b=balasEnemigas[i];b.x+=b.vx;b.y+=b.vy;b.vida--;
            if(b.vida<=0||b.x<0||b.y<0||b.x>900||b.y>500||obstaculos.some(o=>b.x>o.x&&b.x<o.x+o.w&&b.y>o.y&&b.y<o.y+o.h)){balasEnemigas.splice(i,1);continue;}
            if(Math.hypot(jugador.x-b.x,jugador.y-b.y)<jugador.r+4&&mundo.invulnerable===0){mundo.vida-=14;mundo.invulnerable=38;balasEnemigas.splice(i,1);actualizarHUD();}
        }
        for(let i=particulas.length-1;i>=0;i--){const p=particulas[i];p.x+=p.vx;p.y+=p.vy;p.vx*=.94;p.vy*=.94;p.vida--;if(p.vida<=0)particulas.splice(i,1);}
        if(mundo.tiempo%12===0)actualizarHUD();
    }
    function trazo(x1,y1,x2,y2,color,grosor=1){g.strokeStyle=color;g.lineWidth=grosor;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();}
    function soldado(x,y,angulo,enemigo=false,parpadeo=0,indice=0){
        g.save();g.translate(x,y);g.rotate(angulo);
        const paso=Math.sin(mundo.tiempo*.22+indice)*2.5;
        // sombra suave y botas animadas
        g.fillStyle='rgba(8,12,10,.34)';g.beginPath();g.ellipse(0,10,19,11,0,0,Math.PI*2);g.fill();
        g.fillStyle='#29251d';g.fillRect(-9,-1+paso,7,13);g.fillRect(3,-1-paso,7,13);
        g.fillStyle='#5b4630';g.fillRect(-10,8+paso,9,5);g.fillRect(2,8-paso,10,5);
        // pantalón y chaqueta de época
        // El jugador viste divisa federal punzó; los adversarios llevan uniforme celeste unitario.
        const pantalon = enemigo ? '#777b70' : '#493b32';
        const chaqueta = enemigo ? '#526d7a' : '#8e3030';
        const ribete = enemigo ? '#9bb4b8' : '#d9a35f';
        g.fillStyle=parpadeo>0?'#fff1c4':pantalon;
        g.beginPath();g.moveTo(-10,-5);g.lineTo(10,-5);g.lineTo(12,7);g.lineTo(-11,7);g.closePath();g.fill();
        g.fillStyle=chaqueta;g.fillRect(-11,-13,22,17);
        g.fillStyle=ribete;g.fillRect(-9,-12,18,3);
        g.fillStyle=enemigo?'#d2d0b9':'#e3c17d';g.fillRect(-2,-11,4,14);g.fillRect(-10,-3,20,2);
        // correaje cruzado, cartuchera y cuello
        trazo(-7,-10,7,1,'#c2a16a',2);g.fillStyle='#30291e';g.fillRect(7,-4,5,7);
        g.fillStyle='#d2b78b';g.beginPath();g.arc(0,-17,7,0,Math.PI*2);g.fill();
        g.fillStyle=enemigo?'#577887':'#922d2d';g.beginPath();g.arc(0,-19,8,Math.PI,Math.PI*2);g.fill();
        g.fillStyle=enemigo?'#263e4a':'#6e2023';g.fillRect(-7,-21,14,3);g.fillRect(-2,-26,4,5);
        // fusil y bayoneta
        g.fillStyle='#29251e';g.fillRect(7,-4,24,4);g.fillStyle='#8d6840';g.fillRect(12,-3,9,2);
        trazo(28,-2,36,-2,'#b8b4a2',1);g.fillStyle='#181a17';g.fillRect(5,-5,5,6);
        if(enemigo){g.fillStyle='#b9a16d';g.fillRect(-5,-25,10,2);}
        g.restore();
    }
    function dibujarCobertura(o){
        g.save();g.fillStyle='rgba(10,12,9,.38)';g.fillRect(o.x+7,o.y+9,o.w,o.h);
        const grad=g.createLinearGradient(o.x,o.y,o.x,o.y+o.h);grad.addColorStop(0,'#a98a58');grad.addColorStop(.48,'#755b3b');grad.addColorStop(1,'#493b2b');
        g.fillStyle=grad;g.fillRect(o.x,o.y,o.w,o.h);g.strokeStyle='#30291f';g.lineWidth=4;g.strokeRect(o.x,o.y,o.w,o.h);
        g.fillStyle='#c6a875';g.fillRect(o.x+4,o.y+4,o.w-8,5);g.fillStyle='rgba(35,27,19,.45)';
        for(let x=o.x+13;x<o.x+o.w-5;x+=22){g.fillRect(x,o.y+13,3,o.h-20);}
        trazo(o.x+8,o.y+o.h-8,o.x+o.w-8,o.y+8,'rgba(37,29,21,.55)',3);
        g.fillStyle='#d1b17a';g.fillRect(o.x+8,o.y+o.h-11,5,3);g.fillRect(o.x+o.w-15,o.y+8,5,3);g.restore();
    }
    function dibujar() {
        g.clearRect(0,0,900,500);
        // terreno de campaña: tierra, huellas, vegetación y cuadrícula cartográfica tenue
        const suelo=g.createLinearGradient(0,0,900,500);suelo.addColorStop(0,'#596047');suelo.addColorStop(.5,'#454d39');suelo.addColorStop(1,'#343e32');g.fillStyle=suelo;g.fillRect(0,0,900,500);
        g.fillStyle='rgba(205,184,128,.07)';for(let i=0;i<decoracion.length;i++){const d=decoracion[i];g.beginPath();g.ellipse(d.x,d.y,d.r*2,d.r,((i%7)*.3),0,Math.PI*2);g.fill();}
        g.strokeStyle='rgba(225,210,164,.075)';g.lineWidth=1;for(let x=20;x<900;x+=40){trazo(x,0,x,500,'rgba(225,210,164,.075)');}for(let y=20;y<500;y+=40){trazo(0,y,900,y,'rgba(225,210,164,.075)');}
        // senderos de barro y parapetos
        g.strokeStyle='rgba(25,29,22,.22)';g.lineWidth=28;g.beginPath();g.moveTo(0,250);g.bezierCurveTo(210,190,340,300,520,250);g.bezierCurveTo(680,210,770,290,900,245);g.stroke();
        g.strokeStyle='rgba(190,166,112,.12)';g.lineWidth=2;g.beginPath();g.moveTo(0,250);g.bezierCurveTo(210,190,340,300,520,250);g.bezierCurveTo(680,210,770,290,900,245);g.stroke();
        // detalles periféricos: sacos, barriles, estacas y señales
        for(const [x,y] of [[48,72],[90,420],[825,80],[842,420]]){g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(x+3,y+7,20,10,0,0,7);g.fill();g.fillStyle='#8b805d';g.beginPath();g.ellipse(x,y,18,9,0,0,7);g.fill();g.strokeStyle='#b4a27a';g.stroke();trazo(x-10,y,x+10,y,'rgba(48,43,31,.5)',2);}
        // pequeños matorrales ilustrados
        for(const [x,y] of [[165,55],[390,445],[760,185],[570,55],[110,300]]){g.fillStyle='#293b2c';g.beginPath();g.arc(x,y,12,0,7);g.arc(x+9,y-4,9,0,7);g.arc(x-8,y-5,8,0,7);g.fill();g.fillStyle='#758052';g.beginPath();g.arc(x-3,y-7,4,0,7);g.fill();}
        obstaculos.forEach(dibujarCobertura);
        // chispas e impactos breves
        particulas.forEach(p=>{g.globalAlpha=Math.min(1,p.vida/12);circulo(p.x,p.y,Math.max(1.2,p.vida/8),p.color);});g.globalAlpha=1;
        // trazadoras y proyectiles
        balasJugador.forEach(b=>{trazo(b.x-b.vx*1.7,b.y-b.vy*1.7,b.x,b.y,'rgba(255,222,145,.65)',3);circulo(b.x,b.y,3.5,'#fff1bd');});
        balasEnemigas.forEach(b=>{trazo(b.x-b.vx*1.5,b.y-b.vy*1.5,b.x,b.y,'rgba(255,99,74,.6)',3);circulo(b.x,b.y,3.5,'#ffad7b');});
        enemigos.forEach((e,i)=>soldado(e.x,e.y,Math.atan2(jugador.y-e.y,jugador.x-e.x),true,e.parpadeo,i));
        // combatiente aliado
        if(mundo.invulnerable===0||Math.floor(mundo.invulnerable/4)%2===0)soldado(jugador.x,jugador.y,jugador.angulo,false,0,0);
        // destello de boca del fusil y humo
        if(destelloDisparo>0){const fx=jugador.x+Math.cos(jugador.angulo)*43,fy=jugador.y+Math.sin(jugador.angulo)*43;g.save();g.translate(fx,fy);g.rotate(jugador.angulo);g.fillStyle='#fff0b2';g.beginPath();g.moveTo(0,0);g.lineTo(17,-7);g.lineTo(11,0);g.lineTo(17,7);g.closePath();g.fill();g.fillStyle='rgba(255,178,76,.35)';g.beginPath();g.arc(-5,0,11,0,7);g.fill();g.restore();destelloDisparo--;}
        // viñeta, marco de visor y retícula
        const vi=g.createRadialGradient(450,250,170,450,250,570);vi.addColorStop(0,'rgba(0,0,0,0)');vi.addColorStop(1,'rgba(10,14,12,.48)');g.fillStyle=vi;g.fillRect(0,0,900,500);
        g.strokeStyle='rgba(231,211,165,.35)';g.lineWidth=2;g.strokeRect(8,8,884,484);
        g.strokeStyle='rgba(255,235,185,.85)';g.lineWidth=1.5;g.beginPath();g.arc(mouse.x,mouse.y,11,0,Math.PI*2);g.moveTo(mouse.x-19,mouse.y);g.lineTo(mouse.x-7,mouse.y);g.moveTo(mouse.x+7,mouse.y);g.lineTo(mouse.x+19,mouse.y);g.moveTo(mouse.x,mouse.y-19);g.lineTo(mouse.x,mouse.y-7);g.moveTo(mouse.x,mouse.y+7);g.lineTo(mouse.x,mouse.y+19);g.stroke();
    }
    function bucle(){actualizar();dibujar();if(!mundo.fin)animacionTiro=requestAnimationFrame(bucle);}
    function coordenadas(e){const r=canvasTiro.getBoundingClientRect();mouse.x=(e.clientX-r.left)*900/r.width;mouse.y=(e.clientY-r.top)*500/r.height;}
    canvasTiro.addEventListener("pointermove",coordenadas);
    canvasTiro.addEventListener("pointerdown",e=>{coordenadas(e);disparar();});
    const teclado=e=>{const k=e.key.toLowerCase();if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright","r"].includes(k)){e.preventDefault();e.stopImmediatePropagation();if(k==="r")recargar();else teclas[k]=true;}};
    const soltar=e=>{const k=e.key.toLowerCase();if(k in teclas)teclas[k]=false;};
    document.addEventListener("keydown",teclado,true);document.addEventListener("keyup",soltar,true);manejadoresTiro={teclado,soltar};
    actualizarHUD();bucle();
}


function finalizarTiro() {

    limpiarEstadoJuego();

    resultadoMinijuego.textContent =
        "La práctica terminó. Necesitás 5 aciertos; reintentá y cuidá la munición.";

    resultadoMinijuego.style.color = "#ffb36b";

    const botonReintentar = document.createElement("button");

    botonReintentar.type = "button";
    botonReintentar.className = "opcion-minijuego";
    botonReintentar.textContent = "Repetir práctica";
    botonReintentar.addEventListener("click", () => {

        areaJuegoMinijuego.innerHTML = "";
        resultadoMinijuego.textContent = "";
        iniciarGaleriaTiro();

    });

    areaJuegoMinijuego.appendChild(botonReintentar);

}


function iniciarClasificacion(juego) {

    // La misión conserva su objetivo original: distinguir ideas federales y unitarias.
    // Se amplía a tres tandas con pistas contextuales y orden aleatorio.
    const tarjetasBase = [
        { texto: "Cada provincia debe conservar sus propias autoridades y decidir sobre sus asuntos internos.", bando: "federal", pista: "Autonomía provincial", detalle: "La propuesta federal defendía la autonomía de las provincias." },
        { texto: "Las decisiones políticas principales deben concentrarse en un gobierno nacional con sede en la capital.", bando: "unitario", pista: "Poder central", detalle: "El unitarismo proponía un poder central fuerte." },
        { texto: "Las provincias pueden establecer acuerdos y pactos para organizar sus relaciones.", bando: "federal", pista: "Pactos interprovinciales", detalle: "Los pactos eran una herramienta de coordinación entre provincias." },
        { texto: "Un gobierno central debe dirigir de manera uniforme la organización política del territorio.", bando: "unitario", pista: "Organización centralizada", detalle: "La centralización era una característica del proyecto unitario." },
        { texto: "Los gobiernos provinciales deben tener participación y capacidad de decisión frente al poder nacional.", bando: "federal", pista: "Participación provincial", detalle: "El federalismo buscaba limitar la concentración del poder." },
        { texto: "La autoridad nacional debe prevalecer sobre las decisiones de los gobiernos provinciales.", bando: "unitario", pista: "Primacía nacional", detalle: "La propuesta unitaria daba mayor peso al gobierno central." },
        { texto: "La organización del país debe reconocer las particularidades e intereses de cada provincia.", bando: "federal", pista: "Intereses locales", detalle: "El federalismo contemplaba la diversidad de intereses provinciales." },
        { texto: "Las provincias deben quedar subordinadas a una estructura política nacional unificada.", bando: "unitario", pista: "Unidad de mando", detalle: "La subordinación provincial se relaciona con la centralización unitaria." },
        { texto: "Los acuerdos entre jurisdicciones permiten resolver asuntos comunes sin eliminar sus autonomías.", bando: "federal", pista: "Acuerdos entre provincias", detalle: "La cooperación no implicaba renunciar a la autonomía provincial." },
        { texto: "La administración y las decisiones estratégicas deben depender de una autoridad central.", bando: "unitario", pista: "Administración central", detalle: "La autoridad centralizada es propia del ideario unitario." },
        { texto: "Cada provincia debe conservar sus instituciones locales dentro de una organización común.", bando: "federal", pista: "Instituciones provinciales", detalle: "El federalismo proponía una unión que respetara instituciones provinciales." },
        { texto: "La unidad política requiere reducir la autonomía de los gobiernos provinciales.", bando: "unitario", pista: "Menor autonomía", detalle: "Reducir la autonomía provincial favorece un modelo centralizado." }
    ];
    const mezclar = lista => [...lista].sort(() => Math.random() - 0.5);
    const tarjetas = mezclar((juego.tarjetas?.length >= 10 ? juego.tarjetas : tarjetasBase).map((t, i) => ({
        ...tarjetasBase[i % tarjetasBase.length], ...t
    })));
    const total = tarjetas.length;
    const erroresMaximos = 3;
    let indice = 0, aciertos = 0, errores = 0, segundos = 80, racha = 0, bloqueado = false;

    areaJuegoMinijuego.dataset.escena = "clasificacion";
    areaJuegoMinijuego.innerHTML = "";

    const panel = document.createElement("section");
    panel.className = "clasificacion-panel";
    panel.setAttribute("aria-label", "Mesa de clasificación de mensajes históricos");

    const encabezado = document.createElement("div");
    encabezado.className = "clasificacion-encabezado";
    encabezado.innerHTML = '<span class="clasificacion-sobrelinea">CENTRO DE INTELIGENCIA · 1828</span><h3>CLASIFICACIÓN DE MENSAJES</h3><p>Leé cada informe y archivá la idea en la columna correspondiente.</p>';

    const estado = document.createElement("div");
    estado.className = "clasificacion-estado";
    const progreso = document.createElement("div");
    progreso.className = "clasificacion-progreso";
    const barra = document.createElement("span");
    progreso.appendChild(barra);
    const datos = document.createElement("div");
    datos.className = "clasificacion-datos";

    const tarjeta = document.createElement("article");
    tarjeta.className = "tarjeta-clasificacion";
    const sello = document.createElement("span");
    sello.className = "sello-clasificacion";
    sello.setAttribute("aria-hidden", "true");
    const contenido = document.createElement("div");
    contenido.className = "clasificacion-contenido";
    const folio = document.createElement("small");
    folio.className = "clasificacion-folio";
    folio.textContent = "DOCUMENTO CONFIDENCIAL";
    const texto = document.createElement("p");
    texto.className = "texto-tarjeta-clasificacion";
    const pista = document.createElement("span");
    pista.className = "clasificacion-pista";
    contenido.append(folio, texto, pista);
    tarjeta.append(sello, contenido);

    const columnas = document.createElement("div");
    columnas.className = "columnas-bando";
    const federal = crearBotonBando("FEDERAL", "federal", "Autonomía provincial");
    const unitario = crearBotonBando("UNITARIO", "unitario", "Gobierno central");

    function crearBotonBando(titulo, bando, subtitulo) {
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = `boton-bando boton-${bando}`;
        boton.innerHTML = `<strong>${titulo}</strong><small>${subtitulo}</small>`;
        boton.addEventListener("click", () => clasificar(bando));
        return boton;
    }

    function actualizarEstado() {
        datos.innerHTML = `<span>INFORMES <b>${aciertos}/${total}</b></span><span>ERRORES <b>${errores}/${erroresMaximos}</b></span><span>TIEMPO <b>${segundos}s</b></span><span>RACHA <b>x${racha}</b></span>`;
        barra.style.width = `${(aciertos / total) * 100}%`;
        progreso.setAttribute("aria-valuenow", String(aciertos));
    }

    function mostrarTarjeta() {
        bloqueado = false;
        const actual = tarjetas[indice];
        folio.textContent = `DOCUMENTO ${String(indice + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
        texto.textContent = `“${actual.texto}”`;
        pista.textContent = `PISTA DE LECTURA: ${actual.pista || "Analizá dónde se concentra la autoridad"}`;
        actualizarEstado();
        federal.disabled = false;
        unitario.disabled = false;
    }

    function finalizarDerrota(motivo) {
        if (respuestaCorrecta) return;
        penalizarFalloMinijuego(motivo);
        limpiarEstadoJuego();
        federal.disabled = true;
        unitario.disabled = true;
        tarjeta.classList.add("clasificacion-derrota");
        resultadoMinijuego.textContent = `${motivo} Los informes quedaron sin clasificar.`;
        resultadoMinijuego.style.color = "#ffb36b";
        const retry = document.createElement("button");
        retry.type = "button";
        retry.className = "opcion-minijuego";
        retry.textContent = "Reintentar misión";
        retry.addEventListener("click", () => {
            penalizacionFalloAplicada = false;
            areaJuegoMinijuego.innerHTML = "";
            resultadoMinijuego.textContent = "";
            iniciarClasificacion(juego);
        });
        areaJuegoMinijuego.appendChild(retry);
    }

    function clasificar(bando) {
        if (respuestaCorrecta || bloqueado) return;
        const actual = tarjetas[indice];
        if (bando !== actual.bando) {
            errores++;
            racha = 0;
            bloqueado = true;
            tarjeta.classList.remove("tarjeta-correcta");
            tarjeta.classList.add("tarjeta-error");
            resultadoMinijuego.textContent = `No coincide. ${actual.detalle || "Revisá la diferencia entre autonomía provincial y poder central."}`;
            resultadoMinijuego.style.color = "#ffb36b";
            actualizarEstado();
            if (errores >= erroresMaximos) {
                window.setTimeout(() => finalizarDerrota("Se agotaron las oportunidades."), 550);
                return;
            }
            window.setTimeout(() => {
                tarjeta.classList.remove("tarjeta-error");
                bloqueado = false;
            }, 650);
            return;
        }
        aciertos++;
        racha++;
        bloqueado = true;
        tarjeta.classList.remove("tarjeta-error");
        tarjeta.classList.add("tarjeta-correcta");
        resultadoMinijuego.textContent = `¡Informe archivado! ${actual.detalle || "Clasificación correcta."}`;
        resultadoMinijuego.style.color = "#b7d77b";
        actualizarEstado();
        federal.disabled = true;
        unitario.disabled = true;
        if (indice === total - 1) {
            window.setTimeout(() => completarMinijuego(`¡Expediente completo! Clasificaste ${total} informes. Reconociste las diferencias entre el proyecto federal, basado en la autonomía provincial, y el unitario, de organización centralizada.`), 450);
            return;
        }
        indice++;
        window.setTimeout(() => {
            tarjeta.classList.remove("tarjeta-correcta");
            mostrarTarjeta();
        }, 520);
    }

    estado.append(datos, progreso);
    columnas.append(federal, unitario);
    panel.append(encabezado, estado, tarjeta, columnas);
    areaJuegoMinijuego.appendChild(panel);
    mostrarTarjeta();

    temporizadorTiro = window.setInterval(() => {
        if (respuestaCorrecta) return;
        segundos--;
        actualizarEstado();
        if (segundos <= 0) finalizarDerrota("Se agotó el tiempo de la operación.");
    }, 1000);
}


function iniciarSigilo() {

    // Mapa ampliado: 15 columnas x 11 filas, con varios corredores y zonas de cobertura.
    const mapaSigilo = [
        "...............",
        ".##....#....##.",
        "...............",
        "...#.....#.....",
        "...#.....#.....",
        "...............",
        ".....#.#.......",
        ".....#.#..##...",
        "...............",
        ".##....#....##.",
        "..............."
    ];

    const matorrales = new Set(["1,1", "6,2", "12,2", "2,5", "10,5", "4,8", "12,8", "1,9", "13,9"]);
    // Rutas cerradas, con tramos horizontales y verticales; todas pisan suelo libre.
    const rutaGuardiaUno = [
        [2,2],[3,2],[4,2],[5,2],[5,3],[5,4],[5,5],[4,5],[3,5],[2,5],[2,4],[2,3]
    ];
    const rutaGuardiaDos = [
        [9,8],[10,8],[11,8],[12,8],[12,7],[12,6],[12,5],[11,5],[10,5],[9,5],[9,6],[9,7]
    ];
    let jugador = { x: 0, y: 10 };
    let guardias = [0, 0];
    let guardiaTeTieneEnVista = false;
    let alertas = 0;
    let turnos = 0;
    let tieneDespacho = false;
    let pistasRecogidas = new Set();
    const ubicacionesPistas = ["2,2", "12,8"];
    let fallido = false;

    const briefing = document.createElement("div");
    briefing.className = "sigilo-briefing";
    briefing.innerHTML = `
        <div class="sigilo-briefing-icon">⌖</div>
        <div><strong>OPERACIÓN: SOMBRA DEL DESPACHO</strong>
        <span>Explorá el pueblo, recuperá las 2 pistas, encontrá el documento y escapá por la posta. Los guardias solo pueden verte si tienen línea de visión directa: las paredes bloquean completamente su mirada. Usá los matorrales como cobertura y aprovechá los pasillos laterales.</span></div>
    `;

    const tablero = document.createElement("div");
    tablero.className = "tablero-sigilo";
    tablero.style.gridTemplateColumns = `repeat(${mapaSigilo[0].length}, minmax(22px, 38px))`;
    tablero.setAttribute("role", "grid");
    tablero.setAttribute("aria-label", "Pueblo vigilado");
    areaJuegoMinijuego.dataset.escena = "sigilo";

    const marcador = document.createElement("p");
    marcador.className = "marcador-reto";

    const leyenda = document.createElement("div");
    leyenda.className = "leyenda-sigilo";
    leyenda.innerHTML = `
        <span><i class="leyenda-agente">A</i> AGENTE</span>
        <span><i class="leyenda-guardia">G</i> PATRULLA</span>
        <span><i class="leyenda-despacho">D</i> DESPACHO</span>
        <span><i class="leyenda-matorral"></i> COBERTURA</span>
        <span><i class="leyenda-salida">S</i> SALIDA</span>
    `;

    function actualizarMarcador() {

        const objetivo = tieneDespacho ? "Documento recuperado" : `${pistasRecogidas.size}/2 pistas · ${tieneDespacho ? "Documento" : "Buscar despacho"}`;
        marcador.innerHTML = `
            <span class="sigilo-stat"><small>ALERTA</small><strong>${alertas}<i>/4</i></strong></span>
            <span class="sigilo-stat"><small>MOVIMIENTOS</small><strong>${turnos}<i>/70</i></strong></span>
            <span class="sigilo-stat sigilo-objetivo"><small>OBJETIVO</small><strong>${objetivo}</strong></span>
        `;
        marcador.dataset.alertas = String(alertas);
        marcador.dataset.turnos = String(turnos);
        marcador.dataset.despacho = tieneDespacho ? "recuperado" : "pendiente";
        marcador.style.setProperty(
            "--avance",
            `${(alertas / 4) * 100}%`
        );

    }

    function renderizar() {

        tablero.innerHTML = "";

        mapaSigilo.forEach((fila, y) => {

            [...fila].forEach((celda, x) => {

                const casilla = document.createElement("div");
                casilla.className = "casilla-sigilo";

                if (celda === "#") {

                    casilla.classList.add("sigilo-muro");

                } else {

                    casilla.classList.add("sigilo-suelo");

                }

                if (matorrales.has(`${x},${y}`)) {

                    casilla.classList.add("sigilo-cobertura");
                    casilla.setAttribute("aria-label", "Matorral: cobertura");

                }

                if (ubicacionesPistas.includes(`${x},${y}`) && !pistasRecogidas.has(`${x},${y}`)) {
                    casilla.classList.add("sigilo-pista");
                    casilla.setAttribute("aria-label", "Pista documental");
                    const pista = document.createElement("span");
                    pista.className = "sigilo-pista-icon";
                    pista.textContent = "✦";
                    casilla.appendChild(pista);
                }

                if (x === 7 && y === 5 && pistasRecogidas.size === 2 && !tieneDespacho) {
                    casilla.classList.add("sigilo-despacho");
                    casilla.setAttribute("aria-label", "Despacho secreto");
                }

                const guardiaEnCasilla = guardias.findIndex((indice, numero) => {

                    const ruta = numero === 0 ? rutaGuardiaUno : rutaGuardiaDos;
                    return ruta[indice][0] === x && ruta[indice][1] === y;

                });

                if (guardiaEnCasilla !== -1) {

                    casilla.classList.add("sigilo-guardia");
                    casilla.setAttribute("aria-label", "Guardia de patrulla");
                    casilla.appendChild(
                        crearSpriteMinijuego(
                            guardiaEnCasilla === 0
                                ? "guardia"
                                : "guardia-secundario",
                            "Guardia de patrulla"
                        )
                    );

                }

                if (x === 14 && y === 0) {

                    casilla.classList.add("sigilo-salida");
                    casilla.setAttribute("aria-label", "Salida del pueblo");
                    const salida = document.createElement("span");
                    salida.className = "sprite-posta";
                    salida.setAttribute("aria-label", "Salida del pueblo");
                    salida.setAttribute("role", "img");
                    casilla.appendChild(salida);

                }

                if (jugador.x === x && jugador.y === y) {

                    casilla.classList.add("sigilo-jugador");
                    casilla.setAttribute("aria-label", "Agente infiltrado");
                    casilla.appendChild(
                        crearSpriteMinijuego("mensajero", "Agente infiltrado")
                    );

                }

                tablero.appendChild(casilla);

            });

        });

    }

    function reiniciarSigilo() {

        jugador = { x: 0, y: 10 };
        guardias = [0, 0];
        guardiaTeTieneEnVista = false;
        alertas = 0;
        turnos = 0;
        tieneDespacho = false;
        pistasRecogidas = new Set();
        fallido = false;
        resultadoMinijuego.textContent = "";
        areaJuegoMinijuego.querySelector(".boton-reintentar-sigilo")?.remove();
        actualizarMarcador();
        renderizar();

    }

    function fallarSigilo() {

        fallido = true;
        penalizarFalloMinijuego("Los guardias te descubrieron en el minijuego");

        resultadoMinijuego.textContent =
            "Te descubrieron. Volvé a empezar y usá los matorrales como cobertura.";

        resultadoMinijuego.style.color = "#ffb36b";

        const botonReintentar = document.createElement("button");
        botonReintentar.type = "button";
        botonReintentar.className = "opcion-minijuego boton-reintentar-sigilo";
        botonReintentar.textContent = "Reintentar infiltración";
        botonReintentar.addEventListener("click", reiniciarSigilo);
        areaJuegoMinijuego.appendChild(botonReintentar);

    }

    function mover(dx, dy) {

        if (respuestaCorrecta || fallido) return;

        const x = jugador.x + dx;
        const y = jugador.y + dy;

        if (
            y < 0 ||
            y >= mapaSigilo.length ||
            x < 0 ||
            x >= mapaSigilo[y].length ||
            mapaSigilo[y][x] === "#"
        ) {

            return;

        }

        jugador = { x, y };
        turnos++;

        const posicion = `${jugador.x},${jugador.y}`;
        if (ubicacionesPistas.includes(posicion) && !pistasRecogidas.has(posicion)) {
            pistasRecogidas.add(posicion);
            resultadoMinijuego.textContent = `Pista recuperada (${pistasRecogidas.size}/2). ${pistasRecogidas.size === 2 ? "¡Ahora buscá el despacho!" : "Encontrá la segunda pista."}`;
            resultadoMinijuego.style.color = "#b8e4bd";
        }

        if (jugador.x === 7 && jugador.y === 5 && pistasRecogidas.size === 2) {
            tieneDespacho = true;
            resultadoMinijuego.textContent = "Documento recuperado. ¡Llegá a la posta para escapar!";
            resultadoMinijuego.style.color = "#f2d38a";
        } else if (jugador.x === 7 && jugador.y === 5 && pistasRecogidas.size < 2) {
            resultadoMinijuego.textContent = "El despacho está cerrado. Primero necesitás las dos pistas.";
            resultadoMinijuego.style.color = "#ffcf8b";
        }

        guardias = guardias.map((indice, numero) => {

            const ruta =
                numero === 0 ? rutaGuardiaUno : rutaGuardiaDos;

            return (indice + 1) % ruta.length;

        });

        const oculto = matorrales.has(`${jugador.x},${jugador.y}`);
        function tieneLineaDeVision(origenX, origenY, destinoX, destinoY) {
            // Muestreo de la recta: cualquier muro intermedio corta la visión.
            const pasos = Math.max(Math.abs(destinoX - origenX), Math.abs(destinoY - origenY)) * 4;
            for (let paso = 1; paso < pasos; paso++) {
                const t = paso / pasos;
                const cx = Math.round(origenX + (destinoX - origenX) * t);
                const cy = Math.round(origenY + (destinoY - origenY) * t);
                if (cx === destinoX && cy === destinoY) break;
                if (mapaSigilo[cy]?.[cx] === "#") return false;
            }
            return true;
        }
        const detectado = guardias.some((indice, numero) => {
            if (oculto) return false;
            const ruta = numero === 0 ? rutaGuardiaUno : rutaGuardiaDos;
            const [guardiaX, guardiaY] = ruta[indice];
            const distancia = Math.hypot(guardiaX - jugador.x, guardiaY - jugador.y);
            // Detección corta, frontal y siempre con visión despejada.
            if (distancia > 2.35 || !tieneLineaDeVision(guardiaX, guardiaY, jugador.x, jugador.y)) return false;
            const anterior = ruta[(indice - 1 + ruta.length) % ruta.length];
            const siguiente = ruta[(indice + 1) % ruta.length];
            const vx = siguiente[0] - anterior[0];
            const vy = siguiente[1] - anterior[1];
            const px = jugador.x - guardiaX;
            const py = jugador.y - guardiaY;
            const producto = vx * px + vy * py;
            const magnitud = Math.hypot(vx, vy) * Math.max(1, distancia);
            const frontal = distancia <= 1.15 || producto / magnitud >= 0.25;
            return frontal;
        });

        // Una alerta cuenta como un avistamiento nuevo, no cada turno que el guardia te sigue mirando.
        if (detectado && !guardiaTeTieneEnVista) alertas++;
        guardiaTeTieneEnVista = detectado;

        actualizarMarcador();
        renderizar();

        if (alertas >= 4 || turnos >= 70) {

            fallarSigilo();

            return;

        }

        if (tieneDespacho && jugador.x === 14 && jugador.y === 0) {

            completarMinijuego(
                `¡Despacho recuperado y salida alcanzada en ${turnos} turnos con ${alertas} alertas!`
            );

        }

    }

    areaJuegoMinijuego.append(briefing, marcador, leyenda, tablero);
    actualizarMarcador();
    renderizar();

    const movimientos = {
        arrowup: [0, -1], w: [0, -1],
        arrowleft: [-1, 0], a: [-1, 0],
        arrowdown: [0, 1], s: [0, 1],
        arrowright: [1, 0], d: [1, 0]
    };

    manejadorTecladoLaberinto = (evento) => {

        const movimiento = movimientos[evento.key.toLowerCase()];

        if (!movimiento) return;

        evento.preventDefault();
        evento.stopImmediatePropagation();
        mover(movimiento[0], movimiento[1]);

    };

    document.addEventListener("keydown", manejadorTecladoLaberinto, true);

    const controles = document.createElement("div");
    controles.className = "controles-laberinto";

    [
        { texto: "↑", dx: 0, dy: -1 },
        { texto: "←", dx: -1, dy: 0 },
        { texto: "↓", dx: 0, dy: 1 },
        { texto: "→", dx: 1, dy: 0 }
    ].forEach(({ texto, dx, dy }) => {

        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "control-laberinto";
        boton.textContent = texto;
        boton.addEventListener("click", () => mover(dx, dy));
        controles.appendChild(boton);

    });

    areaJuegoMinijuego.appendChild(controles);

}


function iniciarArchivo() {

    // El objetivo original se conserva: reconstruir el despacho sobre Facundo.
    // Ahora el expediente está dividido en tres folios temáticos progresivos.
    const expedientes = [
        {
            nombre: "FOLIO I · IDENTIFICACIÓN DE LA OBRA",
            sello: "BIOGRAFÍA",
            pista: "Pista: primero se presenta al autor; después se nombra la obra y su protagonista.",
            piezas: [
                "DOMINGO FAUSTINO SARMIENTO",
                "PUBLICÓ EN 1845 LA OBRA",
                "TITULADA FACUNDO, DONDE RETRATA A",
                "JUAN FACUNDO QUIROGA."
            ]
        },
        {
            nombre: "FOLIO II · CONTEXTO HISTÓRICO",
            sello: "CONTEXTO",
            pista: "Pista: ubicá primero el escenario histórico y luego la tensión política que describe.",
            piezas: [
                "LA OBRA EXAMINA LA REALIDAD",
                "POLÍTICA Y SOCIAL DEL RÍO DE LA PLATA,",
                "MARCADA POR LOS CONFLICTOS ENTRE",
                "UNITARIOS Y FEDERALES."
            ]
        },
        {
            nombre: "FOLIO III · INTERPRETACIÓN",
            sello: "ANÁLISIS",
            pista: "Pista: el cierre explica qué usa Sarmiento para reflexionar sobre el país.",
            piezas: [
                "A TRAVÉS DE LA FIGURA DE QUIROGA,",
                "SARMIENTO CONTRAPONE CIVILIZACIÓN Y BARBARIE",
                "Y PROPONE UNA INTERPRETACIÓN",
                "DE LOS CONFLICTOS DE SU ÉPOCA."
            ]
        }
    ];

    let expedienteActual = 0;
    let ordenSeleccionado = [];
    let erroresArchivo = 0;
    let tiempoArchivo = 110;
    let bloqueado = false;

    const marcador = document.createElement("p");
    marcador.className = "marcador-reto";
    marcador.dataset.progreso = "0";
    marcador.dataset.total = "12";
    marcador.style.setProperty("--avance", "0%");

    const panel = document.createElement("section");
    panel.className = "archivo-panel-mejorado";
    panel.setAttribute("aria-label", "Mesa de reconstrucción de expedientes");

    const cabecera = document.createElement("div");
    cabecera.className = "archivo-cabecera-mejorada";
    const sobrelinea = document.createElement("span");
    sobrelinea.className = "archivo-sobrelinea";
    sobrelinea.textContent = "ARCHIVO CENTRAL · UNIDAD DE DOCUMENTACIÓN";
    const titulo = document.createElement("h3");
    titulo.textContent = "RECONSTRUCCIÓN DE EXPEDIENTES";
    const bajada = document.createElement("p");
    bajada.textContent = "Ordená los folios para recuperar el informe original sobre Facundo.";
    cabecera.append(sobrelinea, titulo, bajada);

    const meta = document.createElement("div");
    meta.className = "archivo-meta-mejorada";
    const nombreFolio = document.createElement("strong");
    const sello = document.createElement("span");
    sello.className = "archivo-sello-mejorado";
    const pista = document.createElement("p");
    pista.className = "archivo-pista-mejorada";
    meta.append(nombreFolio, sello);

    const espacios = document.createElement("div");
    espacios.className = "espacios-archivo";
    const opciones = document.createElement("div");
    opciones.className = "opciones-archivo";
    const pie = document.createElement("p");
    pie.className = "archivo-pie-mejorado";
    pie.textContent = "SELECCIONÁ EL FRAGMENTO QUE CONTINÚA EL DOCUMENTO";

    panel.append(cabecera, meta, pista, espacios, pie, opciones);
    areaJuegoMinijuego.dataset.escena = "archivo";
    areaJuegoMinijuego.append(marcador, panel);

    function mezclar(indices) {
        const copia = [...indices];
        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copia[i], copia[j]] = [copia[j], copia[i]];
        }
        return copia;
    }

    function actualizarMarcador() {
        const totalColocados = expedienteActual * 4 + ordenSeleccionado.length;
        marcador.textContent = `EXPEDIENTE ${expedienteActual + 1}/3 · FOLIOS ${totalColocados}/12 · ERRORES ${erroresArchivo}/5 · ${tiempoArchivo}s`;
        marcador.dataset.progreso = String(totalColocados);
        marcador.style.setProperty("--avance", `${(totalColocados / 12) * 100}%`);
    }

    function terminarPorFallo(motivo) {
        if (bloqueado || respuestaCorrecta) return;
        penalizarFalloMinijuego(motivo);
        bloqueado = true;
        if (temporizadorTiro) window.clearInterval(temporizadorTiro);
        temporizadorTiro = null;
        limpiarEstadoJuego();
        resultadoMinijuego.textContent = motivo;
        resultadoMinijuego.style.color = "#ffb36b";
        const retry = document.createElement("button");
        retry.className = "opcion-minijuego";
        retry.textContent = "REINTENTAR RECONSTRUCCIÓN";
        retry.addEventListener("click", () => {
            penalizacionFalloAplicada = false;
            areaJuegoMinijuego.innerHTML = "";
            resultadoMinijuego.textContent = "";
            iniciarArchivo();
        });
        areaJuegoMinijuego.appendChild(retry);
    }

    function renderizar() {
        const expediente = expedientes[expedienteActual];
        nombreFolio.textContent = expediente.nombre;
        sello.textContent = expediente.sello;
        pista.textContent = expediente.pista;
        actualizarMarcador();
        espacios.innerHTML = "";
        if (!ordenSeleccionado.length) {
            const guia = document.createElement("p");
            guia.className = "archivo-guia";
            guia.textContent = "BORRADOR VACÍO · INICIÁ POR EL PRIMER FOLIO";
            espacios.appendChild(guia);
        }
        ordenSeleccionado.forEach((indice, posicion) => {
            const pieza = document.createElement("div");
            pieza.className = "pieza-colocada";
            const numero = document.createElement("span");
            numero.className = "numero-pieza";
            numero.textContent = String(posicion + 1).padStart(2, "0");
            const texto = document.createElement("span");
            texto.textContent = expediente.piezas[indice];
            pieza.append(numero, texto);
            espacios.appendChild(pieza);
        });

        opciones.innerHTML = "";
        const restantes = mezclar(expediente.piezas.map((_, i) => i).filter(i => !ordenSeleccionado.includes(i)));
        restantes.forEach(indice => {
            const boton = document.createElement("button");
            boton.type = "button";
            boton.className = "pieza-archivo";
            const icono = document.createElement("span");
            icono.className = "icono-pieza-archivo";
            icono.setAttribute("aria-hidden", "true");
            icono.textContent = "✦";
            const texto = document.createElement("span");
            texto.textContent = expediente.piezas[indice];
            boton.append(icono, texto);
            boton.addEventListener("click", () => elegirFragmento(indice, boton));
            opciones.appendChild(boton);
        });
    }

    function elegirFragmento(indice, boton) {
        if (bloqueado || respuestaCorrecta) return;
        const esperado = ordenSeleccionado.length;
        if (indice !== esperado) {
            erroresArchivo++;
            boton.classList.add("archivo-pieza-error");
            resultadoMinijuego.textContent = `Ese fragmento no continúa el texto. Revisá la pista (${erroresArchivo}/5 errores).`;
            resultadoMinijuego.style.color = "#ffb36b";
            actualizarMarcador();
            if (erroresArchivo >= 5) terminarPorFallo("Se agotaron los intentos. El expediente quedó incompleto.");
            return;
        }
        ordenSeleccionado.push(indice);
        resultadoMinijuego.textContent = "Fragmento incorporado al documento.";
        resultadoMinijuego.style.color = "#a9d7a1";
        renderizar();

        if (ordenSeleccionado.length === 4) {
            if (expedienteActual < expedientes.length - 1) {
                expedienteActual++;
                ordenSeleccionado = [];
                resultadoMinijuego.textContent = "Folio validado. Se abrió el siguiente sobre del expediente.";
                renderizar();
            } else {
                bloqueado = true;
                if (temporizadorTiro) window.clearInterval(temporizadorTiro);
                temporizadorTiro = null;
                completarMinijuego("¡Expediente reconstruido! Ordenaste los tres folios: identificación de Facundo, contexto histórico e interpretación de Sarmiento.");
            }
        }
    }

    temporizadorTiro = window.setInterval(() => {
        if (respuestaCorrecta || bloqueado) return;
        tiempoArchivo--;
        actualizarMarcador();
        if (tiempoArchivo <= 0) terminarPorFallo("Se agotó el tiempo. El expediente quedó sin reconstruir.");
    }, 1000);

    renderizar();
}


// ==========================================
// CRUCIGRAMA HISTÓRICO: MISIÓN 5
// ==========================================
function iniciarCrucigrama() {
    limpiarEstadoJuego();
    areaJuegoMinijuego.dataset.escena = "crucigrama";
    const envoltura = document.createElement("section");
    envoltura.className = "crucigrama-juego";
    const encabezado = document.createElement("div");
    encabezado.className = "crucigrama-encabezado";
    encabezado.innerHTML = '<span class="crucigrama-sello">ARCHIVO FEDERAL · EXPEDIENTE 05</span><h3>Palabras de la causa</h3><p>Completá cada palabra usando las pistas. Las respuestas se cruzan en el tablero.</p>';
    envoltura.appendChild(encabezado);

    const filas = 11, columnas = 11;
    const palabras = [
        { palabra: "FEDERAL", fila: 5, columna: 2, direccion: "H", numero: 1, pista: "Bando que defendía la autonomía de las provincias." },
        { palabra: "MENDOZA", fila: 2, columna: 4, direccion: "V", numero: 2, pista: "Provincia cuyana cuyo nombre comienza con M." },
        { palabra: "PEON", fila: 4, columna: 5, direccion: "V", numero: 3, pista: "Trabajador rural que realizaba tareas en el campo." },
        { palabra: "PATRIA", fila: 2, columna: 6, direccion: "V", numero: 4, pista: "Tierra natal o comunidad a la que se pertenece." },
        { palabra: "CABALLO", fila: 4, columna: 7, direccion: "V", numero: 5, pista: "Animal utilizado para viajar y trasladarse en el siglo XIX." }
    ];
    let palabraActiva = palabras[0];
    const posicionesPorPalabra = new Map();
    palabras.forEach(item => {
        const posiciones = [];
        [...item.palabra].forEach((letra, i) => {
            const fila = item.fila + (item.direccion === "V" ? i : 0);
            const columna = item.columna + (item.direccion === "H" ? i : 0);
            posiciones.push(`${fila}-${columna}`);
        });
        posicionesPorPalabra.set(item.numero, posiciones);
    });
    const celdas = new Map();
    palabras.forEach(item => {
        [...item.palabra].forEach((letra, i) => {
            const fila = item.fila + (item.direccion === "V" ? i : 0);
            const columna = item.columna + (item.direccion === "H" ? i : 0);
            const clave = `${fila}-${columna}`;
            if (!celdas.has(clave)) celdas.set(clave, { letra, numero: null });
            const celda = celdas.get(clave);
            celda.letra = letra;
            if (i === 0) celda.numero = item.numero;
        });
    });

    const tablero = document.createElement("div");
    tablero.className = "crucigrama-tablero";
    tablero.style.gridTemplateColumns = `repeat(${columnas}, minmax(22px, 34px))`;
    const entradas = [];
    for (let fila = 0; fila < filas; fila++) {
        for (let columna = 0; columna < columnas; columna++) {
            const clave = `${fila}-${columna}`;
            const dato = celdas.get(clave);
            if (!dato) {
                const vacia = document.createElement("span");
                vacia.className = "crucigrama-vacia";
                tablero.appendChild(vacia);
                continue;
            }
            const celda = document.createElement("label");
            celda.className = "crucigrama-celda";
            if (dato.numero) {
                const numero = document.createElement("small");
                numero.textContent = dato.numero;
                celda.appendChild(numero);
            }
            const input = document.createElement("input");
            input.type = "text";
            input.maxLength = 1;
            input.autocomplete = "off";
            input.spellcheck = false;
            input.setAttribute("aria-label", `Fila ${fila + 1}, columna ${columna + 1}`);
            input.dataset.respuesta = dato.letra;
            input.dataset.posicion = clave;
            // Cada casilla conoce las palabras que la atraviesan. La navegación
            // sigue la dirección de la palabra seleccionada, nunca el orden visual de la fila.
            input.dataset.fila = String(fila);
            input.dataset.columna = String(columna);
            input.addEventListener("focus", () => seleccionarPalabraParaCasilla(input, false));
            input.addEventListener("click", () => seleccionarPalabraParaCasilla(input, true));
            input.addEventListener("input", () => {
                input.value = input.value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-ZÑ]/g, "").slice(-1);
                actualizarProgreso();
                if (input.value) avanzarEnPalabra(input, 1);
            });
            input.addEventListener("keydown", evento => {
                if (evento.key === "Backspace") {
                    if (!input.value) {
                        evento.preventDefault();
                        avanzarEnPalabra(input, -1);
                    }
                } else if (evento.key === "ArrowRight" || evento.key === "ArrowLeft" || evento.key === "ArrowDown" || evento.key === "ArrowUp") {
                    evento.preventDefault();
                    const delta = (evento.key === "ArrowRight" || evento.key === "ArrowDown") ? 1 : -1;
                    avanzarEnPalabra(input, delta);
                }
            });
            entradas.push(input);
            celda.appendChild(input);
            tablero.appendChild(celda);
        }
    }
    envoltura.appendChild(tablero);
    const progreso = document.createElement("div");
    progreso.className = "crucigrama-progreso";
    progreso.innerHTML = '<span>PROGRESO DEL EXPEDIENTE</span><strong>0%</strong><i><b></b></i>';
    envoltura.appendChild(progreso);
    const actualizarProgreso = () => {
        const completas = entradas.filter(input => input.value.trim()).length;
        const porcentaje = Math.round(completas / entradas.length * 100);
        progreso.querySelector("strong").textContent = `${porcentaje}%`;
        progreso.querySelector("b").style.width = `${porcentaje}%`;
    };

    function seleccionarPalabraParaCasilla(input, alternar) {
        const clave = input.dataset.posicion;
        const candidatas = palabras.filter(item => posicionesPorPalabra.get(item.numero).includes(clave));
        if (!candidatas.length) return;
        const elegida = alternar && candidatas.length > 1
            ? candidatas[(candidatas.indexOf(palabraActiva) + 1 + candidatas.length) % candidatas.length]
            : (candidatas.includes(palabraActiva) ? palabraActiva : candidatas[0]);
        palabraActiva = elegida;
        tablero.querySelectorAll(".crucigrama-celda").forEach(c => c.classList.remove("crucigrama-palabra-activa"));
        posicionesPorPalabra.get(palabraActiva.numero).forEach(pos => {
            const campo = tablero.querySelector(`input[data-posicion="${pos}"]`);
            if (campo) campo.parentElement.classList.add("crucigrama-palabra-activa");
        });
    }
    function avanzarEnPalabra(input, direccion) {
        const posiciones = posicionesPorPalabra.get(palabraActiva.numero) || [];
        const indice = posiciones.indexOf(input.dataset.posicion);
        const destino = posiciones[indice + direccion];
        if (!destino) return;
        const siguiente = tablero.querySelector(`input[data-posicion="${destino}"]`);
        if (siguiente) siguiente.focus();
    }

    const pistas = document.createElement("div");
    pistas.className = "crucigrama-pistas";
    const tituloPistas = document.createElement("h4");
    tituloPistas.textContent = "PISTAS DEL EXPEDIENTE";
    pistas.appendChild(tituloPistas);
    palabras.forEach(item => {
        const pista = document.createElement("p");
        pista.innerHTML = `<b>${item.numero}. ${item.direccion === "H" ? "HORIZONTAL" : "VERTICAL"}</b> ${item.pista}`;
        pistas.appendChild(pista);
    });
    envoltura.appendChild(pistas);

    const verificar = document.createElement("button");
    verificar.type = "button";
    verificar.className = "btn-verificar-crucigrama";
    verificar.textContent = "VERIFICAR CRUCIGRAMA";
    verificar.addEventListener("click", () => {
        let correctas = 0;
        entradas.forEach(input => {
            const bien = input.value === input.dataset.respuesta;
            input.classList.toggle("crucigrama-correcta", bien);
            input.classList.toggle("crucigrama-incorrecta", !bien);
            if (bien) correctas++;
        });
        if (correctas === entradas.length) {
            verificar.disabled = true;
            completarMinijuego("¡Crucigrama resuelto! Las palabras clave quedaron recuperadas y el expediente puede continuar hacia Bernabé Gómez.");
        } else {
            resultadoMinijuego.textContent = `Hay ${entradas.length - correctas} casillas por corregir. Revisá las pistas y volvé a intentarlo.`;
            resultadoMinijuego.style.color = "#f0bd75";
        }
    });
    envoltura.appendChild(verificar);
    areaJuegoMinijuego.appendChild(envoltura);
    if (entradas[0]) entradas[0].focus();
}

// ==========================================
// INICIAR MINIJUEGO
// ==========================================

function iniciarMinijuego() {

    if (
        !npcDelMinijuego ||
        npcDelMinijuego.etapa !== etapaMision
    ) {

        return;

    }

    const juego = npcDelMinijuego.minijuego;

    if (!juego) return;

    minijuegoAbierto = true;

    ventanaDialogoNPC.style.display = "none";

    ventanaMinijuego.style.display = "flex";

    tituloMinijuego.textContent =
        `NIVEL ${etapaMision + 1} / ${NPCS_FEDERALES.length} · ${juego.titulo}`;

    opcionesMinijuego.innerHTML = "";

    resultadoMinijuego.textContent = "";

    btnContinuarMinijuego.style.display = "none";

    respuestaCorrecta = false;
    penalizacionFalloAplicada = false;

    limpiarEstadoJuego();
    areaJuegoMinijuego.innerHTML = "";
    areaJuegoMinijuego.style.display = "none";
    opcionesMinijuego.style.display = "flex";

    if (juego.tipo === "laberinto") {

        preguntaMinijuego.textContent = juego.instrucciones;
        opcionesMinijuego.style.display = "none";
        areaJuegoMinijuego.style.display = "block";
        iniciarLaberinto();

        return;

    }

    if (juego.tipo === "tiro") {

        preguntaMinijuego.textContent = juego.instrucciones;
        opcionesMinijuego.style.display = "none";
        areaJuegoMinijuego.style.display = "block";
        iniciarGaleriaTiro();

        return;

    }

    if (juego.tipo === "clasificacion") {

        preguntaMinijuego.textContent = juego.instrucciones;
        opcionesMinijuego.style.display = "none";
        areaJuegoMinijuego.style.display = "block";
        iniciarClasificacion(juego);

        return;

    }

    if (juego.tipo === "sigilo") {

        preguntaMinijuego.textContent = juego.instrucciones;
        opcionesMinijuego.style.display = "none";
        areaJuegoMinijuego.style.display = "block";
        iniciarSigilo();

        return;

    }

    if (juego.tipo === "archivo") {

        preguntaMinijuego.textContent = juego.instrucciones;
        opcionesMinijuego.style.display = "none";
        areaJuegoMinijuego.style.display = "block";
        iniciarArchivo();

        return;

    }

    if (juego.tipo === "crucigrama") {
        preguntaMinijuego.textContent = juego.instrucciones;
        opcionesMinijuego.style.display = "none";
        areaJuegoMinijuego.style.display = "block";
        iniciarCrucigrama();
        return;
    }

    preguntaMinijuego.textContent = juego.pregunta;

    // Crear una opción por cada respuesta.

    juego.opciones.forEach((opcion, indice) => {

        const boton = document.createElement("button");

        boton.type = "button";

        boton.className = "opcion-minijuego";

        boton.textContent = opcion;

        boton.addEventListener("click", () => {

            comprobarRespuestaMinijuego(indice);

        });

        opcionesMinijuego.appendChild(boton);

    });

}


// ==========================================
// COMPROBAR RESPUESTA DEL MINIJUEGO
// ==========================================

function comprobarRespuestaMinijuego(indice) {

    if (!npcDelMinijuego || respuestaCorrecta) return;

    const juego = npcDelMinijuego.minijuego;

    const botones =
        opcionesMinijuego.querySelectorAll("button");

    if (indice === juego.correcta) {

        respuestaCorrecta = true;

        // Bloquear las respuestas una vez acertada.

        botones.forEach((boton) => {

            boton.disabled = true;

        });

        resultadoMinijuego.textContent =
            "¡Correcto! " + juego.explicacion;

        resultadoMinijuego.style.color = "#4caf50";
        actualizarTextoMision(true);
        ocultarFlechaMision();

        // El texto del botón cambia al terminar
        // la última misión.

        if (etapaMision === NPCS_FEDERALES.length - 1) {

            btnContinuarMinijuego.textContent =
                "Terminar aventura";

        } else {

            btnContinuarMinijuego.textContent =
                "Continuar al siguiente NPC";

        }

        btnContinuarMinijuego.style.display = "block";

    } else {

        resultadoMinijuego.textContent =
            "No es correcto. Volvé a intentarlo.";

        resultadoMinijuego.style.color = "#e53935";

    }

}


// ==========================================
// BONUS FINAL + CINEMÁTICA DE CIERRE
// ==========================================
function crearCapaFinal() {
    let capa = document.getElementById("cierre-infiltrados");
    if (capa) return capa;
    capa = document.createElement("section");
    capa.id = "cierre-infiltrados";
    capa.className = "cierre-infiltrados";
    capa.setAttribute("aria-live", "polite");
    document.body.appendChild(capa);
    return capa;
}

function iniciarBonusFinal() {
    minijuegoAbierto = true;
    const capa = crearCapaFinal();
    const hitos = [
        { fecha: "1820", titulo: "Las provincias", texto: "Tras la caída del poder central, las provincias defendieron su autonomía y sus propios intereses." },
        { fecha: "1826", titulo: "Dos proyectos", texto: "El debate entre un gobierno centralizado y uno federal marcó la organización política." },
        { fecha: "1829", titulo: "El ascenso de Rosas", texto: "Juan Manuel de Rosas asumió el gobierno de Buenos Aires en un período de fuertes tensiones." },
        { fecha: "1831", titulo: "Pacto Federal", texto: "Las provincias firmaron un acuerdo de alianza y cooperación que fortaleció la organización federal." },
        { fecha: "1845", titulo: "Facundo", texto: "Sarmiento publicó Facundo, una obra clave para comprender los debates políticos y culturales de la época." }
    ];
    const mezclar = [...hitos].sort(() => Math.random() - .5);
    let elegidos = [], errores = 0, restante = 90, intervalo;
    capa.innerHTML = `
      <div class="bonus-panel">
        <div class="bonus-topline"><span>ARCHIVO FEDERAL · OPERACIÓN 06</span><span>EXPEDIENTE RESERVADO</span></div>
        <div class="bonus-heading"><div class="bonus-stamp">BONUS<br>FINAL</div><div><p class="bonus-kicker">MENSAJE ENCONTRADO</p><h1>El último mensaje</h1><p>Una última prueba antes de cerrar el expediente.</p></div></div>
        <div class="bonus-brief"><strong>OBJETIVO</strong><p>Ordená los cinco acontecimientos históricos del más antiguo al más reciente. Cada documento contiene una pista. Reconstruí la cronología para descifrar el mensaje final.</p></div>
        <div class="bonus-status"><span>TIEMPO <b id="bonus-tiempo">01:30</b></span><span>ERRORES <b id="bonus-errores">0 / 3</b></span><span>DOCUMENTOS <b id="bonus-progreso">0 / 5</b></span></div>
        <div class="bonus-columns"><div><div class="bonus-label">DOCUMENTOS RECUPERADOS · SELECCIONÁ EN ORDEN</div><div class="bonus-cards" id="bonus-cartas"></div></div><div><div class="bonus-label">LÍNEA DE TIEMPO</div><div class="bonus-timeline" id="bonus-linea"><p class="bonus-empty">Los documentos aparecerán aquí en el orden elegido.</p></div><div class="bonus-hint" id="bonus-pista">Pista: prestá atención a las fechas y a los acontecimientos.</div></div></div>
        <div class="bonus-footer"><span>INSTITUTO DE INVESTIGACIÓN · 1845</span><button id="bonus-reiniciar" type="button">REINICIAR ORDEN</button></div>
      </div>`;
    capa.style.display = "grid";
    const cartas = capa.querySelector("#bonus-cartas"), linea = capa.querySelector("#bonus-linea");
    const tiempo = capa.querySelector("#bonus-tiempo"), erroresUI = capa.querySelector("#bonus-errores"), progreso = capa.querySelector("#bonus-progreso");
    const pista = capa.querySelector("#bonus-pista");
    const render = () => {
        cartas.innerHTML = "";
        mezclar.forEach((h, i) => {
            const b = document.createElement("button"); b.type = "button"; b.className = "bonus-card";
            b.disabled = elegidos.includes(h) || elegidos.length === 5;
            b.innerHTML = `<span class="bonus-card-index">DOC. 0${i+1}</span><strong>${h.titulo}</strong><span>${h.texto}</span><small>SELECCIONAR DOCUMENTO ↗</small>`;
            b.addEventListener("click", () => seleccionar(h)); cartas.appendChild(b);
        });
        linea.innerHTML = elegidos.length ? "" : '<p class="bonus-empty">Los documentos aparecerán aquí en el orden elegido.</p>';
        elegidos.forEach((h,i) => { const item=document.createElement("div"); item.className="bonus-step"; item.innerHTML=`<b>0${i+1}</b><span><strong>${h.fecha} · ${h.titulo}</strong><small>${h.texto}</small></span>`; linea.appendChild(item); });
        progreso.textContent = `${elegidos.length} / 5`; erroresUI.textContent = `${errores} / 3`;
    };
    const terminar = () => { clearInterval(intervalo); mostrarCinematicaFinal(); };
    const fallar = () => {
        errores++; erroresUI.textContent = `${errores} / 3`;
        pista.textContent = "El orden no coincide. Revisá las fechas: la historia no se puede reconstruir al azar.";
        elegidos=[]; render();
        if (errores >= 3) { clearInterval(intervalo); capa.querySelector(".bonus-panel").innerHTML = `<div class="bonus-fail"><span>EXPEDIENTE INCOMPLETO</span><h2>La cronología se perdió</h2><p>El mensaje sigue esperando. Volvé a revisar los documentos y probá otra vez.</p><button id="bonus-volver">REINTENTAR OPERACIÓN</button></div>`; capa.querySelector("#bonus-volver").onclick=()=>iniciarBonusFinal(); }
    };
    const seleccionar = (h) => {
        if (h !== hitos[elegidos.length]) { fallar(); return; }
        elegidos.push(h); pista.textContent = elegidos.length===5 ? "Cronología reconstruida. Mensaje descifrado." : `Correcto. ${h.fecha} queda registrado en el expediente.`; render();
        if (elegidos.length===5) { clearInterval(intervalo); setTimeout(terminar, 900); }
    };
    capa.querySelector("#bonus-reiniciar").onclick=()=>{ elegidos=[]; pista.textContent="Orden reiniciado. Volvé a reconstruir la cronología."; render(); };
    render();
    intervalo=setInterval(()=>{ restante--; tiempo.textContent=`${String(Math.floor(Math.max(0,restante)/60)).padStart(2,"0")}:${String(Math.max(0,restante)%60).padStart(2,"0")}`; if(restante<=0){clearInterval(intervalo); pista.textContent="Se agotó el tiempo. Reiniciá la operación."; capa.querySelectorAll(".bonus-card").forEach(b=>b.disabled=true); const b=document.createElement("button"); b.textContent="REINTENTAR"; b.onclick=()=>iniciarBonusFinal(); capa.querySelector(".bonus-footer").appendChild(b); } },1000);
}

function mostrarCinematicaFinal() {
    const capa=crearCapaFinal();
    const escenas=[
      {tag:"CAPÍTULO I · LA CLASIFICACIÓN",titulo:"Aprendiste a distinguir los proyectos",texto:"Federalismo y unitarismo no eran simples etiquetas: expresaban distintas ideas sobre cómo organizar el poder y qué lugar debían ocupar las provincias.",visual:"FEDERAL · UNITARIO"},
      {tag:"CAPÍTULO II · EL CAMINO",titulo:"Cada fragmento tenía un lugar",texto:"Al reconstruir el mensaje comprendiste que los caminos, las alianzas y las comunicaciones conectaban territorios y decisiones políticas.",visual:"TRES FRAGMENTOS · UNA MISIÓN"},
      {tag:"CAPÍTULO III · EL DESPACHO",titulo:"No toda la verdad estaba a la vista",texto:"Las pistas ocultas y los documentos secretos mostraron que investigar también exige observar, desconfiar y relacionar información.",visual:"OBSERVAR · INVESTIGAR · COMPRENDER"},
      {tag:"CAPÍTULO IV · EL ENFRENTAMIENTO",titulo:"La historia tuvo protagonistas",texto:"En medio de las tensiones entre federales y unitarios, aprendiste que los conflictos políticos también se vivieron en el territorio y afectaron a las personas.",visual:"FEDERALES CONTRA UNITARIOS"},
      {tag:"CAPÍTULO V · EL ARCHIVO",titulo:"Las ideas también dejan huella",texto:"Al reconstruir Facundo conociste la mirada de Sarmiento sobre Quiroga, el caudillismo y el debate entre civilización y barbarie. Una obra también es una fuente para estudiar su época.",visual:"SARMIENTO · QUIROGA · FACUNDO"},
      {tag:"EPÍLOGO · 1845",titulo:"El expediente está completo",texto:"Seguiste las pistas, reconstruiste los documentos y comprendiste que la historia no se explica desde una sola mirada. Ahora la decisión de recordar y aprender queda en tus manos.",visual:"FIN DE LA OPERACIÓN"}
    ];
    let indice=0;
    const pintar=()=>{
      const e=escenas[indice];
      capa.innerHTML=`<div class="cinema-scene"><div class="cinema-grain"></div><div class="cinema-top"><span>INfiltrados</span><span>ARCHIVO HISTÓRICO · 1820—1845</span></div><div class="cinema-art" aria-hidden="true"><div class="cinema-sun"></div><div class="cinema-hill hill-one"></div><div class="cinema-hill hill-two"></div><div class="cinema-silhouette"></div><div class="cinema-paper">${e.visual}</div></div><div class="cinema-copy"><small>${e.tag}</small><h2>${e.titulo}</h2><p>${e.texto}</p><div class="cinema-progress">${escenas.map((_,i)=>`<i class="${i<=indice?'active':''}"></i>`).join('')}</div><button id="cinema-next">${indice===escenas.length-1?'VER FINAL':'CONTINUAR'} <span>→</span></button></div></div>`;
      capa.style.display="grid";
      capa.querySelector("#cinema-next").onclick=()=>{ if(indice<escenas.length-1){indice++;pintar();}else mostrarPantallaFin(); };
    };
    pintar();
}

function mostrarPantallaFin(){
    const capa=crearCapaFinal();
    capa.innerHTML=`<div class="pantalla-fin"><div class="fin-emblema">IN</div><p>INfiltrados · Expediente histórico</p><h1>FIN</h1><span>LA HISTORIA CONTINÚA EN LO QUE RECORDAMOS.</span><button id="btn-menu-final">MENU</button></div>`;
    capa.style.display="grid";
    capa.querySelector("#btn-menu-final").onclick=()=>{ reiniciarProgresoMision(); window.location.href="index.html"; };
}

// ==========================================
// TRANSICIÓN NARRATIVA ENTRE NIVELES
// ==========================================
function mostrarTransicionMision(misionAnterior, siguienteNPC) {
    let capa = document.getElementById("transicion-nivel-infiltrados");
    if (!capa) {
        capa = document.createElement("section");
        capa.id = "transicion-nivel-infiltrados";
        capa.className = "transicion-nivel-infiltrados";
        capa.setAttribute("role", "dialog");
        capa.setAttribute("aria-modal", "true");
        document.body.appendChild(capa);
    }
    const capitulos = [
        "EL PUEBLO Y SUS DOS PROYECTOS",
        "EL MENSAJE ENTRE PROVINCIAS",
        "EL DESPACHO BAJO VIGILANCIA",
        "LA DEFENSA DEL PASO",
        "LAS PALABRAS DE LA CAUSA",
        "EL ARCHIVO DE FACUNDO"
    ];
    const resumenes = [
        "Ya distinguís las ideas federales y unitarias. La Secretaría te confía una tarea más delicada: llevar un mensaje sin que sea interceptado.",
        "Los fragmentos llegaron a destino. Ahora necesitás recuperar un despacho oculto en una zona controlada por patrullas.",
        "El documento fue recuperado. La tensión crece y el camino está amenazado: preparate para defender la posición.",
        "La ruta quedó asegurada. Un vecino conserva palabras clave que pueden revelar el sentido de la causa federal.",
        "Las palabras fueron recuperadas. Ahora podés reconstruir el expediente histórico que conserva Bernabé Gómez.",
        "El archivo está completo. La operación pasa ahora a la reconstrucción histórica final."
    ];
    const indice = Math.max(0, Math.min(5, misionAnterior.etapa));
    capa.innerHTML = `
      <div class="transicion-nivel-panel">
        <div class="transicion-sello">MISIÓN COMPLETADA</div>
        <p class="transicion-etiqueta">CAPÍTULO ${String(indice + 1).padStart(2, "0")} · ${capitulos[indice]}</p>
        <h2>${misionAnterior.minijuego.titulo}</h2>
        <p class="transicion-resumen">${resumenes[indice]}</p>
        <div class="transicion-siguiente"><span>PRÓXIMO CONTACTO</span><strong>${siguienteNPC.nombre}</strong><small>Buscalo en el mapa y acercate para hablar con él.</small></div>
        <button type="button" id="btn-seguir-nivel">CONTINUAR LA OPERACIÓN <span>→</span></button>
      </div>`;
    capa.style.display = "grid";
    capa.querySelector("#btn-seguir-nivel").addEventListener("click", () => {
        capa.classList.add("transicion-saliendo");
        window.setTimeout(() => { capa.style.display = "none"; capa.classList.remove("transicion-saliendo"); }, 220);
    }, { once: true });
}

// ==========================================
// AVANZAR A LA SIGUIENTE MISIÓN
// ==========================================

btnContinuarMinijuego.addEventListener("click", () => {

    // No permitir avanzar sin responder correctamente.

    if (!respuestaCorrecta) return;

    // Guardar referencia de la misión terminada antes de avanzar la etapa.
    const misionAnterior = NPCS_FEDERALES[etapaMision];

    // Desbloquear la siguiente etapa.

    etapaMision++;

    guardarProgresoMision();
    actualizarTextoMision(false);
    misionActiva = false;

    // Cerrar el minijuego y limpiar la interacción.

    limpiarEstadoJuego();

    minijuegoAbierto = false;

    npcDelMinijuego = null;

    npcCercano = null;

    ventanaMinijuego.style.display = "none";

    avisoNPC.style.display = "none";

    // Al completar el quinto minijuego comienza automáticamente el bonus final.
    if (etapaMision >= NPCS_FEDERALES.length) {
        iniciarBonusFinal();
        return;
    }

    // Actualizar los NPC para señalar el disponible.

    posicionarNPCsFederales();

    actualizarInteraccionNPC();
    const siguienteNPC = obtenerNPCDisponible();
    if (siguienteNPC && misionAnterior) mostrarTransicionMision(misionAnterior, siguienteNPC);

});


// El progreso se conserva al cambiar de pantalla o recargar. Solo se reinicia desde la opción explícita de salir al menú.

const botonSalirJuego = document.getElementById("btn-salir-juego");

if (botonSalirJuego) {

    botonSalirJuego.addEventListener("click", () => {

        reiniciarProgresoMision();

        window.location.href = "index.html";

    });

}


// Botón para comenzar el minijuego desde el diálogo.

btnIniciarMinijuego.addEventListener(
    "click",
    iniciarMinijuego
);


// ==========================================
// ACTUALIZAR INTERACCIÓN
// ==========================================

function revisarInteraccionNPC() {

    actualizarInteraccionNPC();

}


// ==========================================
// CARGAR MAPA MP3.JSON
// ==========================================

// ==========================================
// CARGAR MAPPRUEBA.JSON
// ==========================================

async function cargarMapa() {
    try {
        const respuesta = await fetch(
            "../Recursos_graficos/Tilesets/MapPrueba.json"
        );

        if (!respuesta.ok) {
            throw new Error(
                "No se pudo encontrar MapPrueba.json"
            );
        }

        mapa = await respuesta.json();

        // Comprobar que el archivo tenga las dimensiones esperadas.
        if (
            !mapa.width ||
            !mapa.height ||
            !Array.isArray(mapa.layers)
        ) {
            throw new Error(
                "MapPrueba.json no tiene una estructura válida."
            );
        }

        // Tamaño real del mapa.
        canvas.width = mapa.width * TILE_SIZE;
        canvas.height = mapa.height * TILE_SIZE;

        canvas.style.width = `${canvas.width}px`;
        canvas.style.height = `${canvas.height}px`;

        console.log(
            "MapPrueba.json cargado:",
            mapa.width,
            "x",
            mapa.height,
            "tiles"
        );

        console.log(
            "Tamaño del mapa:",
            canvas.width,
            "x",
            canvas.height,
            "píxeles"
        );

        // Cargar las imágenes utilizadas por el mapa.
        await cargarImagenes();

        // Dibujar todas las capas del JSON.
        dibujarMapa();
        prepararMapaVivo();

        // Crear los personajes y el jugador.
        crearNPCsFederales();
        inicializarVidaPueblo();
        iniciarJugador();

        // Reiniciar la cámara para el mapa nuevo.
        camaraInicializada = false;
        actualizarCamara();

    } catch (error) {
        console.error(
            "Error al cargar MapPrueba.json:",
            error
        );
    }
}


// ==========================================
// JUGADOR
// ==========================================

const jugador =
    document.getElementById("jugador");


// ==========================================
// POSICIÓN DEL JUGADOR
// ==========================================

let jugadorX = 10 * TILE_SIZE;

let jugadorY = 10 * TILE_SIZE;


// ==========================================
// VELOCIDAD
// ==========================================

const velocidad = 3;


// ==========================================
// DIRECCIÓN DEL JUGADOR
// ==========================================

let direccion = "abajo";


// ==========================================
// SPRITES QUIETO
// ==========================================

const spritesQuieto = {

    arriba:
        "../Recursos_graficos/Sprites/ArribaP1.png",

    abajo:
        "../Recursos_graficos/Sprites/AbajoP1.png",

    izquierda:
        "../Recursos_graficos/Sprites/izquierdaP1.png",

    derecha:
        "../Recursos_graficos/Sprites/derechaP1.png"

};


// ==========================================
// ANIMACIONES CAMINANDO
// ==========================================

const animacionesCaminar = {

    arriba:
        "../Recursos_graficos/Animaciones/agapito_running-6-frames_north.gif",

    abajo:
        "../Recursos_graficos/Animaciones/agapito_running-6-frames_south.gif",

    izquierda:
        "../Recursos_graficos/Animaciones/agapito_running-6-frames_west.gif",

    derecha:
        "../Recursos_graficos/Animaciones/agapito_running-6-frames_east.gif"

};


// ==========================================
// INICIAR JUGADOR
// ==========================================

function iniciarJugador() {

    // El jugador utiliza directamente
    // las coordenadas del mapa.

    jugador.style.left =
        `${jugadorX - 8}px`;

    jugador.style.top =
        `${jugadorY - 8}px`;
    jugador.style.zIndex = String(Math.round(jugadorY + 48));

    direccion = "abajo";

    jugador.dataset.moviendose = "false";

    jugador.style.backgroundImage =
        `url("${spritesQuieto.abajo}")`;

}


// ==========================================
// CAMBIAR A ANIMACIÓN
// ==========================================

function activarAnimacion(nuevaDireccion) {

    const estabaMoviendose =
        jugador.dataset.moviendose === "true";

    const cambioDireccion =
        direccion !== nuevaDireccion;

    direccion = nuevaDireccion;

    /*
        Solo cambiamos el GIF cuando:

        1. El jugador empieza a moverse.
        2. El jugador cambia de dirección.

        Así no reiniciamos el GIF en cada frame.
    */

    if (!estabaMoviendose || cambioDireccion) {

        jugador.style.backgroundImage =
            `url("${animacionesCaminar[nuevaDireccion]}")`;

    }

    jugador.dataset.moviendose = "true";

}


// ==========================================
// DEJAR AL PERSONAJE QUIETO
// ==========================================

function detenerAnimacion() {

    jugador.style.backgroundImage =
        `url("${spritesQuieto[direccion]}")`;

    jugador.dataset.moviendose = "false";

}


// ==========================================
// TECLAS
// ==========================================

const teclas = {};

document.addEventListener(
    "keydown",
    (evento) => {

        const tecla =
            evento.key.toLowerCase();

        // WASD y flechas del teclado controlan al personaje.
        // Las flechas se traducen a las mismas teclas internas que WASD.
        const equivalencias = {
            arrowup: "w",
            arrowleft: "a",
            arrowdown: "s",
            arrowright: "d"
        };
        const teclaMovimiento = equivalencias[tecla] || tecla;

        if (["w", "a", "s", "d"].includes(teclaMovimiento)) {
            // Durante los minijuegos, sus propios controles reciben las flechas.
            if (minijuegoAbierto) return;

            teclas[teclaMovimiento] = true;
            evento.preventDefault();
        }

    }
);


document.addEventListener(
    "keyup",
    (evento) => {

        const tecla =
            evento.key.toLowerCase();

        const equivalencias = {
            arrowup: "w",
            arrowleft: "a",
            arrowdown: "s",
            arrowright: "d"
        };
        const teclaMovimiento = equivalencias[tecla] || tecla;

        if (["w", "a", "s", "d"].includes(teclaMovimiento)) {

            teclas[teclaMovimiento] = false;

            // Si ya no queda ninguna tecla
            // de movimiento presionada,
            // volvemos al sprite quieto.

            if (
                !teclas["w"] &&
                !teclas["a"] &&
                !teclas["s"] &&
                !teclas["d"]
            ) {

                detenerAnimacion();

            }

        }

    }
);


// Evitar que una tecla quede "pegada" si se cambia de ventana.
window.addEventListener("blur", () => {
    Object.keys(teclas).forEach((tecla) => { teclas[tecla] = false; });
    detenerAnimacion();
    window.InfiltradosAudio?.stopWalking();
});


// ==========================================
// SISTEMA DE COLISIONES DEL MAPA
// ==========================================

// Tiles que representan objetos sólidos.
// Según los tilesets configurados en mision.js:
// 9-28: casas
// 29-36: árboles
// 37-52: fogatas
// 53-56: leña
// 57-72: pozos

// ==========================================
// COLISIONES DE MAPPRUEBA.JSON
// ==========================================

function esTileSolido(gid) {

    // Eliminar los bits de rotación y reflejo de Tiled.
    const gidLimpio = gid & 0x1FFFFFFF;

    // ======================================
    // TERRENOS TRANSITABLES
    // ======================================

    // Pasto y piso.
    if (
        gidLimpio === 1 ||
        gidLimpio === 2 ||
        gidLimpio === 40
    ) {
        return false;
    }

    // ======================================
    // OBJETOS Y CONSTRUCCIONES SÓLIDAS
    // ======================================

    // Casas y árboles.
    if (gidLimpio >= 3 && gidLimpio <= 39) {
        return true;
    }

    // Construcciones, granjas y objetos.
    if (gidLimpio >= 41 && gidLimpio <= 222) {
        return true;
    }

    return false;
}

// ==========================================
// COMPROBAR COLISIÓN
// ==========================================

function hayColision(x, y, ignorarEntidad = null) {

    if (!mapa) return true;

    const anchoMapa = mapa.width * TILE_SIZE;

    const altoMapa = mapa.height * TILE_SIZE;

    // Hitbox más pequeña que el sprite para poder
    // pasar por caminos estrechos.

    const margenX = 10;

    const margenArriba = 8;

    const margenAbajo = 5;

    const anchoHitbox = 12;

    const altoHitbox = 27;

    const izquierda = x - 8 + margenX;

    const derecha = izquierda + anchoHitbox;

    const arriba = y - 8 + margenArriba;

    const abajo =
        arriba + altoHitbox - margenArriba + margenAbajo;

    // Límites del mapa.

    if (
        izquierda < 0 ||
        arriba < 0 ||
        derecha > anchoMapa ||
        abajo > altoMapa
    ) {

        return true;

    }

    // Revisar todos los tiles tocados por el jugador.

    const tileIzquierdo =
        Math.floor(izquierda / TILE_SIZE);

    const tileDerecho =
        Math.floor((derecha - 1) / TILE_SIZE);

    const tileSuperior =
        Math.floor(arriba / TILE_SIZE);

    const tileInferior =
        Math.floor((abajo - 1) / TILE_SIZE);

    for (const capa of mapa.layers) {

        if (capa.type !== "tilelayer" || !capa.data) continue;

        for (let ty = tileSuperior; ty <= tileInferior; ty++) {

            for (let tx = tileIzquierdo; tx <= tileDerecho; tx++) {

                if (
                    tx < 0 || tx >= capa.width ||
                    ty < 0 || ty >= capa.height
                ) {

                    return true;

                }

                const indice =
                    ty * capa.width + tx;

                const gid =
                    capa.data[indice];

                if (gid && esTileSolido(gid)) {

                    return true;

                }

            }

        }

    }

    // Los personajes y animales también ocupan espacio físico.
    const entidades = [...(typeof ciudadanosPueblo !== "undefined" ? ciudadanosPueblo : []),
        ...(typeof animalesPueblo !== "undefined" ? animalesPueblo : [])];
    const hitbox = { left: izquierda, right: derecha, top: arriba, bottom: abajo };
    if (entidades.some(e => e !== ignorarEntidad && hitbox.left < e.x + 38 && hitbox.right > e.x + 10 &&
        hitbox.top < e.y + 40 && hitbox.bottom > e.y + 14)) return true;

    const npcsDeMision = (typeof elementosNPCs !== "undefined" ? elementosNPCs : []);
    if (npcsDeMision.some(({ datos }) => hitbox.left < datos.x + 38 && hitbox.right > datos.x + 10 &&
        hitbox.top < datos.y + 40 && hitbox.bottom > datos.y + 14)) return true;

    return false;

}


// Conservamos el nombre de la función que usa
// actualmente el movimiento del personaje.

function puedeMoverse(x, y, ignorarEntidad = null) {

    return !hayColision(x, y, ignorarEntidad);

}


// ==========================================
// MOVIMIENTO DEL JUGADOR
// ==========================================

function actualizarJugador() {

    // Esperamos a que el mapa esté cargado.

    if (!mapa) {

        requestAnimationFrame(actualizarJugador);

        return;

    }

    // Pausar el movimiento mientras el jugador
    // está conversando o jugando un minijuego.

    if (
        ventanaDialogoNPC.style.display === "flex" ||
        minijuegoAbierto
    ) {
        window.InfiltradosAudio?.stopWalking();
        requestAnimationFrame(actualizarJugador);
        return;
    }

    const posicionAnteriorX = jugadorX;
    const posicionAnteriorY = jugadorY;
    let nuevoX = jugadorX;

    let nuevoY = jugadorY;

    let seEstaMoviendo = false;


    // ======================================
    // ARRIBA
    // ======================================

    if (teclas["w"]) {

        nuevoY -= velocidad;

        activarAnimacion("arriba");

        seEstaMoviendo = true;

    }


    // ======================================
    // ABAJO
    // ======================================

    if (teclas["s"]) {

        nuevoY += velocidad;

        activarAnimacion("abajo");

        seEstaMoviendo = true;

    }


    // ======================================
    // IZQUIERDA
    // ======================================

    if (teclas["a"]) {

        nuevoX -= velocidad;

        activarAnimacion("izquierda");

        seEstaMoviendo = true;

    }


    // ======================================
    // DERECHA
    // ======================================

    if (teclas["d"]) {

        nuevoX += velocidad;

        activarAnimacion("derecha");

        seEstaMoviendo = true;

    }


    // ======================================
    // SI NO SE MUEVE
    // ======================================

    if (!seEstaMoviendo) {

        detenerAnimacion();

    }


    // ======================================
    // COLISIÓN CON EL HUD (ELEMENTOS FIJOS)
    // ======================================
    // El HUD está por encima del mundo y permanece fijo mientras la cámara
    // se desplaza. Comprobamos la posición visual del personaje contra sus
    // rectángulos en coordenadas del tablero para impedir que lo atraviese.
    function colisionaConHUD(x, y) {
        const zoom = ZOOM_INICIAL;
        const jugadorRect = {
            left: (x - 8 - camaraX) * zoom,
            top: (y - 8 - camaraY) * zoom,
            right: (x - 8 - camaraX) * zoom + 48 * zoom,
            bottom: (y - 8 - camaraY) * zoom + 48 * zoom
        };
        const elementosHUD = [
            document.querySelector('.hud-misiones'),
            document.querySelector('.hud-mapa'),
            document.querySelector('.hud-barra-sospecha'),
            document.querySelector('.hud-inventario')
        ].filter(el => el && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden');

        return elementosHUD.some(el => {
            const margen = 5;
            const izquierda = el.offsetLeft - margen;
            const arriba = el.offsetTop - margen;
            const derecha = izquierda + el.offsetWidth + margen * 2;
            const abajo = arriba + el.offsetHeight + margen * 2;
            return jugadorRect.left < derecha && jugadorRect.right > izquierda &&
                   jugadorRect.top < abajo && jugadorRect.bottom > arriba;
        });
    }

    // ======================================
    // COLISIÓN EN X
    // ======================================

    if (puedeMoverse(nuevoX, jugadorY) && !colisionaConHUD(nuevoX, jugadorY)) {

        jugadorX = nuevoX;

    }


    // ======================================
    // COLISIÓN EN Y
    // ======================================

    if (puedeMoverse(jugadorX, nuevoY) && !colisionaConHUD(jugadorX, nuevoY)) {

        jugadorY = nuevoY;

    }


    // ======================================
    // LÍMITES DEL MAPA
    // ======================================

    const anchoMapa =
        mapa.width * TILE_SIZE;

    const altoMapa =
        mapa.height * TILE_SIZE;

    if (jugadorX < 0) {

        jugadorX = 0;

    }

    if (jugadorY < 0) {

        jugadorY = 0;

    }

    if (jugadorX > anchoMapa - 32) {

        jugadorX = anchoMapa - 32;

    }

    if (jugadorY > altoMapa - 32) {

        jugadorY = altoMapa - 32;

    }


    // Pasos solo cuando el personaje se desplaza realmente.
    const desplazamientoReal = Math.hypot(jugadorX - posicionAnteriorX, jugadorY - posicionAnteriorY);
    window.InfiltradosAudio?.walking(desplazamientoReal > 0.1);

    // ======================================
    // POSICIÓN VISUAL
    // ======================================

    actualizarCamara();
    actualizarVidaPueblo();

    revisarInteraccionNPC();
    revisarSospechaMundo();
    revisarObjetosRecolectables();

    requestAnimationFrame(actualizarJugador);

}


requestAnimationFrame(actualizarJugador);


// ==========================================
// MISIONES Y FLECHA DE NAVEGACIÓN
// ==========================================

const hudMisiones = document.querySelector(".hud-misiones");
const modalMision = document.getElementById("modal-mision");
const btnCerrarMision = document.getElementById("btn-cerrar-mision");
const btnIniciarMision = document.getElementById("btn-iniciar-mision");
const textoMision = modalMision ? modalMision.querySelector(".pergamino-grande p") : null;
const flechaMision = document.getElementById("btn-flecha-npc");
let misionActiva = false;
let misionCompletadaActual = false;

function obtenerTextoMisionActual(completada = false) {
    const npc = NPCS_FEDERALES[etapaMision];
    if (!npc) return "¡Todas las misiones fueron completadas!";
    if (completada) return `✓ MISIÓN COMPLETADA: ${npc.minijuego.titulo}.

¡Buen trabajo! Preparáte para la siguiente misión.`;
    return `${npc.minijuego.titulo}

${npc.minijuego.instrucciones}

Objetivo: ${npc.nombre}.`;
}

function actualizarTextoMision(completada = misionCompletadaActual) {
    misionCompletadaActual = completada;
    if (!textoMision) return;
    textoMision.textContent = obtenerTextoMisionActual(completada);
}

function ocultarFlechaMision() {
    if (flechaMision) flechaMision.style.display = "none";
}

function actualizarFlechaMision() {
    if (!flechaMision || !misionActiva || minijuegoAbierto || ventanaDialogoNPC.style.display === "flex") return;
    const npc = obtenerNPCDisponible();
    if (!npc) {
        ocultarFlechaMision();
        return;
    }

    // La flecha permanece fija en pantalla y gira hacia la ubicación real del NPC.
    const dx = (npc.x + 24) - (jugadorX + 16);
    const dy = (npc.y + 24) - (jugadorY + 16);
    const angulo = Math.atan2(dy, dx) * 180 / Math.PI + 90;
    flechaMision.style.display = "block";
    flechaMision.textContent = "⬆";
    flechaMision.style.backgroundImage = "none";
    flechaMision.style.left = "50%";
    flechaMision.style.top = "24px";
    flechaMision.style.right = "auto";
    flechaMision.style.transform = `translateX(-50%) rotate(${angulo}deg)`;
    flechaMision.setAttribute("aria-label", `Dirección hacia ${npc.nombre}`);
}

if (hudMisiones && modalMision) {
    hudMisiones.addEventListener("click", () => {
        actualizarTextoMision();
        modalMision.style.display = "flex";
    });
}

if (btnCerrarMision && modalMision) {
    btnCerrarMision.addEventListener("click", () => {
        modalMision.style.display = "none";
    });
}

if (btnIniciarMision && modalMision) {
    btnIniciarMision.addEventListener("click", () => {
        if (!obtenerNPCDisponible()) return;
        misionActiva = true;
        modalMision.style.display = "none";
        actualizarFlechaMision();
    });
}

// Mostrar el objetivo actual al cargar o recuperar una partida.
actualizarTextoMision(false);


// ==========================================
// MODAL DEL MAPA
// ==========================================

const hudMapa =
    document.getElementById("btn-abrir-mapa");

const modalMapa =
    document.getElementById("modal-mapa");

const btnCerrarMapa =
    document.getElementById("btn-cerrar-mapa");


if (hudMapa && modalMapa) {

    hudMapa.addEventListener(
        "click",
        () => {

            modalMapa.style.display = "flex";
            actualizarPuntoMapaVivo();

        }
    );

}


if (btnCerrarMapa && modalMapa) {

    btnCerrarMapa.addEventListener(
        "click",
        () => {

            modalMapa.style.display = "none";

        }
    );

}


// ==========================================
// INICIAR MAPA
// ==========================================

cargarMapa();

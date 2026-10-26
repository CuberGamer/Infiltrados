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
}


// ==========================================
// TILESETS
// ==========================================

const tilesets = [

    {
        firstgid: 1,
        lastgid: 4,
        imagen: "../Recursos_graficos/Tilesets/pasto1.png",
        columnas: 2
    },

    {
        firstgid: 5,
        lastgid: 8,
        imagen: "../Recursos_graficos/Tilesets/piso1.png",
        columnas: 2
    },

    {
        firstgid: 9,
        lastgid: 28,
        imagen: "../Recursos_graficos/Tilesets/casa1.png",
        columnas: 4
    },

    {
        firstgid: 29,
        lastgid: 32,
        imagen: "../Recursos_graficos/Tilesets/arbol2.png",
        columnas: 2
    },

    {
        firstgid: 33,
        lastgid: 36,
        imagen: "../Recursos_graficos/Tilesets/arbol1.png",
        columnas: 2
    },

    {
        firstgid: 37,
        lastgid: 52,
        imagen: "../Recursos_graficos/Tilesets/fogata1.png",
        columnas: 4
    },

    {
        firstgid: 53,
        lastgid: 56,
        imagen: "../Recursos_graficos/Tilesets/leña1.png",
        columnas: 4
    },

    {
        firstgid: 57,
        lastgid: 72,
        imagen: "../Recursos_graficos/Tilesets/pozo1.png",
        columnas: 4
    }

];


const imagenesTilesets = {};


// ==========================================
// CARGAR IMÁGENES
// ==========================================

function cargarImagenes() {

    const promesas = [];

    tilesets.forEach((tileset) => {

        const imagen = new Image();

        imagen.src = tileset.imagen;

        imagenesTilesets[tileset.firstgid] = imagen;

        promesas.push(

            new Promise((resolve) => {

                imagen.onload = resolve;

            })

        );

    });

    return Promise.all(promesas);
}


// ==========================================
// BUSCAR TILESET
// ==========================================

function obtenerTileset(gid) {

    for (let i = tilesets.length - 1; i >= 0; i--) {

        if (gid >= tilesets[i].firstgid) {

            return tilesets[i];

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


// ==========================================
// CARGAR MAPA JSON
// ==========================================

async function cargarMapa() {

    try {

        const respuesta =
            await fetch(
                "../Recursos_graficos/Tilesets/MapPrueba.json"
            );

        if (!respuesta.ok) {

            throw new Error(
                "No se pudo encontrar MapPrueba.json"
            );

        }

        mapa = await respuesta.json();

        console.log(
            "Mapa cargado correctamente"
        );

        await cargarImagenes();

        dibujarMapa();

        iniciarJugador();

        actualizarCamara();
    } catch (error) {

        console.error(
            "Error al cargar el mapa:",
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

let jugadorX = 14 * TILE_SIZE;
let jugadorY = 9 * TILE_SIZE;


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

    // IMPORTANTE:
    // Ya no usamos +480 ni +220.
    // El jugador utiliza directamente
    // las coordenadas del mapa.

    jugador.style.left =
        `${jugadorX - 8}px`;

    jugador.style.top =
        `${jugadorY - 8}px`;

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

        Así no reiniciamos el GIF
        en cada frame.
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

        if (
            tecla === "w" ||
            tecla === "a" ||
            tecla === "s" ||
            tecla === "d"
        ) {

            teclas[tecla] = true;

            evento.preventDefault();

        }

    }
);


document.addEventListener(
    "keyup",
    (evento) => {

        const tecla =
            evento.key.toLowerCase();

        if (
            tecla === "w" ||
            tecla === "a" ||
            tecla === "s" ||
            tecla === "d"
        ) {

            teclas[tecla] = false;

            /*
                Si ya no queda ninguna tecla
                de movimiento presionada,
                volvemos al sprite quieto.
            */

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


// ==========================================
// COMPROBAR SI EL JUGADOR PUEDE MOVERSE
// ==========================================


/* ==========================================
   SISTEMA DE COLISIONES DEL MAPA
   ========================================== */

// Tiles que representan objetos sólidos.
// Según los tilesets configurados en mision.js:
// 9-28: casas
// 29-36: árboles
// 37-52: fogatas
// 53-56: leña
// 57-72: pozos
function esTileSolido(gid) {
    // Tiled usa los 4 bits superiores para indicar
    // giros y reflejos de los tiles.
    const gidLimpio = gid & 0x1FFFFFFF;

    return (
        (gidLimpio >= 9 && gidLimpio <= 28) ||
        (gidLimpio >= 29 && gidLimpio <= 36) ||
        (gidLimpio >= 37 && gidLimpio <= 52) ||
        (gidLimpio >= 53 && gidLimpio <= 72)
    );
}


// Comprueba si una posición choca con un objeto.
function hayColision(x, y) {
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
    const abajo = arriba + altoHitbox - margenArriba + margenAbajo;

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
    const tileIzquierdo = Math.floor(izquierda / TILE_SIZE);
    const tileDerecho = Math.floor((derecha - 1) / TILE_SIZE);
    const tileSuperior = Math.floor(arriba / TILE_SIZE);
    const tileInferior = Math.floor((abajo - 1) / TILE_SIZE);

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

                const indice = ty * capa.width + tx;
                const gid = capa.data[indice];

                if (gid && esTileSolido(gid)) {
                    return true;
                }
            }
        }
    }

    return false;
}


// Conservamos el nombre de la función que usa
// actualmente el movimiento del personaje.
function puedeMoverse(x, y) {
    return !hayColision(x, y);
}


// ==========================================
// MOVIMIENTO DEL JUGADOR
// ==========================================

function actualizarJugador() {

    /*
        Esperamos a que el mapa esté cargado.
    */

    if (!mapa) {

        requestAnimationFrame(
            actualizarJugador
        );

        return;

    }


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
    // COLISIÓN EN X
    // ======================================

    if (
        puedeMoverse(
            nuevoX,
            jugadorY
        )
    ) {

        jugadorX = nuevoX;

    }


    // ======================================
    // COLISIÓN EN Y
    // ======================================

    if (
        puedeMoverse(
            jugadorX,
            nuevoY
        )
    ) {

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

        jugadorX =
            anchoMapa - 32;

    }


    if (jugadorY > altoMapa - 32) {

        jugadorY =
            altoMapa - 32;

    }


    // ======================================
    // POSICIÓN VISUAL
    // ======================================

    /*
        ANTES:

        480 + jugadorX
        220 + jugadorY

        Eso provocaba el límite invisible
        arriba y a la izquierda.

        AHORA:

        jugadorX
        jugadorY
    */

    actualizarCamara();


    requestAnimationFrame(
        actualizarJugador
    );

}


requestAnimationFrame(
    actualizarJugador
);


// ==========================================
// FLECHAS
// ==========================================

const btnAbajo =
    document.getElementById("btn-abajo");

const btnIzquierda =
    document.getElementById("btn-izquierda");

const btnDerecha =
    document.getElementById("btn-derecha");

const flechaNpc =
    document.getElementById("btn-flecha-npc");


let zonaActual = "centro";


function cambiarZona(nombreZona) {

    zonaActual = nombreZona;

}


if (btnIzquierda) {

    btnIzquierda.addEventListener(
        "click",
        () => {

            if (zonaActual === "centro") {

                cambiarZona("izquierda");

            }

        }
    );

}


if (btnDerecha) {

    btnDerecha.addEventListener(
        "click",
        () => {

            if (zonaActual === "centro") {

                cambiarZona("derecha");

            }

        }
    );

}


if (btnAbajo) {

    btnAbajo.addEventListener(
        "click",
        () => {

            cambiarZona("centro");

        }
    );

}


// ==========================================
// MODAL DE MISIONES
// ==========================================

const hudMisiones =
    document.querySelector(".hud-misiones");

const modalMision =
    document.getElementById("modal-mision");

const btnCerrarMision =
    document.getElementById("btn-cerrar-mision");

const btnIniciarMision =
    document.getElementById("btn-iniciar-mision");


if (hudMisiones && modalMision) {

    hudMisiones.addEventListener(
        "click",
        () => {

            modalMision.style.display = "flex";

        }
    );

}


if (btnCerrarMision && modalMision) {

    btnCerrarMision.addEventListener(
        "click",
        () => {

            modalMision.style.display = "none";

        }
    );

}


if (btnIniciarMision && modalMision) {

    btnIniciarMision.addEventListener(
        "click",
        () => {

            modalMision.style.display = "none";

            if (flechaNpc) {

                flechaNpc.style.display = "block";

            }

        }
    );

}


// ==========================================
// IR A PREGUNTA
// ==========================================

if (flechaNpc) {

    flechaNpc.addEventListener(
        "click",
        () => {

            window.location.href =
                "pregunta.html";

        }
    );

}


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
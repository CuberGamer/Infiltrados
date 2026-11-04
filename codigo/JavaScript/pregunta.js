// ==========================================
// INFILTRADOS - SISTEMA DE PREGUNTAS
// Cada respuesta correcta desbloquea otra misión.
// ==========================================

function ajustarEscalaLienzo() {
    const contenedor = document.getElementById("contenedor-juego");

    if (!contenedor) return;

    const escala = Math.min(
        window.innerWidth / 1920,
        window.innerHeight / 1080
    );

    contenedor.style.position = "absolute";
    contenedor.style.left = "50%";
    contenedor.style.top = "50%";
    contenedor.style.transform =
        `translate(-50%, -50%) scale(${escala})`;
}

window.addEventListener("resize", ajustarEscalaLienzo);
window.addEventListener("load", ajustarEscalaLienzo);

// ==========================================
// PROGRESO DE LAS MISIONES
// ==========================================

const CLAVE_ETAPA_MISION = "infiltrados_etapa_mision";
const CLAVE_MISION_ACEPTADA = "infiltrados_mision_aceptada";

const etapa = Number.parseInt(
    localStorage.getItem(CLAVE_ETAPA_MISION) || "0",
    10
);

// ==========================================
// PREGUNTAS SOBRE FACUNDO
// ==========================================

const preguntas = [
    {
        texto:
            "ANTES DE CONFIARTE ESTA CARTA, NECESITO SABER ALGO. ¿CON QUÉ COLOR SE IDENTIFICA AL PARTIDO FEDERAL?",
        correcta: "EL COLOR ROJO PUNZÓ",
        incorrecta: "EL COLOR AZUL"
    },
    {
        texto:
            "¿QUÉ CAUDILLO FEDERAL DE LA RIOJA ES LA FIGURA CENTRAL DE LA OBRA FACUNDO, DE SARMIENTO?",
        correcta: "FACUNDO QUIROGA",
        incorrecta: "JOSÉ DE SAN MARTÍN"
    },
    {
        texto:
            "¿QUÉ PROPUESTA SE ASOCIA HISTÓRICAMENTE CON LOS UNITARIOS?",
        correcta: "UN GOBIERNO CENTRAL FUERTE",
        incorrecta:
            "LA AUTONOMÍA TOTAL DE CADA PROVINCIA COMO PRINCIPIO CENTRAL"
    },
    {
        texto:
            "¿QUIÉN ESCRIBIÓ FACUNDO, OBRA QUE CONTRAPONE CIVILIZACIÓN Y BARBARIE?",
        correcta: "DOMINGO F. SARMIENTO",
        incorrecta: "JUAN MANUEL DE ROSAS"
    },
    {
        texto:
            "EN FACUNDO, ¿CÓMO PRESENTA SARMIENTO LA OPOSICIÓN ENTRE CIVILIZACIÓN Y BARBARIE?",
        correcta:
            "COMO UNA INTERPRETACIÓN POLÍTICA Y SOCIAL DE SU ÉPOCA",
        incorrecta:
            "COMO UNA CLASIFICACIÓN CIENTÍFICA NEUTRAL Y ACEPTADA POR TODOS"
    }
];

// ==========================================
// MOSTRAR LA PREGUNTA ACTUAL
// ==========================================

const textoPregunta = document.querySelector(".texto-pregunta");
const opciones = document.querySelectorAll(".btn-opcion");

if (
    !Number.isInteger(etapa) ||
    etapa < 0 ||
    etapa >= preguntas.length
) {
    window.location.href = "victoria.html";
} else {
    const preguntaActual = preguntas[etapa];

    if (textoPregunta) {
        textoPregunta.textContent = preguntaActual.texto;
    }

    if (opciones.length >= 2) {
        opciones[0].textContent = preguntaActual.correcta;
        opciones[1].textContent = preguntaActual.incorrecta;
    }
}

// ==========================================
// COMPROBAR RESPUESTA
// ==========================================

function responder(esCorrecto) {
    if (!esCorrecto) {
        window.location.href = "gameover.html";
        return;
    }

    const siguienteEtapa = etapa + 1;

    // Guardar el progreso para habilitar al próximo NPC.
    localStorage.setItem(
        CLAVE_ETAPA_MISION,
        String(siguienteEtapa)
    );

    // La nueva misión debe aceptarse hablando con el NPC.
    localStorage.removeItem(CLAVE_MISION_ACEPTADA);

    if (siguienteEtapa >= preguntas.length) {
        window.location.href = "victoria.html";
    } else {
        window.location.href = "mision.html";
    }
}
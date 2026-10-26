// ==========================================
// ESCALADO DEL TUTORIAL
// ==========================================

function ajustarEscalaTutorial() {

    const contenedor =
        document.getElementById("contenedor-juego");

    if (!contenedor) return;

    const escalaAncho =
        window.innerWidth / 1300;

    const escalaAlto =
        window.innerHeight / 1000;

    const escala =
        Math.min(escalaAncho, escalaAlto);

    contenedor.style.transform =
    `translate(-50%, -50%) scale(${escala})`;
}

window.addEventListener(
    "resize",
    ajustarEscalaTutorial
);

window.addEventListener(
    "load",
    ajustarEscalaTutorial
);


// ==========================================
// BOTON COMENZAR
// ==========================================

const btnComenzar =
    document.getElementById("btn-comenzar");

btnComenzar.addEventListener("click", () => {

    window.location.href = "mision.html";

});


// ==========================================
// BOTON VOLVER AL MENU
// ==========================================

const btnVolver =
    document.getElementById("btn-volver");

btnVolver.addEventListener("click", () => {

    window.location.href = "index.html";

});

// ================================
// NAVEGACIÓN DEL MENÚ PRINCIPAL
// ================================


// BOTÓN JUGAR
const botonJugar = document.getElementById("boton-iniciar-juego");

if (botonJugar) {

    botonJugar.addEventListener("click", () => {

        window.location.href = "partidas.html";

    });

}


// BOTÓN CONFIGURACIÓN
const botonConfiguracion = document.getElementById("boton-configuracion");

if (botonConfiguracion) {

    botonConfiguracion.addEventListener("click", () => {

        window.location.href = "Configuracion.html";

    });

}


// BOTÓN CRÉDITOS
const botonCreditos = document.getElementById(
    "boton-creditos-informacion"
);

if (botonCreditos) {

    botonCreditos.addEventListener("click", () => {

        window.location.href = "creditos.html";

    });

}


// BOTÓN SALIR
const botonSalir = document.getElementById("boton-salir-juego");

if (botonSalir) {

    botonSalir.addEventListener("click", () => {

        alert(
            "Para salir del juego, puedes cerrar esta pestaña."
        );

    });

}
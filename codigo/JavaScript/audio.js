/* ==========================================
   SISTEMA DE AUDIO - INFILTRADOS
   Volumen maestro persistente entre pantallas.
   ========================================== */
(() => {
    "use strict";
    const BASE = "../Recursos_graficos/";
    const CLAVE_VOLUMEN = "infiltrados_volumen_maestro";
    const archivos = {
        menu: BASE + "Audio/musica%20Menu%202.mp3",
        soundtrack: BASE + "Audio/soundtrack.mp3",
        click: BASE + "Efectos/clik%20boton.wav",
        seleccion: BASE + "Efectos/seleccion%20boton.wav",
        caminar: BASE + "Efectos/caminata_sonido.wav",
        interaccion: BASE + "Efectos/interaccion_sonido.wav"
    };
    const ruta = location.pathname.toLowerCase();
    const esMenu = /\/(index|partidas|configuracion|creditos)\.html$/.test(ruta);
    const musica = new Audio(archivos[esMenu ? "menu" : "soundtrack"]);
    musica.loop = true;
    musica.preload = "auto";
    const efectos = {
        click: new Audio(archivos.click),
        seleccion: new Audio(archivos.seleccion),
        interaccion: new Audio(archivos.interaccion),
        caminar: new Audio(archivos.caminar)
    };
    efectos.caminar.loop = true;
    const volumenGuardado = Number(localStorage.getItem(CLAVE_VOLUMEN));
    let volumenMaestro = Number.isFinite(volumenGuardado) && localStorage.getItem(CLAVE_VOLUMEN) !== null
        ? Math.max(0, Math.min(1, volumenGuardado / 100)) : 0.70;
    let habilitado = false;
    let ultimoElementoSeleccionado = null;

    function aplicarVolumen() {
        musica.volume = 0.34 * volumenMaestro;
        efectos.click.volume = 0.65 * volumenMaestro;
        efectos.seleccion.volume = 0.42 * volumenMaestro;
        efectos.interaccion.volume = 0.58 * volumenMaestro;
        efectos.caminar.volume = 0.48 * volumenMaestro;
    }
    function reproducir(audio, reiniciar = true) {
        if (!audio || volumenMaestro <= 0) return;
        if (reiniciar) { try { audio.currentTime = 0; } catch (_) {} }
        const promesa = audio.play();
        if (promesa && promesa.catch) promesa.catch(() => {});
    }
    function iniciarMusica() {
        habilitado = true;
        if (volumenMaestro > 0 && musica.paused) reproducir(musica, false);
    }
    function efecto(nombre) {
        if (!habilitado) iniciarMusica();
        if (efectos[nombre] && volumenMaestro > 0) reproducir(efectos[nombre]);
    }
    function caminar(activo) {
        if (!habilitado && activo) iniciarMusica();
        const audio = efectos.caminar;
        if (!audio) return;
        if (activo && volumenMaestro > 0) {
            if (audio.paused) reproducir(audio, false);
        } else if (!audio.paused) {
            audio.pause(); audio.currentTime = 0;
        }
    }
    function setMasterVolume(valor) {
        const n = Number(valor);
        if (!Number.isFinite(n)) return;
        volumenMaestro = Math.max(0, Math.min(1, n > 1 ? n / 100 : n));
        try { localStorage.setItem(CLAVE_VOLUMEN, String(Math.round(volumenMaestro * 100))); } catch (_) {}
        aplicarVolumen();
        if (volumenMaestro === 0) {
            musica.pause();
            Object.values(efectos).forEach(a => { a.pause(); if (a === efectos.caminar) a.currentTime = 0; });
        } else if (habilitado && musica.paused) reproducir(musica, false);
    }
    aplicarVolumen();
    reproducir(musica, false);
    ["pointerdown", "keydown", "touchstart"].forEach(tipo =>
        window.addEventListener(tipo, iniciarMusica, { once: true, passive: true })
    );
    document.addEventListener("pointerover", evento => {
        const c = evento.target.closest("button,.btn-opcion,.slot-partida,[role='button']");
        if (!c || c === ultimoElementoSeleccionado) return;
        ultimoElementoSeleccionado = c;
        efecto("seleccion");
    }, true);
    document.addEventListener("focusin", evento => {
        const c = evento.target.closest("button,.btn-opcion,.slot-partida,[role='button']");
        if (!c || c === ultimoElementoSeleccionado) return;
        ultimoElementoSeleccionado = c;
        efecto("seleccion");
    }, true);
    document.addEventListener("click", evento => {
        if (evento.target.closest("button,.btn-opcion,.slot-partida,[role='button']")) efecto("click");
        if (evento.target.closest("[data-audio-interaction],#btn-iniciar-minijuego,#btn-iniciar-mision,.slot-item")) efecto("interaccion");
    }, true);
    window.InfiltradosAudio = {
        play: efecto,
        walking: caminar,
        stopWalking: () => caminar(false),
        stopMusic: () => { musica.pause(); musica.currentTime = 0; },
        setMasterVolume,
        getMasterVolume: () => Math.round(volumenMaestro * 100),
        setMusicVolume: valor => { musica.volume = Math.max(0, Math.min(1, Number(valor))) * volumenMaestro; },
        setEffectsVolume: valor => {
            const n = Math.max(0, Math.min(1, Number(valor))) * volumenMaestro;
            efectos.click.volume = n; efectos.seleccion.volume = n * .65;
            efectos.interaccion.volume = n * .85; efectos.caminar.volume = n * .7;
        }
    };
})();

# INfiltrados – mejoras de minijuegos arcade

Esta versión conserva la estructura original del proyecto, la exploración del mapa, los NPC, las etapas y la progresión de misiones.

## Cambios incluidos

- **Tiro:** se reemplazó la galería de blancos por un shooter de vista superior. El jugador se mueve con WASD/flechas, apunta y dispara con el mouse, recarga con R, usa coberturas y combate enemigos que persiguen y disparan. Incluye vida, munición, oleadas y objetivo de bajas.
- **Sigilo:** las patrullas ahora tienen un campo de detección direccional y un alcance mayor; los matorrales siguen funcionando como cobertura. Se conserva el objetivo de reunir pistas, recuperar el documento y escapar.
- **Laberinto:** se agregó un vigilante móvil, tres oportunidades y penalización por ser interceptado, manteniendo la recolección de fragmentos y la salida.
- **Clasificación:** ahora tiene límite de tiempo y un máximo de errores, con posibilidad de reintentar.
- **Archivo:** la reconstrucción del expediente tiene tiempo límite y oportunidades de error.
- **Estética:** se reforzó el tratamiento visual arcade ilustrado con paleta retro, HUD y personajes dibujados en el shooter.

## Controles

- Movimiento: WASD o flechas.
- Shooter: mouse para apuntar y disparar; R para recargar.
- Minijuegos de tablero: WASD/flechas; también conservan controles táctiles en pantalla cuando están disponibles.

## Nota

El multijugador cooperativo/PvP requiere una capa de sincronización entre dispositivos o jugadores que no existía en el proyecto base. Esta entrega prepara minijuegos con modalidad individual y deja la arquitectura online como siguiente etapa, sin simular un multijugador inexistente.


## Integración de cinco niveles y audio persistente

- Los cinco minijuegos se presentan como niveles numerados y mantienen sus mecánicas diferenciadas: clasificación, laberinto, sigilo, combate y reconstrucción de archivo.
- Al terminar cada nivel se muestra una transición narrativa animada que confirma la misión y señala el siguiente NPC que debe buscarse en el mapa.
- El progreso ya no se borra al recargar o cambiar de pantalla; solo se reinicia al elegir explícitamente volver al menú.
- El control de volumen de Configuración regula música y efectos en tiempo real, muestra el porcentaje y guarda la preferencia para las demás pantallas.
- Se corrigió la descripción del cuarto nivel para que coincida con su objetivo real de ocho bajas y el uso de coberturas.

# Mejoras de colisiones, profundidad y ortografía

## Colisiones
- Se unificó la hitbox de los pies para NPC ambientales y animales.
- Los habitantes y animales verifican los tiles sólidos y los límites del mapa antes de avanzar.
- Se evita que atraviesen al jugador, a otros habitantes, a animales o a NPC de misión.
- Los animales buscan una dirección alternativa cuando el camino de huida está bloqueado.
- Los NPC de misión también bloquean el paso del jugador.

## Profundidad visual e interfaz
- Jugador, NPC y animales actualizan su orden de dibujo según su coordenada vertical (Y), como en un RPG 2D.
- La escena del mundo queda aislada por debajo del HUD.
- La carta de misión, el botón del mapa, el inventario y las ventanas mantienen prioridad visual.

## Ortografía
- Se corrigieron textos visibles, títulos, botones, instrucciones y créditos.
- Se conservaron los identificadores internos, rutas de recursos y nombres de archivos para no romper referencias del juego.
- Se mantuvo el voseo y el registro rioplatense en los textos dirigidos al jugador.

## Comprobaciones realizadas
- Sintaxis de todos los archivos JavaScript mediante Node.js.
- Lectura de todos los archivos JSON.
- Revisión estructural básica de los archivos CSS.
- Integridad del archivo ZIP.
- La prueba visual interactiva en navegador queda pendiente.

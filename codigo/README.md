# 📦 Código

Bienvenido a la carpeta `codigo` — aquí vive todo el código fuente del proyecto Infiltrados.

---

### Qué encontrarás
- Implementación del juego/servicio organizada por módulos.
- Scripts de compilación y ejecución.
- Tests y utilidades de desarrollo.


## HUD dinámico: sospecha e inventario

- La sospecha empieza en 0%, aumenta al fallar respuestas, fallar disparos o ser descubierto en el minijuego de sigilo. Se recupera lentamente cuando el jugador permanece fuera de peligro.
- Para que la sospecha aumente en el mapa principal, agregá en Tiled una capa de objetos llamada `zonas_restringidas` y dibujá rectángulos en las áreas prohibidas. Al entrar en una zona, suma sospecha.
- Para la detección por guardias, agregá una capa de objetos llamada `guardias` y ubicá un objeto por guardia. La propiedad opcional `radioVision` (número, en píxeles) define su alcance; por defecto es 150.
- El inventario tiene cuatro espacios y comienza vacío. Para definir objetos recogibles, agregá una capa de objetos llamada `objetos_recolectables`. Cada objeto puede tener nombre y propiedades `icono`, `descripcion` e `idObjeto`. El jugador lo recoge al acercarse.
- Las capas de Tiled deben ser de tipo **Objeto** (Object Layer), no capas de tiles.

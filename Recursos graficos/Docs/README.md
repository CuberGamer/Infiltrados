# Documentación de Recursos Gráficos

Aquí van las reglas y convenciones para mantener consistencia en los assets del juego:

- Nomenclatura: usa prefijos y carpetas por tipo y entidad, por ejemplo `player_idle_01.png` o `enemy_goblin_walk_00.png`.
- Resoluciones: especificar escala base (por ejemplo, 72 DPI, sprite base 64x64) y versiones @2x/@3x si aplica.
- Formatos: usar PNG para sprites con transparencia, JPG para fotos o fondos que no requieran transparencia, WebP para optimización cuando el motor lo soporte.
- Metadatos: guarda JSON/TMX/ASEPRITE con los datos de animación y colisiones.
- Licencias: incluir archivos de atribución en `Audio/` y `Fuentes/` si corresponden.

Si quieres, puedo también crear subcarpetas específicas para personajes o niveles y mover recursos existentes dentro de ellas.
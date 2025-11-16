# Nexdom Wallpaper Rotator

Este add-on rota imágenes en `/config/www/wp/` y mantiene un archivo activo (`current.png`) para que Home Assistant use como fondo en temas o dashboards.

## Instalación
- Copia la carpeta `nexdom_aura_shift/` dentro de tu repositorio de add-ons locales.
- Asegúrate de que el add-on monte `/config` con permisos de lectura/escritura (configurado en `config.json`).
- Coloca tus imágenes en `/config/www/wp/` con nombres `1.png`, `2.png`, ..., `N.png`.

## Configuración
En la UI del add-on ajusta los `options`:
- `images_path`: `/config/www/wp`
- `start_index`: `1`
- `end_index`: `10`
- `rotation_interval`: `300`
- `mode`: `sequential` o `random`
- `current_filename`: `current.png`
- `log_level`: `info`

## Uso en Home Assistant
Usa `/local/wp/current.png` como fondo en temas o tarjetas:
- Lovelace: `"center / cover no-repeat url('/local/wp/current.png') fixed"`
- CSS: `background-image: url('/local/wp/current.png');`

## Comportamiento
- Al iniciar, valida directorio y rango; crea `current.png` desde la primera imagen válida.
- En bucle, espera `rotation_interval` y selecciona imagen según `mode`.
- Implementa copia de archivo sobre `current.png`.
- Registra en log ruta de `current.png`, modo, intervalo y rango.

## Notas
- No usa APIs de Home Assistant; solo manipula archivos en `/config/www/wp`.
- Si `end_index < start_index`, no arranca y registra error.
- Si no hay imágenes válidas, registra error y continuará intentando en ciclos posteriores.
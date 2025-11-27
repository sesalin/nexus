# Iconos PWA para Nexdom OS

Este directorio contiene los iconos necesarios para la aplicación PWA.

## Archivos incluidos:

- `icon-192.svg` - Icono de 192x192px para manifest PWA
- `icon-512.svg` - Icono de 512x512px para manifest PWA  
- `icon-apple.svg` - Icono de 180x180px para dispositivos Apple
- `icon-shortcut.svg` - Icono para accesos directos del sistema

## Conversión a PNG

Para usar estos archivos en la PWA, necesitan ser convertidos a formato PNG:

```bash
# Usando Inkscape (recomendado)
inkscape icon-192.svg --export-type=png --export-filename=icon-192.png --export-width=192 --export-height=192
inkscape icon-512.svg --export-type=png --export-filename=icon-512.png --export-width=512 --export-height=512
inkscape icon-apple.svg --export-type=png --export-filename=icon-apple.png --export-width=180 --export-height=180

# O usando herramientas online como cloudconvert.com
```

## Especificaciones PWA

- **Formato**: PNG preferido para compatibilidad
- **Colores**: Tema neón verde (#00FF88) sobre fondo negro (#0a0a0a)
- **Tamaño mínimo**: 192x192px
- **Tamaño recomendado**: 512x512px para mejor calidad en pantallas HD
- **Propósito**: maskable (se adapta a diferentes formas de pantalla)

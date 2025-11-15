Pruebas del add-on HAOS Reporter

- Requisitos: Python 3.11 o superior.
- Instalación de dependencias: `pip install -r requirements.txt`.
- Ejecutar pruebas: `pytest -q`.

Las pruebas no dependen de servicios externos. Se simulan:
- WebSocket de Home Assistant con un servidor local.
- Endpoint RPC de Supabase con interceptación de `requests`.

Áreas cubiertas:
- Validación de configuración obligatoria.
- Filtros de entidades con comodines.
- Construcción de payload por entidad.
- Respeto de `update_interval` y `reporting_enabled`.
- Conexión WebSocket, snapshot inicial y eventos `state_changed`.
- Headers y cuerpo enviados a Supabase.
- Reintentos con backoff ante errores 500.
# Bar-Restaurante Sabroso · Logroño

Propuesta de web para Bar-Restaurante Sabroso (C. Duques de Nájera, 109, Logroño).
Diseño y desarrollo: CRS Digital.

Web estática: se publica tal cual con GitHub Pages (rama `main`, carpeta raíz).

## Pendiente de confirmar con el restaurante
No se muestra en la web hasta tenerlo:
- Horario (activa el aviso «Abierto ahora / Cerrado»)
- Precios y alérgenos por plato
- Nombres oficiales de los platos (los actuales son descriptivos, según las fotos)
- Capacidad y menús de grupo
- Sistema de reservas real (el formulario actual es de muestra y no envía datos)
- Datos del titular para Aviso legal y Privacidad
- Permiso de uso de la foto de portada (clientes reconocibles)

## Cuando haya dominio
- Cambiar `og:image` por la dirección completa (`https://dominio/og.jpg`) en las páginas.
- Añadir `url` en los datos de restaurante (bloque `application/ld+json` de `index.html`).

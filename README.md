# CASAS MUREI - Webhook de Messenger

Webhook Node.js + Express para conectar la página de Facebook de CASAS MUREI con Messenger.

## Variables de entorno en Render

- `VERIFY_TOKEN`: un texto secreto que tú eliges y que después debe coincidir con el Identificador de verificación de Meta.
- `PAGE_ACCESS_TOKEN`: el token de acceso de la página generado desde Meta.
- `GRAPH_API_VERSION`: versión de Graph API; el proyecto trae un valor inicial.

## Comandos de Render

Build Command:
`npm install`

Start Command:
`npm start`

## Endpoint

Verificación:
`GET /webhook`

Mensajes:
`POST /webhook`

## Datos ya integrados

- Precio: $799,000
- Ubicación: Buena Vista 3er Sector, El Carmen, Nuevo León
- 2 recámaras
- 1 baño
- Vitropiso
- Protectores en ventanas
- Remodelada
- Sin adeudos
- Únicamente Infonavit o contado
- Avalúo: $6,500
- El avalúo también cubre separación, carta de no propiedad y actualización de documentos oficiales
- La respuesta de disponibilidad está fijada para indicar que la casa está disponible.

## Importante

La estructura técnica está lista. El texto exacto de varias de las 19 preguntas que habíamos definido anteriormente no está visible en el contexto actual de esta sesión, por lo que esos campos quedaron marcados como `null` en `CONVERSATION` en lugar de inventarlos.

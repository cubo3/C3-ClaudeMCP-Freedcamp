# Política de seguridad

## Reportar una vulnerabilidad

Si encuentras un problema de seguridad, **no abras un issue público**. Escribe a **contacto@cubo3.cl** con el asunto "Seguridad: Freedcamp MCP", describiendo el problema y cómo reproducirlo. Respondemos dentro de 5 días hábiles y coordinamos contigo la publicación del arreglo.

## Alcance

- El servidor lee `FREEDCAMP_API_KEY` y `FREEDCAMP_API_SECRET` solo desde el entorno y no los escribe en ningún lado.
- Si crees que tu secreto se filtró, regenéralo desde Freedcamp → My Account → pestaña API; el anterior queda invalidado.

## Versiones soportadas

Se corrigen vulnerabilidades en la última versión publicada.

# Cómo configurar tus llaves de Freedcamp

> **Antes de empezar:** este repositorio trae el archivo de configuración
> del servidor MCP como `mcp.json.template` (sin el punto inicial).
> Renómbralo a **`.mcp.json`** en la raíz del repo antes de usar el plugin
> — así lo espera tu cliente de Claude.

Este plugin necesita dos valores de tu propia cuenta de Freedcamp: la **API key**
y el **API secret**. Nunca van escritos dentro de ningún archivo del plugin
(y menos aún subidos a un repositorio público) — se entregan como
**variables de entorno** en el proceso donde corre el servidor MCP.

## 1. Obtener tus credenciales

1. Entra a Freedcamp → **My Account → pestaña API**
   (`https://freedcamp.com/manage/account#api`).
2. Freedcamp te pedirá reingresar tu contraseña para mostrar el secreto.
3. Copia el **API key** y el **API secret**. Trátalos como una contraseña:
   quien los tenga puede leer y modificar tus proyectos.

## 2. Dónde ponerlos

El archivo `.mcp.json` de este plugin ya viene así:

```json
{
  "mcpServers": {
    "freedcamp": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/servers/freedcamp-server.js"],
      "env": {
        "FREEDCAMP_API_KEY": "${FREEDCAMP_API_KEY}",
        "FREEDCAMP_API_SECRET": "${FREEDCAMP_API_SECRET}"
      }
    }
  }
}
```

Los `${FREEDCAMP_API_KEY}` / `${FREEDCAMP_API_SECRET}` son placeholders:
**no los reemplaces a mano en este archivo**. En su lugar, define esas dos
variables en el entorno donde corre tu cliente de Claude (Claude Desktop,
Claude Code, etc.), usando una de estas vías:

### Opción A — Variables de entorno del sistema (Linux/macOS)

Agrega a tu shell (`~/.bashrc`, `~/.zshrc`) o, en sistemas con systemd, a
`~/.config/environment.d/freedcamp.conf`:

```
FREEDCAMP_API_KEY=tu_api_key_aqui
FREEDCAMP_API_SECRET=tu_api_secret_aqui
```

Cierra sesión y vuelve a entrar (o reinicia) para que se carguen.

### Opción B — Variables de entorno de Windows

PowerShell (como usuario, persistente):

```powershell
[Environment]::SetEnvironmentVariable("FREEDCAMP_API_KEY", "tu_api_key_aqui", "User")
[Environment]::SetEnvironmentVariable("FREEDCAMP_API_SECRET", "tu_api_secret_aqui", "User")
```

Cierra y vuelve a abrir la aplicación de Claude después de esto.

### Opción C — Directamente en `.mcp.json` (solo para uso personal, nunca para publicar)

Si tu cliente de Claude no expande variables de entorno del sistema dentro
de `.mcp.json` (algunos clientes solo expanden sus propias variables
reservadas, como `${CLAUDE_PLUGIN_ROOT}`), puedes como último recurso
reemplazar los placeholders por los valores reales directamente en tu copia
local de `.mcp.json`:

```json
"env": {
  "FREEDCAMP_API_KEY": "valor_real_aqui",
  "FREEDCAMP_API_SECRET": "valor_real_aqui"
}
```

Si haces esto, **ese archivo queda con tu secreto en texto plano**: no lo
subas a ningún repositorio (asegúrate de que esté en `.gitignore` si vas a
versionar tu copia local), no lo compartas, y considéralo equivalente a
compartir tu contraseña de Freedcamp.

## 3. Verificar que funciona

Pídele a Claude algo como "¿qué proyectos tengo en Freedcamp?". Si las
variables no están configuradas, vas a ver un error claro mencionando
`FREEDCAMP_API_KEY` / `FREEDCAMP_API_SECRET` — no es un bug, es el aviso de
que falta el paso 2.

## 4. Si tu secreto se filtró

Vuelve a la pestaña API de tu cuenta Freedcamp y regenera el par
key/secret. El anterior queda invalidado de inmediato.

---
© 2026 Cubo3 Ltda. (contacto@cubo3.cl) — Licencia MIT.
Desarrollado orgullosamente en Chile 🇨🇱.

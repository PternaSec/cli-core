# PternaSec CLI

![PternaSec Banner](https://raw.githubusercontent.com/PternaSec/PternaSec/main/banner.svg)

> **El motor de línea de comandos oficial del Ecosistema PternaSec.**

[![NPM Version](https://img.shields.io/npm/v/pternasec-cli.svg?style=flat-square&color=cyan)](https://www.npmjs.com/package/pternasec-cli)
[![NPM Downloads](https://img.shields.io/npm/dt/pternasec-cli.svg?style=flat-square&color=blue)](https://www.npmjs.com/package/pternasec-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

PternaSec CLI es una herramienta interactiva diseñada para auditores de ciberseguridad, analistas y Penetration Testers. Permite explorar, descargar y ejecutar dinámicamente un vasto repositorio centralizado de herramientas de OSINT, Seguridad Ofensiva y utilidades de Red-Team directamente desde la terminal, sin necesidad de lidiar con clones manuales o dependencias rotas.

---

## ⚡ Características Principales

*   **Exploración Interactiva:** Navega por los dominios de seguridad (OSINT, Red-Team, Blue-Team, etc.) mediante menús desplegables estilo "TUI" (Terminal User Interface).
*   **Buscador Integrado:** Encuentra rápidamente herramientas específicas escaneando todo el repositorio.
*   **Gestión Inteligente de Proyectos:** El CLI descarga los proyectos completos (imágenes, README, dependencias) manteniendo la estructura de la herramienta original intacta.
*   **Ejecución Segura:** Analiza la carpeta descargada, detecta el entrypoint (bash, python, js) e inicia automáticamente la herramienta, o te permite elegir el script a ejecutar manualmente.
*   **Previsualización Dinámica:** Extrae y lee metadatos (como el `README.md` de la herramienta) antes de descargarla para que sepas qué hace.

---

## 📦 Instalación

La manera más recomendada de usar PternaSec CLI es instalándolo de forma global a través de NPM para que esté disponible en cualquier parte de tu sistema.

### Instalación Global (Recomendado)

```bash
npm install -g pternasec
```

### Instalación para Desarrollo Local

Si deseas contribuir al código fuente del CLI:

```bash
git clone https://github.com/PternaSec/cli-core.git
cd cli-core
npm install

# Iniciar en modo desarrollo interactivo
npm run dev
```

---

## 🚀 Uso

Si lo instalaste globalmente, simplemente abre tu terminal y ejecuta:

```bash
pternasec
```

Aparecerá el menú interactivo principal donde podrás:
1.  **Explorar Categorías:** Elegir áreas de especialidad como OSINT.
2.  **Buscar Herramientas:** Escribir palabras clave (ej. `quasar` o `nmap`).
3.  **Descargar / Ejecutar:** Elegir si solo quieres clonar el código a tu máquina para auditoría, o si quieres que PternaSec lo descargue e instale por ti automáticamente.

¡Sigue las instrucciones en pantalla, todos los menús cuentan con protección contra errores y botones de retroceso (`🔙 Volver`)!

---

## 🏗️ Arquitectura y Tecnologías

Este CLI está construido con estándares modernos para máxima velocidad y seguridad:
*   **TypeScript / Node.js**
*   **@clack/prompts:** Para los hermosos flujos de terminal interactiva.
*   **API de GitHub (Git Trees):** Para escaneo recursivo sin necesidad de tener `git` instalado en la máquina destino.

---

## 🛡️ Disclaimer

Las herramientas proporcionadas a través de este CLI están diseñadas exclusivamente para **fines educativos y auditorías de seguridad autorizadas**. Los administradores de PternaSec no se hacen responsables por el uso malintencionado de esta plataforma.

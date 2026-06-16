# 🌍 Plan de Viajes

> **Proyecto Informático II**  
> **Instituto Industrial Luis Augusto Huergo**  
> Plataforma web centralizada e inteligente para la planificación y gestión integral de viajes.

---

## 👥 Autores y Docente
* **Desarrolladores:** 
  * Santino Luciano Rodriguez Fuchs
  * Francisco Gutierrez Filgueira
* **Docente/Profesor:** Ignacio Ezequiel Borassi
* **Fecha de Documentación:** 21 de Abril de 2026

---

## 🎯 Objetivo y Problemática
En la actualidad, los usuarios se enfrentan a una saturación informativa y una fragmentación operativa al planificar sus viajes. Tienen que recurrir a múltiples plataformas aisladas:
* **Reservas y Alojamiento:** Booking, Skyscanner, Kayak.
* **Organización de Itinerarios:** TripIt, Wanderlog.
* **Mapas y Navegación:** Google Maps, Waze.
* **Control de Gastos:** Splitwise.

**Plan de Viajes** soluciona esta fragmentación unificando todas estas dimensiones en un único entorno integrado y personalizado, reduciendo la carga cognitiva y adaptándose dinámicamente ante cualquier imprevisto del viaje.

---

## ✨ Características y Diferenciación
1. **Centralización Completa:** Unificación del itinerario, mapas, control de presupuesto e información turística.
2. **Personalización Avanzada:** Adaptación de las propuestas según las preferencias del usuario (ritmo de viaje, presupuesto, restricciones, tipo de experiencia).
3. **Asistencia Híbrida:** Combinación de procesamiento inteligente y supervisión de agentes/operadores especializados para garantizar la viabilidad logística.
4. **Interactividad Cartográfica:** Visualización espacial continua gracias a la integración con Google Maps.
5. **Persistencia Histórica:** Almacenamiento seguro en la nube para retomar planificaciones y guardar recuerdos de viajes pasados.

---

## 🏗️ Estructura del Repositorio

El repositorio está organizado de la siguiente manera:

* 📁 [**Documentacion/**](./Documentacion/) - Contiene los archivos oficiales de documentación técnica y de negocio del proyecto (en formato PDF y Word).
  * Ver el [README de Documentación](./Documentacion/README.md) para más detalles.
* 📁 [**Proyecto/**](./Proyecto/) - Código fuente de la aplicación web (HTML, CSS, Bootstrap, JavaScript y configuraciones de base de datos).
  * Ver el [README del Proyecto](./Proyecto/README.md) para más detalles técnicos y el esquema de base de datos.
* 📁 [**Maquetados/**](./Maquetados/) - Diseños y maquetas de la interfaz de usuario en media y alta fidelidad.

---

## 🎨 Maquetados (Diseño en Figma)

El diseño visual, la estructura de la interfaz y la experiencia de usuario (UX/UI) de la plataforma fueron planificados y estructurados íntegramente en Figma.

Puedes acceder al proyecto interactivo haciendo clic en el siguiente enlace:

🔗 <a href="https://www.figma.com/design/sq8l7DjAwbSxVZBTh0zcIy/WebApp-Viajes?node-id=0-1&p=f&t=wwZ350gs8zpsUMY5-0" target="_blank">**Proyecto de Figma - WebApp Viajes**</a> (se abrirá en una nueva pestaña).

---

## 🚀 Guía de Inicio Rápido

Si has clonado este repositorio o has descargado el archivo `.zip`, sigue estos pasos para ejecutar y probar la aplicación web de manera local.

### 📋 Requisitos Previos
* Un navegador web moderno (Google Chrome, Mozilla Firefox, Microsoft Edge, Brave, etc.).
* Conexión activa a Internet (necesaria para cargar las librerías CDN de Bootstrap, Font Awesome y la base de datos remota de Supabase).

---

### 🛠️ Métodos de Ejecución

Elige una de las siguientes opciones para iniciar la plataforma en tu computadora:

#### Opción A: Ejecución Directa (Sin Servidor - Rápido)
1. Extrae el archivo `.zip` si descargaste el código comprimido.
2. Abre la carpeta `Proyecto`.
3. Haz doble clic en el archivo [**index.html**](./Proyecto/index.html) para abrirlo directamente en tu navegador web predeterminado.

> [!WARNING]
> Algunos navegadores pueden aplicar restricciones estrictas de seguridad (políticas de CORS/Same-Origin) al cargar archivos locales (`file://`). Si notas problemas al navegar entre páginas o al cargar datos de la base de datos, te recomendamos usar la **Opción B**.

#### Opción B: Ejecución con Servidor Local (Recomendado)
Para evitar problemas de CORS y emular un entorno de producción real, inicia un servidor web ligero en la carpeta `Proyecto`:

* **Usando Python (si lo tienes instalado):**
  1. Abre tu terminal o consola (PowerShell / Command Prompt / Terminal de Linux).
  2. Navega hasta la carpeta del proyecto:
     ```bash
     cd "ruta/a/la/carpeta/Plan-De-Viajes/Proyecto"
     ```
  3. Ejecuta el servidor incorporado:
     ```bash
     python -m http.server 8000
     ```
  4. Abre tu navegador e ingresa a: `http://localhost:8000`

* **Usando VS Code (Live Server):**
  1. Abre la carpeta `Plan-De-Viajes` en Visual Studio Code.
  2. Instala la extensión **Live Server** (creada por Ritwick Dey).
  3. Abre el archivo `Proyecto/index.html`.
  4. Haz clic en el botón **"Go Live"** en la esquina inferior derecha de la ventana de VS Code.
  5. Se abrirá automáticamente el navegador en: `http://127.0.0.1:5500/Proyecto/index.html`

* **Usando Node.js / npm (si los tienes instalados):**
  1. Instala y ejecuta un servidor global desde la terminal en la carpeta `Proyecto`:
     ```bash
     npx serve
     ```
  2. Abre tu navegador en la URL indicada por la consola (generalmente `http://localhost:3000` o `http://localhost:5000`).

---

## 💾 Conexión con la Base de Datos
La aplicación se conecta de forma directa a una base de datos remota en la nube configurada en **Supabase**. 
* Al iniciar sesión o registrarte, los datos se persistirán y validarán automáticamente con la nube.
* Puedes verificar que la conexión sea correcta abriendo las herramientas de desarrollador del navegador (`F12`) y revisando la consola. Debería mostrarse el mensaje:  
  `Conexión exitosa a Supabase. Datos de prueba obtenidos: [...]`

# Dashboard de Prospección y Ventas

Sistema integral para seguimiento de prospección, métricas de setters, callers, scorecards y fuentes de datos conectado a Google Sheets.

## 🚀 Despliegue en la Nube (GitHub + Render)

### 1. Subir a GitHub
`ash
git init
git add .
git commit -m "Initial commit - Dashboard Prospeccion v2.0"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/dashboard-prospeccion.git
git push -u origin main
`

### 2. Desplegar en Render
1. Ve a [Render Dashboard](https://dashboard.render.com/) y selecciona **New > Static Site**.
2. Conecta tu repositorio de GitHub.
3. Configuración:
   - **Build Command**: 
pm install && npm run build
   - **Publish Directory**: dist
4. Haz clic en **Create Static Site**.

---

## 💻 Ejecución Local (Windows)

- **Servidor Local**: Doble clic en 1-INICIAR-SERVIDOR-LOCAL.bat (abre en http://localhost:5185).
- **Compartir por Internet (Ngrok)**: Doble clic en 2-INICIAR-TUNEL-COMPARTIR.bat.


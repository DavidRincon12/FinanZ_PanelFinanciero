# Guía de Instalación Local - FinanZ

Esta guía contiene el paso a paso detallado para configurar y ejecutar el entorno de desarrollo de FinanZ en cualquier computadora nueva (para nuevos desarrolladores o clonación del repositorio).

---

## 🛠 Requisitos Previos
1. **Python 3.10 o superior** instalado y agregado al PATH.
2. **Git** para clonar el repositorio.
3. El administrador del proyecto debe proporcionarte dos archivos de seguridad:
   - `firebase-credentials.json` (Llaves de autenficación de Google).
   - `.env` (Credenciales de la Base de Datos en la Nube y Secretos de Django).

---

## 🚀 Paso a Paso

### 1. Clonar el repositorio
Abre tu terminal y trae el código fuente a tu máquina local:
```bash
git clone https://github.com/DavidRincon12/FinanZ_PanelFinanciero.git
cd FinanZ_PanelFinanciero
```

### 2. Crear y Activar el Entorno Virtual
Es crucial usar un entorno virtual para no instalar librerías globalmente en tu sistema operativo:
```bash
python -m venv .venv
```
**Actívalo**:
- **En Windows** `.venv\Scripts\activate`


### 3. Posicionarse e Instalar Dependencias
Entra la carpeta del backend e instala todas las librerías oficiales del proyecto:
```bash
cd backend
pip install -r requirements/local.txt
```

### 4. Configurar Credenciales y Secretos
**Mueve a la RAÍZ absoluta del proyecto** (la carpeta `FinanZ_PanelFinanciero/` principal) los dos archivos que te entregó el administrador:
- `firebase-credentials.json`
- `.env`

*(Ambos archivos están protegidos por el `.gitignore`, por lo que **NUNCA** se subirán a Github).*

### 5. Sincronizar Base de Datos (Neon DB)
Asegúrate de que tu terminal sigue abierta dentro de la carpeta `backend/` y sincroniza las tablas de Django con la base de datos externa de Neon:
```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Levantar el Servidor
Finalmente, arranca la aplicación de Django:
```bash
python manage.py runserver
```

---

## 🔑 Pruebas de Acceso

Abre en tu navegador favorito y accede a:
👉 `http://localhost:8000/login/`

**Importante sobre la Autenticación (Google Identity Services):**
- Si la app te lanza un error de "Origin Mismatch" o "Unauthorized origin", asegúrate de estar visitando estrictamente la URL `http://localhost:8000` o `http://127.0.0.1:8000` (El puerto es obligatorio).
- Si usas navegadores ultraseguros o configuraciones anti-rastreo (Ej: Brave Shields o Prevención de Seguimiento en Microsoft Edge), el inicio de sesión podría ser interceptado. Añade una excepción a tu `localhost`.

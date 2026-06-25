# 🔐 Sistema de Autenticación JWT - Despliegue

## ✅ ARCHIVOS LOCALES LISTOS (biometrico js/)

Los siguientes archivos ya están configurados localmente:

- ✅ `login.html` - Página de inicio de sesión
- ✅ `admin.html` - Panel de administración de usuarios
- ✅ `api.js` - Actualizado con JWT automático
- ✅ `app.js` - Verificación de autenticación al inicio
- ✅ `index.html` - Botón de logout y panel de usuario

## 📋 PASOS PARA DESPLEGAR EN AWS

### 1️⃣ Conectar al servidor AWS

```bash
ssh ubuntu@3.17.205.81
```

### 2️⃣ Activar entorno virtual

```bash
cd /home/fastapi_postgres_app
source venv/bin/activate
```

### 3️⃣ Verificar que auth.py existe

```bash
ls -la auth.py
# Debe mostrar: -rw-r--r-- (archivo, NO directorio azul)
```

### 4️⃣ Instalar python-multipart (si no está instalado)

```bash
pip install python-multipart
```

### 5️⃣ Crear la tabla system_users en PostgreSQL

```bash
python3 -c "
from database import engine
from models import SystemUser

# Crear tabla
SystemUser.__table__.create(engine, checkfirst=True)
print('✅ Tabla system_users creada')
"
```

### 6️⃣ Crear usuario super_admin inicial

```bash
python3 -c "
from database import SessionLocal
from models import SystemUser
from auth import get_password_hash
from datetime import datetime

db = SessionLocal()

# Verificar si ya existe
existing = db.query(SystemUser).filter(SystemUser.username == 'admin').first()
if existing:
    print('⚠️  Usuario admin ya existe')
else:
    # Crear super_admin
    admin = SystemUser(
        username='admin',
        email='admin@megatk.com',
        password_hash=get_password_hash('admin123'),
        full_name='Super Administrador',
        role='super_admin',
        is_active=True,
        created_at=datetime.utcnow()
    )
    db.add(admin)
    db.commit()
    print('✅ Usuario super_admin creado')
    print('   Username: admin')
    print('   Password: admin123')

db.close()
"
```

### 7️⃣ Subir main.py actualizado al servidor

**Desde tu máquina local (Windows PowerShell):**

```powershell
cd "c:\Users\jiova\OneDrive\Documentos\biometricos\python2412\python2412\servidor"
scp main.py ubuntu@3.17.205.81:/home/fastapi_postgres_app/
```

### 8️⃣ Reiniciar el servicio

**En el servidor AWS:**

```bash
sudo systemctl restart boca-urna2025.service
sudo systemctl status boca-urna2025.service
```

### 9️⃣ Verificar los logs

```bash
sudo journalctl -u boca-urna2025.service -f
```

## 🌐 USAR LA APLICACIÓN LOCALMENTE

### 1. Abrir la aplicación

Desde tu carpeta local `biometrico js/`, abre en el navegador:

```
file:///c:/Users/jiova/OneDrive/Documentos/biometricos/python2412/python2412/biometrico%20js/login.html
```

O usa el servidor local:

```bash
cd "c:\Users\jiova\OneDrive\Documentos\biometricos\python2412\python2412\biometrico js"
python -m http.server 8080
```

Luego abre: `http://localhost:8080/login.html`

### 2. Iniciar sesión

- **Usuario**: `admin`
- **Contraseña**: `admin123`

### 3. Navegación

- **Login** → Si es admin → **Panel Admin** (admin.html)
- **Login** → Si es operador → **Dashboard Principal** (index.html)
- Desde index.html puedes acceder al **Panel Admin** con el botón "🔐 Panel Admin"
- **Cerrar Sesión** desde cualquier página con el botón "🚪 Cerrar Sesión"

## 🔒 ROLES DE USUARIO

- **super_admin**: Acceso total, puede crear/editar/eliminar usuarios
- **admin**: Similar a super_admin, gestión de usuarios
- **operator**: Acceso completo al dashboard, sin gestión de usuarios
- **viewer**: Solo lectura

## 🛠️ ENDPOINTS DE AUTENTICACIÓN

### Login
```
POST /api/auth/login
Content-Type: application/x-www-form-urlencoded

username=admin&password=admin123
```

### Obtener usuario actual
```
GET /api/auth/me
Authorization: Bearer {token}
```

### Crear usuario (solo super_admin)
```
POST /api/users/
Authorization: Bearer {token}
Content-Type: application/json

{
  "username": "operador1",
  "email": "operador@megatk.com",
  "password": "password123",
  "full_name": "Juan Pérez",
  "role": "operator",
  "is_active": true
}
```

## 📝 NOTAS IMPORTANTES

1. **Los templates NO se suben al servidor** - Las páginas HTML (login.html, admin.html) se sirven localmente desde tu carpeta "biometrico js/"

2. **El servidor solo provee la API** - FastAPI solo maneja los endpoints de autenticación y datos, no sirve HTML

3. **JWT Token** - Se almacena en localStorage con clave `access_token`, válido por 8 horas

4. **Verificación automática** - Si el token expira o es inválido, se redirige automáticamente a login

5. **CORS** - Asegúrate de que el servidor permite CORS desde tu dominio local

## 🐛 TROUBLESHOOTING

### Error: "No module named 'auth'"
```bash
# Verificar que auth.py existe como ARCHIVO
ls -la /home/fastapi_postgres_app/auth.py
```

### Error: "Table 'system_users' doesn't exist"
```bash
# Crear la tabla manualmente
python3 -c "from database import engine; from models import SystemUser; SystemUser.__table__.create(engine)"
```

### Error: "Token inválido"
- Limpia localStorage en el navegador (F12 → Application → Local Storage → Clear)
- Haz login nuevamente

### No se puede conectar al servidor
- Verifica que el servicio esté corriendo: `sudo systemctl status boca-urna2025.service`
- Verifica la URL en `config.js`: `http://3.141.98.252:7792`

---

**¡Sistema listo para usar! 🚀**

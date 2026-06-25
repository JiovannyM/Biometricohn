@echo off
echo Iniciando servidor local para la aplicacion biometrica...
echo.
echo Abre tu navegador en: http://127.0.0.1:5040
echo.
echo Presiona Ctrl+C para detener el servidor
echo.
python -m http.server 5040

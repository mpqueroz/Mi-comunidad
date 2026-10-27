#!/usr/bin/env bash
# Despliegue limitado a Checkout y webhook; nunca reglas, Hosting ni Sandbox.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

python3 - <<'PY'
import getpass
import hmac
import subprocess
import sys

def leer(nombre):
    return subprocess.check_output([
        "gcloud", "secrets", "versions", "access", "latest",
        "--secret=" + nombre, "--project=mercado-ciudadano"
    ]).decode()

esperados = {
    "MC_MP_ENVIRONMENT": "test",
    "MC_PLAN_ANUAL_CLP": "1000",
    "MC_MP_WEBHOOK_URL": "https://us-central1-mercado-ciudadano.cloudfunctions.net/webhookMercadoPagoMiComunidad"
}
for nombre, esperado in esperados.items():
    if leer(nombre) != esperado:
        sys.exit("Configuración distinta a la prueba preparada: " + nombre)

# La procedencia TEST se comprueba en Credenciales de prueba del panel.
# /users/me no es una comprobación de permisos para Checkout Pro.
token = getpass.getpass("Pega el Access Token de CREDENCIALES DE PRUEBA y presiona Enter: ")
print("Caracteres recibidos:", len(token))
if (not 60 <= len(token) <= 512 or not token.isascii() or
        any(c.isspace() for c in token) or
        not token.startswith(("APP_USR-", "TEST-"))):
    sys.exit("No parece un Access Token completo. No se guardó ni desplegó nada.")
guardado = leer("MC_MP_ACCESS_TOKEN")
if not hmac.compare_digest(guardado.encode(), token.encode()):
    subprocess.run([
        "gcloud", "secrets", "versions", "add", "MC_MP_ACCESS_TOKEN",
        "--project=mercado-ciudadano", "--data-file=-"
    ], input=token.encode(), check=True)
    print("Access Token actualizado con la credencial copiada del panel de prueba.")
else:
    print("El Access Token coincide con la credencial copiada del panel de prueba.")
print("Configuración lista para desplegar; acceso a la API y compra aún pendientes de validar.")
PY

npm --prefix functions ci --no-audit --no-fund
node --check functions/mercadopago.js
npm --prefix functions test
npx --yes firebase-tools deploy \
  --project mercado-ciudadano \
  --only functions:mi-comunidad:crearCheckoutMiComunidad,functions:mi-comunidad:webhookMercadoPagoMiComunidad \
  --non-interactive

for funcion in crearCheckoutMiComunidad webhookMercadoPagoMiComunidad; do
  gcloud functions describe "$funcion" --gen2 --region=us-central1 \
    --project=mercado-ciudadano \
    --format="yaml(name,state,serviceConfig.uri,serviceConfig.secretEnvironmentVariables)"
done

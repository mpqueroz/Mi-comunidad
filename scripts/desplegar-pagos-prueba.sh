#!/usr/bin/env bash
# Despliegue limitado a Checkout y webhook; nunca reglas, Hosting ni Sandbox.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

python3 - <<'PY'
import json
import subprocess
import sys
import urllib.error
import urllib.request

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

token = leer("MC_MP_ACCESS_TOKEN")
if not token or token != token.strip():
    sys.exit("El Access Token está vacío o tiene espacios: no se desplegó nada.")
if not token.startswith("TEST-"):
    solicitud = urllib.request.Request(
        "https://api.mercadopago.com/users/me",
        headers={"Authorization": "Bearer " + token}
    )
    try:
        with urllib.request.urlopen(solicitud, timeout=20) as respuesta:
            usuario = json.load(respuesta)
    except urllib.error.HTTPError as error:
        sys.exit("No se pudo validar la credencial (HTTP " + str(error.code) + "). No se desplegó nada.")
    if "test_user" not in usuario.get("tags", []):
        sys.exit("La credencial pertenece a una cuenta que no está identificada como usuario de prueba. No se desplegó nada.")
print("Configuración y credencial de prueba comprobadas. No se creó ningún pago.")
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

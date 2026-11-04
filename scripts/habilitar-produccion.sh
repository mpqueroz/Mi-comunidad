#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
root_dir="$PWD"
# Instalar y probar antes de consultar credenciales. No crear secretos ni IAM.
npm --prefix functions ci --ignore-scripts --no-audit --no-fund
npm --prefix functions test
npm --prefix tests ci --ignore-scripts --no-audit --no-fund
npm --prefix tests audit --audit-level=moderate
staging_parent="$(mktemp -d)"
trap 'rm -rf "$staging_parent"' EXIT
# Declaraciones productivas desde el análisis, nunca parche posterior desde TEST.
node scripts/preparar-pagos-produccion.cjs "$staging_parent/release"
npm --prefix "$staging_parent/release/functions" ci --ignore-scripts --no-audit --no-fund
gcloud auth print-access-token >/dev/null
python3 "$root_dir/scripts/conectar-produccion.py" --preflight
cd "$staging_parent/release"
node "$root_dir/scripts/firebase-cli.cjs" deploy --project mercado-ciudadano --config firebase.json \
  --only functions:mi-comunidad:webhookMercadoPagoMiComunidad,functions:mi-comunidad:conciliarPagosMiComunidad,functions:mi-comunidad:consultarLicenciaMiComunidad,functions:mi-comunidad:cotizarPlanMiComunidad,functions:mi-comunidad:resolverRevisionPagoMiComunidad,functions:mi-comunidad:reiniciarCheckoutFallidoMiComunidad,functions:mi-comunidad:crearCheckoutMiComunidad \
  --non-interactive
python3 "$root_dir/scripts/conectar-produccion.py"
node "$root_dir/scripts/comprobar-despliegue.cjs" --commercial

#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
# Probar y publicar el bloqueo de fixtures antes de conectar credenciales reales.
gcloud auth print-access-token >/dev/null
npm --prefix functions ci --no-audit --no-fund
npm --prefix functions test
npx --yes firebase-tools deploy --project mercado-ciudadano \
  --only functions:mi-comunidad:crearCheckoutMiComunidad,functions:mi-comunidad:webhookMercadoPagoMiComunidad \
  --non-interactive
python3 scripts/conectar-produccion.py

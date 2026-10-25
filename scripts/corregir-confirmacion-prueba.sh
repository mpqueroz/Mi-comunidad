#!/usr/bin/env bash
# Solo funciones de pago de Mi Comunidad. No publica Hosting ni reglas.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
npm --prefix functions ci --no-audit --no-fund
npm --prefix functions test
node scripts/recuperar-pago-prueba.js --prepare
npx --yes firebase-tools deploy --project mercado-ciudadano \
  --only functions:mi-comunidad:crearCheckoutMiComunidad,functions:mi-comunidad:webhookMercadoPagoMiComunidad \
  --non-interactive
node scripts/recuperar-pago-prueba.js --apply
node scripts/recuperar-pago-prueba.js --apply

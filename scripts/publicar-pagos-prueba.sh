#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
npm --prefix functions ci --no-audit --no-fund
npm --prefix functions test
npx --yes firebase-tools deploy --project mercado-ciudadano \
  --only functions:mi-comunidad:consultarLicenciaMiComunidad --non-interactive
node scripts/crear-acceso-pagos-prueba.js
npx --yes firebase-tools hosting:channel:deploy pagos-prueba \
  --project mercado-ciudadano --config firebase.pagos-prueba.json \
  --expires 7d --non-interactive

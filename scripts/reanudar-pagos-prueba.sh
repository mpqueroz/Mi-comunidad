#!/usr/bin/env bash
# La consulta ya está desplegada: reanudar únicamente acceso y canal temporal.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
npm --prefix functions ci --no-audit --no-fund
node scripts/crear-acceso-pagos-prueba.js
npx --yes firebase-tools hosting:channel:deploy pagos-prueba \
  --project mercado-ciudadano --config firebase.pagos-prueba.json \
  --expires 7d --non-interactive

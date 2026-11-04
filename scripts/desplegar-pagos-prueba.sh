#!/usr/bin/env bash
set -euo pipefail
# El procedimiento histórico usaba los mismos nombres que producción.
# No conservar una opción para omitir este bloqueo.
printf '%s\n' 'BLOQUEADO: este despliegue TEST sobrescribía checkout y webhook productivos.' >&2
printf '%s\n' 'Preparar el candidato aislado con scripts/preparar-pagos-e2e.cjs y revisar docs/pagos-e2e.md.' >&2
exit 1

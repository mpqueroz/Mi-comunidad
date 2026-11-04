#!/usr/bin/env python3
"""Verificación de solo lectura; no parchea funciones, IAM ni secretos."""
import json
import subprocess
import sys
PROJECT = "mercado-ciudadano"
EXPECTED = {
    "crearCheckoutMiComunidad": {"MC_MP_ACCESS_TOKEN", "MC_PLAN_ANUAL_CLP", "MC_MP_ENVIRONMENT", "MC_MP_WEBHOOK_URL", "MC_MP_TEST_ACCOUNT"},
    "cotizarPlanMiComunidad": {"MC_PLAN_ANUAL_CLP", "MC_MP_ENVIRONMENT"},
    "resolverRevisionPagoMiComunidad": {"MC_MP_ACCESS_TOKEN"},
    "reiniciarCheckoutFallidoMiComunidad": {"MC_MP_ACCESS_TOKEN"},
    "webhookMercadoPagoMiComunidad": {"MC_MP_ACCESS_TOKEN", "MC_MP_WEBHOOK_SECRET"},
    "conciliarPagosMiComunidad": {"MC_MP_ACCESS_TOKEN"},
    "consultarLicenciaMiComunidad": set(),
}
def read(*args):
    result = subprocess.run(["gcloud", *args, "--project=" + PROJECT, "--format=json"], capture_output=True, text=True, check=True)
    return json.loads(result.stdout)
def verify_bindings(name, function, project_ids=None):
    project_ids = project_ids or {PROJECT}
    if function.get("state") != "ACTIVE":
        raise ValueError("Función no activa: " + name)
    bindings = function.get("serviceConfig", {}).get("secretEnvironmentVariables", [])
    actual = {item["key"]: item for item in bindings}
    if set(actual) != {key + "_PRODUCTION" for key in EXPECTED[name]}:
        raise ValueError("Secretos inesperados en " + name)
    for key, item in actual.items():
        if item.get("secret") != key or not item.get("version") or str(item.get("projectId")) not in project_ids:
            raise ValueError("Enlace de secreto inválido en " + name)
def verify_receipt_ttl(fields):
    suffix = "/collectionGroups/mi_comunidad_webhook_recibos/fields/expiresAt"
    matching = [field for field in fields if field.get("name", "").endswith(suffix)]
    if len(matching) != 1 or matching[0].get("ttlConfig", {}).get("state") != "ACTIVE":
        raise ValueError("TTL de recibos webhook no ACTIVE; preparar expiresAt y esperar antes de publicar")
    if matching[0]["ttlConfig"].get("expirationOffset", "0s") not in ("0s", "0.000000000s"):
        raise ValueError("TTL de recibos tiene un desplazamiento inesperado")
def preflight():
    verify_receipt_ttl(read("firestore", "fields", "ttls", "list", "--collection-group=mi_comunidad_webhook_recibos", "--database=(default)"))
    for key in {key for keys in EXPECTED.values() for key in keys}:
        data = read("secrets", "versions", "describe", "latest", "--secret=" + key + "_PRODUCTION")
        if data.get("state") != "ENABLED":
            raise ValueError("Secreto no habilitado: " + key + "_PRODUCTION")
    # Solo configuración no sensible. Tokens y firmas nunca se leen ni imprimen.
    expected = {"MC_MP_ENVIRONMENT_PRODUCTION": "production", "MC_PLAN_ANUAL_CLP_PRODUCTION": "800000", "MC_MP_WEBHOOK_URL_PRODUCTION": "https://us-central1-mercado-ciudadano.cloudfunctions.net/webhookMercadoPagoMiComunidad"}
    for secret, value in expected.items():
        result = subprocess.run(["gcloud", "secrets", "versions", "access", "latest", "--secret=" + secret, "--project=" + PROJECT], capture_output=True, text=True, check=True)
        if result.stdout.strip() != value:
            raise ValueError("Configuración productiva inesperada: " + secret)
    print("TTL y configuración comercial esperada verificados; ningún recurso modificado.")
def main():
    preflight()
    if "--preflight" in sys.argv:
        return
    project = read("projects", "describe", PROJECT)
    project_ids = {PROJECT, str(project["projectNumber"])}
    for name in EXPECTED:
        verify_bindings(name, read("functions", "describe", name, "--gen2", "--region=us-central1"), project_ids)
        print(name + ": activa y configuración de producción verificada")
    job = read("scheduler", "jobs", "describe", "firebase-schedule-conciliarPagosMiComunidad-us-central1", "--location=us-central1")
    if job.get("state") != "ENABLED":
        raise ValueError("Conciliación programada no habilitada")
    print("Conciliación habilitada. Compra y reversos reales requieren validación separada.")
if __name__ == "__main__":
    try:
        main()
    except (ValueError, subprocess.CalledProcessError, json.JSONDecodeError) as error:
        raise SystemExit("No se confirmó producción; no iniciar pagos. " + str(error)) from None

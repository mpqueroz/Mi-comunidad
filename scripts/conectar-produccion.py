#!/usr/bin/env python3
"""Conecta únicamente los dos endpoints comerciales; no publica Hosting ni reglas."""
import json
import subprocess
import time
import urllib.request
import urllib.error

PROJECT = "mercado-ciudadano"
ROOT = "projects/" + PROJECT + "/locations/us-central1/functions/"
API = "https://cloudfunctions.googleapis.com/v2/"

def gcloud(*args, value=None):
    result = subprocess.run(["gcloud", *args, "--project=" + PROJECT],
                            input=value, text=True, capture_output=True)
    if result.returncode:
        raise SystemExit("Google Cloud rechazó la operación: " + " ".join(args[:3]) +
                         ". Revisa autorización y permisos. No repitas compras.")
    return result.stdout.strip()

TOKEN = gcloud("auth", "print-access-token")

def api(path, payload=None, method=None):
    req = urllib.request.Request(API + path,
        data=json.dumps(payload).encode() if payload is not None else None,
        headers={"Authorization": "Bearer " + TOKEN, "Content-Type": "application/json"},
        method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        raise SystemExit("Google Cloud respondió HTTP " + str(error.code) +
                         ". Cambio incompleto; no inicies pagos.") from None

def wait(operation):
    for attempt in range(180):
        result = api(operation["name"])
        if result.get("done"):
            if result.get("error"):
                raise SystemExit("Actualización rechazada por Google Cloud. No inicies pagos.")
            return
        if attempt % 6 == 0:
            print("Google Cloud sigue aplicando el cambio…", flush=True)
        time.sleep(5)
    raise SystemExit("La operación sigue en curso. No repitas el comando ni inicies pagos.")

def version(secret):
    data = json.loads(gcloud("secrets", "versions", "describe", "latest",
                             "--secret=" + secret, "--format=json"))
    if data.get("state") != "ENABLED":
        raise SystemExit("Secreto no habilitado: " + secret)
    return data["name"].rsplit("/", 1)[-1]

def constant(secret, value):
    result = subprocess.run(["gcloud", "secrets", "describe", secret,
                             "--project=" + PROJECT], capture_output=True, text=True)
    if result.returncode:
        if "NOT_FOUND" not in result.stderr:
            raise SystemExit("No se pudo consultar " + secret)
        gcloud("secrets", "create", secret, "--replication-policy=automatic")
    name = gcloud("secrets", "versions", "add", secret,
                  "--data-file=-", "--format=value(name)", value=value)
    return name.rsplit("/", 1)[-1]

functions = {name: api(ROOT + name) for name in
             ("crearCheckoutMiComunidad", "webhookMercadoPagoMiComunidad")}
for name, function in functions.items():
    if function.get("state") != "ACTIVE":
        raise SystemExit("Función no activa: " + name)

access = "MC_MP_ACCESS_TOKEN_PRODUCTION"
signature = "MC_MP_WEBHOOK_SECRET_PRODUCTION"
versions = {access: version(access), signature: version(signature)}
# Configuración comercial confirmada por Marcelo: 800000 CLP / 12 meses.
versions["MC_PLAN_ANUAL_CLP_PRODUCTION"] = constant("MC_PLAN_ANUAL_CLP_PRODUCTION", "800000")
versions["MC_MP_ENVIRONMENT_PRODUCTION"] = constant("MC_MP_ENVIRONMENT_PRODUCTION", "production")
mapping = {"MC_MP_ACCESS_TOKEN": access, "MC_MP_WEBHOOK_SECRET": signature,
           "MC_PLAN_ANUAL_CLP": "MC_PLAN_ANUAL_CLP_PRODUCTION",
           "MC_MP_ENVIRONMENT": "MC_MP_ENVIRONMENT_PRODUCTION"}
plans = {}
for name, function in functions.items():
    config = function["serviceConfig"]
    bindings = config.get("secretEnvironmentVariables", [])
    expected = {"MC_MP_ACCESS_TOKEN", "MC_PLAN_ANUAL_CLP", "MC_MP_ENVIRONMENT"} if name.startswith("crear") else {"MC_MP_ACCESS_TOKEN", "MC_MP_WEBHOOK_SECRET"}
    if not expected.issubset({item["key"] for item in bindings}):
        raise SystemExit("Configuración inesperada en " + name + ". No se conectó producción.")
    account = config.get("serviceAccountEmail")
    if not account:
        raise SystemExit("Falta cuenta de servicio en " + name)
    for item in bindings:
        if item["key"] in mapping:
            target = mapping[item["key"]]
            gcloud("secrets", "add-iam-policy-binding", target,
                   "--member=serviceAccount:" + account,
                   "--role=roles/secretmanager.secretAccessor", "--quiet")
            item.update(projectId=PROJECT, secret=target, version=versions[target])
    plans[name] = bindings

# Primero receptor de avisos; después habilitar nuevas compras reales.
for name in ("webhookMercadoPagoMiComunidad", "crearCheckoutMiComunidad"):
    print("Conectando " + name + "…", flush=True)
    wait(api(ROOT + name + "?updateMask=serviceConfig.secretEnvironmentVariables",
             {"serviceConfig": {"secretEnvironmentVariables": plans[name]}}, "PATCH"))
    current = api(ROOT + name)
    actual = {s["key"]: (s["secret"], s["version"]) for s in current["serviceConfig"]["secretEnvironmentVariables"]}
    if current.get("state") != "ACTIVE" or any(actual.get(s["key"]) != (s["secret"], s["version"]) for s in plans[name]):
        raise SystemExit("No se confirmó la configuración. No inicies pagos.")
print("SERVIDOR CONECTADO: producción, 800000 CLP, 12 meses.")
print("Pendiente validar la pantalla comercial. No uses el enlace de prueba para comprar.")

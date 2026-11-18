"""Deshabilitación privada de exactamente dos cuentas de prueba autorizadas.
Solo biblioteca estándar. Nunca ejecutar en CI. No elimina usuarios ni escribe Firestore.
"""
import argparse
import copy
import json
import os
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request

PROJECT = "mercado-ciudadano"
AUTH = "https://identitytoolkit.googleapis.com/v1/projects/" + PROJECT
FIRESTORE = "https://firestore.googleapis.com/v1/projects/" + PROJECT + "/databases/(default)/documents/mi_comunidad_comunidades/"
FIELDS = "users(localId,email,displayName,disabled,customAttributes,createdAt),nextPageToken"


class Stop(Exception):
    pass


def identifier(value):
    return isinstance(value, str) and 0 < len(value) <= 128 and value not in (".", "..") and "/" not in value and all(ord(c) >= 32 and ord(c) != 127 for c in value)


def claims(user):
    value = json.loads(user.get("customAttributes") or "{}")
    if not isinstance(value, dict):
        raise Stop("CLAIMS_NO_VERIFICABLES")
    return value


def list_users(request):
    users, seen, token = [], set(), None
    while True:
        query = {"maxResults": 1000, "fields": FIELDS}
        if token:
            query["nextPageToken"] = token
        data = request("GET", AUTH + "/accounts:batchGet?" + urllib.parse.urlencode(query))
        page = data.get("users", [])
        if not isinstance(page, list):
            raise Stop("LISTADO_NO_VERIFICABLE")
        users.extend(page)
        token = data.get("nextPageToken")
        if not token:
            break
        if token in seen:
            raise Stop("PAGINACION_REPETIDA")
        seen.add(token)
    ids = [u.get("localId") for u in users]
    if any(not identifier(uid) for uid in ids) or len(set(ids)) != len(ids):
        raise Stop("IDENTIDADES_NO_UNICAS")
    return users


def snapshot(request, user):
    c = claims(user)
    if c.get("app") != "mi_comunidad" or c.get("role") != "admin" or user.get("disabled", False) is not False:
        raise Stop("CUENTA_FUERA_DE_ALCANCE")
    uid, cid = user.get("localId"), c.get("comunidadId")
    if not identifier(uid) or not identifier(cid):
        raise Stop("IDENTIDAD_NO_VERIFICABLE")
    base = FIRESTORE + urllib.parse.quote(cid, safe="")
    profile = request("GET", base + "/administradores/" + urllib.parse.quote(uid, safe="") + "?mask.fieldPaths=estado")
    if profile is not None:
        raise Stop("FICHA_PRESENTE")
    mask = urllib.parse.urlencode({"mask.fieldPaths": ["nombre", "adminNombre", "adminUid", "estado"]}, doseq=True)
    community = request("GET", base + "?" + mask)
    if not isinstance(community, dict):
        raise Stop("COMUNIDAD_NO_VERIFICABLE")
    return {"user": copy.deepcopy(user), "community": community}


def candidates(request):
    result = []
    for user in list_users(request):
        c = claims(user)
        if c.get("app") == "mi_comunidad" and c.get("role") == "admin" and user.get("disabled", False) is False:
            try:
                result.append(snapshot(request, user))
            except Stop as error:
                if str(error) != "FICHA_PRESENTE":
                    raise
    if len(result) != 2:
        raise Stop("SE_REQUIEREN_EXACTAMENTE_DOS_CANDIDATAS")
    return result


def current(request, uid):
    found = [u for u in list_users(request) if u["localId"] == uid]
    if len(found) != 1:
        raise Stop("CUENTA_NO_UNICA")
    return found[0]


def apply(request, plans, identified_as_test, progress):
    if identified_as_test is not True or len(plans) != 2 or len({p["user"]["localId"] for p in plans}) != 2:
        raise Stop("IDENTIFICACION_PRIVADA_REQUERIDA")
    # Comprobar las dos antes de escribir. Repetir para cada una inmediatamente antes.
    for p in plans:
        if snapshot(request, current(request, p["user"]["localId"])) != p:
            raise Stop("ESTADO_CAMBIO")
    for p in plans:
        uid = p["user"]["localId"]
        if snapshot(request, current(request, uid)) != p:
            raise Stop("ESTADO_CAMBIO")
        progress["intentos"] += 1
        # Única escritura admitida. Proyecto fijo; conserva claims, correo y datos.
        request("POST", AUTH + "/accounts:update", {"localId": uid, "disableUser": True})
        after = current(request, uid)
        expected = dict(p["user"], disabled=True)
        if after != expected:
            raise Stop("RESULTADO_NO_VERIFICADO")
        progress["deshabilitadasVerificadas"] += 1


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def transport(token):
    opener = urllib.request.build_opener(NoRedirect())

    def request(method, url, body=None):
        parsed = urllib.parse.urlsplit(url)
        auth_read = method == "GET" and url.startswith(AUTH + "/accounts:batchGet?")
        fs_read = method == "GET" and url.startswith(FIRESTORE)
        auth_write = method == "POST" and url == AUTH + "/accounts:update" and isinstance(body, dict) and set(body) == {"localId", "disableUser"} and identifier(body["localId"]) and body["disableUser"] is True
        if not (auth_read or fs_read or auth_write) or parsed.scheme != "https" or parsed.username or parsed.password:
            raise Stop("PETICION_FUERA_DE_ALCANCE")
        headers = {"Authorization": "Bearer " + token, "x-goog-user-project": PROJECT}
        data = None
        if body is not None:
            headers["Content-Type"] = "application/json"
            data = json.dumps(body).encode()
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with opener.open(req, timeout=30) as response:
                # No conservar el cuerpo del POST, que puede contener datos sensibles.
                return {} if method == "POST" else json.load(response)
        except urllib.error.HTTPError as error:
            code = error.code
            error.close()
            if code == 404 and fs_read:
                return None
            raise Stop("HTTP_" + str(code)) from None
        except (urllib.error.URLError, OSError, ValueError):
            raise Stop("CONSULTA_O_ESCRITURA_NO_CONFIRMADA") from None
    return request


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--project", required=True, choices=[PROJECT])
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    progress = {"intentos": 0, "deshabilitadasVerificadas": 0}
    try:
        if os.environ.get("GITHUB_ACTIONS") or os.environ.get("CI") or not sys.stdin.isatty():
            raise Stop("SOLO_TERMINAL_PRIVADA")
        token = subprocess.check_output(["gcloud", "auth", "print-access-token"], text=True, stderr=subprocess.DEVNULL).strip()
        if not token:
            raise Stop("SESION_NO_DISPONIBLE")
        request = transport(token)
        plans = candidates(request)
        print("REVISIÓN PRIVADA. No compartas esta tabla ni capturas de ella.")
        for i, p in enumerate(plans, 1):
            u, f = p["user"], p["community"].get("fields", {})
            # JSON escapa caracteres de control; no imprime tokens/contraseñas.
            print(json.dumps({"cuenta": i, "nombre": u.get("displayName", ""), "correoAcceso": u.get("email", ""),
                              "comunidad": f.get("nombre", {}).get("stringValue", ""),
                              "administradorRegistrado": f.get("adminNombre", {}).get("stringValue", "")}, ensure_ascii=True))
        if not args.apply:
            print("Plan de solo lectura. Ninguna cuenta modificada.")
            return 0
        print("Identifica las dos cuentas: deben ser exactamente las de prueba que autorizaste deshabilitar.")
        print("La cuenta superadmin queda excluida. Conserva todos los datos. No hagas cambios administrativos en paralelo.")
        answer = input("Si reconoces AMBAS como pruebas, escribe PRUEBA 1 Y 2; de lo contrario pulsa Enter: ")
        if answer != "PRUEBA 1 Y 2":
            raise Stop("IDENTIDADES_NO_CONFIRMADAS")
        apply(request, plans, True, progress)
        print(json.dumps({"resultado": "OK", **progress, "datosEliminados": False, "produccionPublicada": False}))
        print("Comparte solamente la línea resultado=OK. La revisión global de publicación sigue pendiente.")
        return 0
    except (Stop, ValueError, KeyError, TypeError, OSError, subprocess.SubprocessError, EOFError, KeyboardInterrupt) as error:
        code = str(error) if isinstance(error, Stop) else "ENTORNO_O_DATOS_NO_VERIFICABLES"
        print(json.dumps({"resultado": "DETENIDO", "codigo": code, **progress,
                          "posibleCambioSinVerificar": progress["intentos"] > progress["deshabilitadasVerificadas"]}))
        return 1


if __name__ == "__main__":
    sys.exit(main())

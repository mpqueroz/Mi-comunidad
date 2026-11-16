"""Plan privado de SOLO LECTURA. Nunca ejecutar en Actions ni publicar su salida completa."""
import argparse
import hashlib
import json
import os
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request

PROJECT = 'mercado-ciudadano'


class SafeDiagnostic(Exception):
    """Solo códigos predefinidos, nunca mensajes/cuerpos de servicios externos."""
    def __init__(self, stage, code, http_status=None):
        self.result = {'soloLectura': True, 'fase': stage, 'codigo': code}
        if http_status is not None:
            self.result['http'] = http_status
        super().__init__(code)


def identifier(value):
    return isinstance(value, str) and 0 < len(value) <= 128 and value not in ['.', '..'] and '/' not in value and not any(ord(c) < 32 or ord(c) == 127 for c in value)


def field(document, key):
    return document.get('fields', {}).get(key, {}).get('stringValue', '')


def private_plan(read):
    accounts, seen, token = [], set(), None
    while True:
        query = {'maxResults': 1000, 'fields': 'users(localId,displayName,disabled,customAttributes),nextPageToken'}
        if token:
            query['nextPageToken'] = token
        data = read('https://identitytoolkit.googleapis.com/v1/projects/' + PROJECT + '/accounts:batchGet?' + urllib.parse.urlencode(query))
        accounts.extend(data.get('users', []))
        token = data.get('nextPageToken')
        if not token:
            break
        if token in seen:
            raise ValueError('Paginación incompleta.')
        seen.add(token)
    plans = []
    for user in accounts:
        claims = json.loads(user.get('customAttributes') or '{}')
        if not isinstance(claims, dict):
            raise ValueError('Claims no verificables.')
        if claims.get('app') != 'mi_comunidad' or claims.get('role') != 'admin' or user.get('disabled', False):
            continue
        uid, community_id = user.get('localId'), claims.get('comunidadId')
        if not identifier(uid) or not identifier(community_id):
            raise ValueError('Identidad no verificable.')
        base = 'https://firestore.googleapis.com/v1/projects/' + PROJECT + '/databases/(default)/documents/mi_comunidad_comunidades/' + urllib.parse.quote(community_id, safe='')
        profile = read(base + '/administradores/' + urllib.parse.quote(uid, safe='') + '?mask.fieldPaths=estado')
        if profile is not None:
            continue
        query = urllib.parse.urlencode({'mask.fieldPaths': ['nombre', 'adminNombre', 'adminUid', 'estado']}, doseq=True)
        community = read(base + '?' + query)
        if community is None:
            raise ValueError('Comunidad ausente.')
        owner = field(community, 'adminUid') or None
        state = {'uid': uid, 'disabled': False, 'app': 'mi_comunidad', 'role': 'admin', 'comunidadId': community_id}
        evidence = {'projectId': PROJECT, 'expectedAuth': state, 'expectedOwner': owner,
                    'communityName': field(community, 'nombre'), 'communityState': field(community, 'estado'),
                    'accountDisplayName': user.get('displayName') or '', 'registeredAdminName': field(community, 'adminNombre')}
        digest = hashlib.sha256(json.dumps(evidence, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()
        blocked = (owner is not None and owner != uid) or field(community, 'estado') == 'Suspendida'
        plans.append({'comunidad': evidence['communityName'], 'comunidadId': community_id, 'uid': uid,
                      'nombreEnAuth': evidence['accountDisplayName'], 'nombreAdministracionRegistrado': evidence['registeredAdminName'],
                      'nombrePropuestoFicha': (evidence['accountDisplayName'] or evidence['registeredAdminName']).strip(),
                      'titularidad': 'coincide' if owner == uid else 'sin propietario registrado' if owner is None else 'propietario distinto',
                      'bloqueada': blocked, 'codigoConfirmacion': digest})
    return {'soloLectura': True, 'proyecto': PROJECT, 'cuentasSinFicha': plans}


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def main():
    parser = argparse.ArgumentParser(description='Verificar privadamente fichas administrativas ausentes; no escribe en Firebase.')
    parser.add_argument('--project', required=True, choices=[PROJECT])
    parser.add_argument('--diagnostico', action='store_true', help='Mostrar solo conteos y errores seguros, sin identidades.')
    args = parser.parse_args()
    if os.environ.get('GITHUB_ACTIONS') or os.environ.get('CI'):
        raise ValueError('La revisión de identidades debe ejecutarse fuera de CI.')
    try:
        token = subprocess.check_output(['gcloud', 'auth', 'print-access-token'], text=True, stderr=subprocess.DEVNULL).strip()
    except (subprocess.SubprocessError, OSError):
        raise SafeDiagnostic('sesion_gcloud', 'TOKEN_NO_DISPONIBLE') from None
    if not token:
        raise SafeDiagnostic('sesion_gcloud', 'TOKEN_VACIO')
    opener = urllib.request.build_opener(NoRedirect())

    def read(url):
        parsed = urllib.parse.urlsplit(url)
        if parsed.scheme != 'https' or parsed.hostname not in ['identitytoolkit.googleapis.com', 'firestore.googleapis.com']:
            raise ValueError('Destino no permitido.')
        stage = 'auth_listar_cuentas' if parsed.hostname == 'identitytoolkit.googleapis.com' else 'firestore_leer_ficha' if '/administradores/' in parsed.path else 'firestore_leer_comunidad'
        req = urllib.request.Request(url, headers={'Authorization': 'Bearer ' + token}, method='GET')
        try:
            with opener.open(req, timeout=30) as response:
                try:
                    return json.load(response)
                except (ValueError, UnicodeError):
                    raise SafeDiagnostic(stage, 'RESPUESTA_NO_JSON') from None
        except urllib.error.HTTPError as error:
            # Solo la ausencia de un documento Firestore es una ausencia válida.
            if error.code == 404 and parsed.hostname == 'firestore.googleapis.com':
                return None
            raise SafeDiagnostic(stage, 'HTTP_ERROR', error.code) from None
        except (urllib.error.URLError, OSError):
            raise SafeDiagnostic(stage, 'CONEXION_NO_COMPLETADA') from None

    result = private_plan(read)
    if args.diagnostico:
        print(json.dumps({'soloLectura': True, 'fase': 'completada', 'codigo': 'OK', 'cuentasSinFicha': len(result['cuentasSinFicha'])}))
        return
    print('REVISIÓN PRIVADA: comprueba cada identidad y su comunidad. Comparte solo los códigos de las cuentas que confirmes autorizadas.')
    print(json.dumps(result, ensure_ascii=False, indent=2))
    print('Este comando no crea fichas ni autoriza automáticamente ninguna reparación.')


def cli():
    try:
        main()
    except SafeDiagnostic as error:
        print(json.dumps(error.result), file=sys.stderr)
        return 1
    except (ValueError, KeyError, TypeError, subprocess.SubprocessError, OSError, urllib.error.URLError):
        print(json.dumps({'soloLectura': True, 'fase': 'validacion_local', 'codigo': 'DATOS_O_ENTORNO_NO_VERIFICABLES'}), file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(cli())

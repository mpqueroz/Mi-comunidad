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
                    'accountDisplayName': user.get('displayName', ''), 'registeredAdminName': field(community, 'adminNombre')}
        digest = hashlib.sha256(json.dumps(evidence, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()
        blocked = (owner is not None and owner != uid) or field(community, 'estado') == 'Suspendida'
        plans.append({'comunidad': evidence['communityName'], 'comunidadId': community_id, 'uid': uid,
                      'nombreEnAuth': evidence['accountDisplayName'], 'nombreAdministracionRegistrado': evidence['registeredAdminName'],
                      'titularidad': 'coincide' if owner == uid else 'sin propietario registrado' if owner is None else 'propietario distinto',
                      'bloqueada': blocked, 'codigoConfirmacion': digest})
    return {'soloLectura': True, 'proyecto': PROJECT, 'cuentasSinFicha': plans}


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def main():
    parser = argparse.ArgumentParser(description='Verificar privadamente fichas administrativas ausentes; no escribe en Firebase.')
    parser.add_argument('--project', required=True, choices=[PROJECT])
    parser.parse_args()
    if os.environ.get('GITHUB_ACTIONS') or os.environ.get('CI'):
        raise ValueError('La revisión de identidades debe ejecutarse fuera de CI.')
    token = subprocess.check_output(['gcloud', 'auth', 'print-access-token'], text=True, stderr=subprocess.DEVNULL).strip()
    if not token:
        raise ValueError('No hay sesión autorizada.')
    opener = urllib.request.build_opener(NoRedirect())

    def read(url):
        parsed = urllib.parse.urlsplit(url)
        if parsed.scheme != 'https' or parsed.hostname not in ['identitytoolkit.googleapis.com', 'firestore.googleapis.com']:
            raise ValueError('Destino no permitido.')
        req = urllib.request.Request(url, headers={'Authorization': 'Bearer ' + token}, method='GET')
        try:
            with opener.open(req, timeout=30) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            # Solo la ausencia de un documento Firestore es una ausencia válida.
            if error.code == 404 and parsed.hostname == 'firestore.googleapis.com':
                return None
            raise ValueError('Consulta no completada (HTTP ' + str(error.code) + ').') from None

    result = private_plan(read)
    print('REVISIÓN PRIVADA: comprueba cada identidad y su comunidad. Comparte solo los códigos de las cuentas que confirmes autorizadas.')
    print(json.dumps(result, ensure_ascii=False, indent=2))
    print('Este comando no crea fichas ni autoriza automáticamente ninguna reparación.')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, KeyError, TypeError, subprocess.SubprocessError, OSError, urllib.error.URLError):
        print('No se completó la revisión privada. Comprueba sesión, permisos y proyecto; no se modificó Firebase.', file=sys.stderr)
        sys.exit(1)

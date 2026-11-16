import importlib.util
import json
import pathlib
import unittest
import io
import contextlib
import urllib.error
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('private_plan', pathlib.Path(__file__).parents[1] / 'scripts/verificar-fichas-privadas.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class PrivatePlanTests(unittest.TestCase):
    def fixture(self, owner='u', disabled=False):
        calls = []
        def read(url):
            calls.append(url)
            if 'accounts:batchGet' in url:
                return {'users': [{'localId': 'u', 'displayName': 'Nombre privado', 'email': 'NO-SOLICITAR', 'passwordHash': 'NO-SOLICITAR', 'disabled': disabled, 'customAttributes': json.dumps({'app': 'mi_comunidad', 'role': 'admin', 'comunidadId': 'c'})}]}
            if '/administradores/' in url:
                return None
            return {'fields': {'nombre': {'stringValue': 'Comunidad privada'}, 'adminNombre': {'stringValue': 'Admin registrado'}, 'adminUid': {'stringValue': owner}, 'estado': {'stringValue': 'Activa'}}}
        return read, calls

    def test_private_evidence_without_credentials(self):
        read, calls = self.fixture()
        result = module.private_plan(read)
        candidate = result['cuentasSinFicha'][0]
        self.assertEqual(candidate['titularidad'], 'coincide')
        self.assertEqual(candidate['bloqueada'], False)
        self.assertEqual(len(candidate['codigoConfirmacion']), 64)
        self.assertNotIn('NO-SOLICITAR', json.dumps(result))
        self.assertTrue(all('password' not in url and 'email' not in url for url in calls))
        self.assertTrue(all(url.startswith('https://') for url in calls))

    def test_codes_change_with_ownership_evidence(self):
        a = module.private_plan(self.fixture()[0])['cuentasSinFicha'][0]
        b = module.private_plan(self.fixture('')[0])['cuentasSinFicha'][0]
        c = module.private_plan(self.fixture('otro')[0])['cuentasSinFicha'][0]
        self.assertNotEqual(a['codigoConfirmacion'], b['codigoConfirmacion'])
        self.assertEqual(b['titularidad'], 'sin propietario registrado')
        self.assertTrue(c['bloqueada'])

    def test_disabled_and_existing_accounts_do_not_become_candidates(self):
        read, calls = self.fixture(disabled=True)
        self.assertEqual(module.private_plan(read)['cuentasSinFicha'], [])
        self.assertEqual(len(calls), 1)
        original, calls = self.fixture()
        self.assertEqual(module.private_plan(lambda url: {} if '/administradores/' in url else original(url))['cuentasSinFicha'], [])

    def test_repeated_pages_abort_without_partial_result(self):
        with self.assertRaises(ValueError):
            module.private_plan(lambda url: {'users': [], 'nextPageToken': 'repetido'})

    def test_ci_entrypoint_is_blocked_before_gcloud(self):
        from unittest.mock import patch
        with patch.dict(module.os.environ, {'GITHUB_ACTIONS': 'true'}), patch.object(module.sys, 'argv', ['script', '--project', module.PROJECT]), patch.object(module.subprocess, 'check_output') as token:
            with self.assertRaises(ValueError):
                module.main()
            token.assert_not_called()

    def test_diagnostic_http_failure_hides_credentials_response_and_identity(self):
        for url, phase in [('https://identitytoolkit.googleapis.com/private', 'auth_listar_cuentas'),
                           ('https://firestore.googleapis.com/private/administradores/secret-uid', 'firestore_leer_ficha'),
                           ('https://firestore.googleapis.com/private', 'firestore_leer_comunidad')]:
            class Opener:
                def open(self, req, timeout):
                    self_test.assertEqual(req.get_method(), 'GET')
                    self_test.assertEqual(req.get_header('X-goog-user-project'), module.PROJECT)
                    raise urllib.error.HTTPError(url, 403, 'SECRET-ERROR', {}, io.BytesIO(b'SECRET-BODY'))
            self_test = self
            stderr, stdout = io.StringIO(), io.StringIO()
            with patch.dict(module.os.environ, {}, clear=True), patch.object(module.sys, 'argv', ['script', '--project', module.PROJECT, '--diagnostico']), patch.object(module.subprocess, 'check_output', return_value='SECRET-TOKEN'), patch.object(module.urllib.request, 'build_opener', return_value=Opener()), patch.object(module, 'private_plan', side_effect=lambda read, **kwargs: read(url)), contextlib.redirect_stderr(stderr), contextlib.redirect_stdout(stdout):
                self.assertEqual(module.cli(), 1)
            result = json.loads(stderr.getvalue())
            self.assertEqual(result, {'soloLectura': True, 'fase': phase, 'codigo': 'HTTP_ERROR', 'http': 403})
            self.assertEqual(stdout.getvalue(), '')
            self.assertNotIn('SECRET', stderr.getvalue())
            self.assertNotIn('secret-uid', stderr.getvalue())

    def test_diagnostic_gcloud_failure_does_not_expose_captured_token(self):
        stderr = io.StringIO()
        failure = module.subprocess.CalledProcessError(1, ['gcloud'], output='SECRET-TOKEN', stderr='SECRET-ERROR')
        with patch.dict(module.os.environ, {}, clear=True), patch.object(module.sys, 'argv', ['script', '--project', module.PROJECT]), patch.object(module.subprocess, 'check_output', side_effect=failure), contextlib.redirect_stderr(stderr):
            self.assertEqual(module.cli(), 1)
        self.assertEqual(json.loads(stderr.getvalue()), {'soloLectura': True, 'fase': 'sesion_gcloud', 'codigo': 'TOKEN_NO_DISPONIBLE'})

    def test_successful_diagnostic_prints_count_only(self):
        read, _ = self.fixture()
        result = module.private_plan(read)
        stdout = io.StringIO()
        with patch.dict(module.os.environ, {}, clear=True), patch.object(module.sys, 'argv', ['script', '--project', module.PROJECT, '--diagnostico']), patch.object(module.subprocess, 'check_output', return_value='SECRET-TOKEN'), patch.object(module, 'private_plan', return_value=result), contextlib.redirect_stdout(stdout):
            self.assertEqual(module.cli(), 0)
        self.assertEqual(json.loads(stdout.getvalue()), {'soloLectura': True, 'fase': 'completada', 'codigo': 'OK', 'cuentasSinFicha': 1})

    def test_only_allowlisted_errorinfo_reason_can_leave_response(self):
        cases = [('SERVICE_DISABLED', 'SERVICE_DISABLED'), ('private-name-token', None)]
        for reason, expected in cases:
            body = {'error': {'message': 'SECRET-MESSAGE', 'details': [{'@type': 'type.googleapis.com/google.rpc.ErrorInfo', 'reason': reason, 'metadata': {'consumer': 'SECRET-PROJECT'}}]}}
            with urllib.error.HTTPError('https://identitytoolkit.googleapis.com/private', 403, 'SECRET', {}, io.BytesIO(json.dumps(body).encode())) as error:
                self.assertEqual(module.safe_http_reason(error), expected)

    def test_principal_selection_excludes_other_accounts_and_keeps_email_private(self):
        original, calls = self.fixture()
        def read(url):
            result = original(url)
            if 'accounts:batchGet' in url:
                result['users'][0]['email'] = 'owner@example.invalid'
                result['users'].append({**result['users'][0], 'localId': 'test-user', 'email': 'test@example.invalid'})
            return result
        result = module.private_plan(read, 'OWNER@example.invalid')
        self.assertTrue(result['principalVerificadoPorCorreo'])
        self.assertEqual([p['uid'] for p in result['cuentasSinFicha']], ['u'])
        self.assertNotIn('owner@example.invalid', json.dumps(result))
        self.assertNotIn('test-user', json.dumps(result))
        self.assertNotEqual(result['cuentasSinFicha'][0]['codigoConfirmacion'], module.private_plan(self.fixture()[0])['cuentasSinFicha'][0]['codigoConfirmacion'])
        self.assertIn('email', calls[0])
        self.assertTrue(all('owner' not in url and 'example.invalid' not in url for url in calls))

    def test_missing_or_duplicate_principal_aborts_before_firestore(self):
        for users in [[], [{'email': 'owner@example.invalid'}, {'email': 'OWNER@example.invalid'}]]:
            calls = []
            def read(url):
                calls.append(url)
                return {'users': users}
            with self.assertRaises(module.SafeDiagnostic):
                module.private_plan(read, 'owner@example.invalid')
            self.assertEqual(len(calls), 1)

    def test_principal_must_be_enabled_admin_in_this_app(self):
        for patch in [{'disabled': True}, {'customAttributes': json.dumps({'app': 'otra', 'role': 'admin'})}, {'customAttributes': json.dumps({'app': 'mi_comunidad', 'role': 'residente'})}]:
            user = {'email': 'owner@example.invalid', 'customAttributes': json.dumps({'app': 'mi_comunidad', 'role': 'admin'}), **patch}
            with self.assertRaises(module.SafeDiagnostic):
                module.private_plan(lambda url: {'users': [user]}, 'owner@example.invalid')


if __name__ == '__main__':
    unittest.main()

import importlib.util
import json
import pathlib
import unittest

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


if __name__ == '__main__':
    unittest.main()

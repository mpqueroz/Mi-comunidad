import copy
import importlib.util
import json
import pathlib
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("disable_private", pathlib.Path(__file__).with_name("deshabilitar-pruebas-privado.py"))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


def account(uid, role="admin", app="mi_comunidad", disabled=False):
    return {"localId": uid, "displayName": "Ficticio", "email": uid + "@example.invalid",
            "disabled": disabled, "customAttributes": json.dumps({"app": app, "role": role, "comunidadId": "demo"})}


class Fake:
    def __init__(self):
        self.users = [account("uno"), account("dos"), account("titular", "superadmin"), account("otra", app="otra")]
        self.posts = []
        self.profiles = False
        self.fail_second = False

    def __call__(self, method, url, body=None):
        if method == "POST":
            self.posts.append(copy.deepcopy(body))
            if self.fail_second and len(self.posts) == 2:
                raise m.Stop("HTTP_403")
            next(u for u in self.users if u["localId"] == body["localId"])["disabled"] = True
            return {}
        if "/accounts:batchGet?" in url:
            return {"users": copy.deepcopy(self.users)}
        if "/administradores/" in url:
            return {"fields": {}} if self.profiles else None
        return {"fields": {"nombre": {"stringValue": "Comunidad ficticia"}, "estado": {"stringValue": "Activa"}}}


class DisableTests(unittest.TestCase):
    def test_only_two_selected_users_disabled_and_claims_preserved(self):
        f = Fake()
        original = copy.deepcopy(f.users)
        progress = {"intentos": 0, "deshabilitadasVerificadas": 0}
        m.apply(f, m.candidates(f), True, progress)
        self.assertEqual(progress, {"intentos": 2, "deshabilitadasVerificadas": 2})
        self.assertEqual(f.posts, [{"localId": "uno", "disableUser": True}, {"localId": "dos", "disableUser": True}])
        for i in range(2):
            self.assertEqual(f.users[i], dict(original[i], disabled=True))
        self.assertEqual(f.users[2:], original[2:])

    def test_plan_does_not_write(self):
        f = Fake()
        self.assertEqual(len(m.candidates(f)), 2)
        self.assertEqual(f.posts, [])

    def test_requires_private_identity_selection(self):
        f = Fake()
        with self.assertRaises(m.Stop):
            m.apply(f, m.candidates(f), False, {})
        self.assertEqual(f.posts, [])

    def test_changed_email_aborts_before_writes(self):
        f = Fake()
        plans = m.candidates(f)
        f.users[1]["email"] = "changed@example.invalid"
        with self.assertRaises(m.Stop):
            m.apply(f, plans, True, {})
        self.assertEqual(f.posts, [])

    def test_promoted_superadmin_aborts_before_writes(self):
        f = Fake()
        plans = m.candidates(f)
        f.users[0]["customAttributes"] = account("uno", "superadmin")["customAttributes"]
        with self.assertRaises(m.Stop):
            m.apply(f, plans, True, {})
        self.assertEqual(f.posts, [])

    def test_new_profile_aborts_before_writes(self):
        f = Fake()
        plans = m.candidates(f)
        f.profiles = True
        with self.assertRaises(m.Stop):
            m.apply(f, plans, True, {})
        self.assertEqual(f.posts, [])

    def test_count_change_and_duplicate_users_rejected(self):
        for mutate in [lambda f: f.users.append(account("tres")), lambda f: f.users.pop(0),
                       lambda f: f.users.append(copy.deepcopy(f.users[0]))]:
            f = Fake()
            mutate(f)
            with self.assertRaises(m.Stop):
                m.candidates(f)
            self.assertEqual(f.posts, [])

    def test_partial_failure_reports_verified_and_attempted_without_rollback(self):
        f = Fake()
        f.fail_second = True
        progress = {"intentos": 0, "deshabilitadasVerificadas": 0}
        with self.assertRaises(m.Stop):
            m.apply(f, m.candidates(f), True, progress)
        self.assertEqual(progress, {"intentos": 2, "deshabilitadasVerificadas": 1})
        self.assertTrue(f.users[0]["disabled"])
        self.assertFalse(f.users[1]["disabled"])
        self.assertEqual(len(f.posts), 2)

    def test_rechecks_second_target_after_first_write(self):
        f = Fake()
        plans = m.candidates(f)
        def request(method, url, body=None):
            result = f(method, url, body)
            if method == "POST":
                f.users[1]["displayName"] = "Changed"
            return result
        progress = {"intentos": 0, "deshabilitadasVerificadas": 0}
        with self.assertRaises(m.Stop):
            m.apply(request, plans, True, progress)
        self.assertEqual(progress, {"intentos": 1, "deshabilitadasVerificadas": 1})
        self.assertEqual(len(f.posts), 1)

    def test_transport_rejects_deletes_reenable_claim_changes_and_other_projects(self):
        request = m.transport("fake-local-token")
        with patch.object(m.urllib.request.OpenerDirector, "open", side_effect=AssertionError("No network")):
            for method, url, body in [
                ("DELETE", m.AUTH + "/accounts:update", {"localId": "uno", "disableUser": True}),
                ("POST", m.AUTH + "/accounts:update", {"localId": "uno", "disableUser": False}),
                ("POST", m.AUTH + "/accounts:update", {"localId": "uno", "disableUser": True, "customAttributes": "{}"}),
                ("POST", m.AUTH.replace(m.PROJECT, "other-project") + "/accounts:update", {"localId": "uno", "disableUser": True}),
                ("POST", m.FIRESTORE + "demo", {}),
            ]:
                with self.assertRaises(m.Stop):
                    request(method, url, body)

    def test_repeated_pagination_rejected(self):
        with self.assertRaises(m.Stop):
            m.list_users(lambda *args: {"users": [], "nextPageToken": "repeat"})


if __name__ == "__main__":
    unittest.main()

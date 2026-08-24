import unittest

from membership import Memberships


class MembershipTest(unittest.TestCase):
    def test_remove_invalidates_group_index(self):
        memberships = Memberships()
        memberships.add("u1", "g1")
        self.assertEqual(memberships.group_members("g1"), ["u1"])
        memberships.remove("u1", "g1")
        self.assertEqual(memberships.group_members("g1"), [])


if __name__ == "__main__":
    unittest.main()

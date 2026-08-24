import unittest

from pagination import collect_rows


class PaginationTest(unittest.TestCase):
    def test_empty_page_does_not_skip_the_continuation_cursor(self):
        pages = {
            None: ([{"id": 1}], "1"),
            "1": ([], "2"),
            "2": ([{"id": 2}], None),
        }
        self.assertEqual(collect_rows(lambda cursor: pages[cursor]), [{"id": 1}, {"id": 2}])


if __name__ == "__main__":
    unittest.main()

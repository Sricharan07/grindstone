import unittest

from order_filter import eligible_orders


class EligibleOrdersTest(unittest.TestCase):
    def test_includes_order_at_threshold(self):
        self.assertEqual(eligible_orders([{"id": 7, "status": "paid", "total": 50}], 50), [7])

    def test_excludes_unpaid_and_below_threshold_orders(self):
        orders = [
            {"id": 1, "status": "pending", "total": 90},
            {"id": 2, "status": "paid", "total": 49},
            {"id": 3, "status": "paid", "total": 75},
        ]
        self.assertEqual(eligible_orders(orders, 50), [3])


if __name__ == "__main__":
    unittest.main()

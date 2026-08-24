import unittest

from retry_budget import RetryBudget


class RetryBudgetTest(unittest.TestCase):
    def test_success_resets_consecutive_failures(self):
        budget = RetryBudget(2)
        self.assertTrue(budget.record(False))
        self.assertTrue(budget.record(True))
        self.assertTrue(budget.record(False))

    def test_two_consecutive_failures_exhaust_budget(self):
        budget = RetryBudget(2)
        self.assertTrue(budget.record(False))
        self.assertFalse(budget.record(False))


if __name__ == "__main__":
    unittest.main()

import unittest
from datetime import datetime, timezone

from daily_report import event_ids_for_utc_day


class DailyReportTest(unittest.TestCase):
    def test_uses_aware_utc_boundaries(self):
        events = [
            {"id": 1, "created_at": datetime(2026, 8, 22, 23, 59, tzinfo=timezone.utc)},
            {"id": 2, "created_at": datetime(2026, 8, 23, 0, 0, tzinfo=timezone.utc)},
        ]
        self.assertEqual(event_ids_for_utc_day(events, datetime(2026, 8, 23, tzinfo=timezone.utc)), [2])


if __name__ == "__main__":
    unittest.main()

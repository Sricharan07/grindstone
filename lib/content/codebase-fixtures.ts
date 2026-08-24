interface PythonCodebaseFixture {
  id: string;
  problem: "eligible-orders" | "pagination-cursor" | "retry-budget" | "daily-report" | "membership-cache";
  title: string;
  repositoryFixture: string;
  plantedBugs: string[];
  rubric: { reproduce: number; localize: number; hypothesis: number; minimalPatch: number; regressionTest: number };
  brief: string;
  failingCase: string;
  expected: string;
  testCount: number;
  initialCode: string;
}

export const pythonCodebaseFixtures: PythonCodebaseFixture[] = [
  {
    id: "threshold-order-filter",
    problem: "eligible-orders",
    title: "Threshold order filter",
    repositoryFixture: "fixtures/python/order_filter",
    plantedBugs: ["strict comparison excludes an order equal to the minimum"],
    rubric: { reproduce: 2, localize: 2, hypothesis: 2, minimalPatch: 2, regressionTest: 2 },
    brief: "A paid order at the threshold disappears.",
    failingCase: 'eligible_orders([{"id": 7, "status": "paid", "total": 50}], 50)',
    expected: "expected [7] · received []",
    testCount: 4,
    initialCode: `def eligible_orders(orders, minimum):
    """Return paid order ids whose total meets minimum."""
    result = []
    for order in orders:
        if order["status"] == "paid" and order["total"] > minimum:
            result.append(order["id"])
    return result`,
  },
  {
    id: "pagination-cursor",
    problem: "pagination-cursor",
    title: "Pagination cursor skips a row",
    repositoryFixture: "fixtures/python/pagination_cursor",
    plantedBugs: ["cursor advances twice after an empty page"],
    rubric: { reproduce: 2, localize: 2, hypothesis: 2, minimalPatch: 2, regressionTest: 2 },
    brief: "An empty provider page causes the continuation cursor to skip data.",
    failingCase: "collect_rows(fetch_page) with an empty page at cursor '1'",
    expected: "expected IDs [1, 2] · received [1]",
    testCount: 2,
    initialCode: `def collect_rows(fetch_page):
    """Collect all rows from a cursor-based provider."""
    rows = []
    cursor = None
    while True:
        page, next_cursor = fetch_page(cursor)
        rows.extend(page)
        if next_cursor is None:
            return rows
        cursor = next_cursor
        if not page:
            cursor = str(int(cursor) + 1)`,
  },
  {
    id: "retry-budget",
    problem: "retry-budget",
    title: "Retry budget never resets",
    repositoryFixture: "fixtures/python/retry_budget",
    plantedBugs: ["successful calls do not clear consecutive failure state"],
    rubric: { reproduce: 2, localize: 2, hypothesis: 2, minimalPatch: 2, regressionTest: 2 },
    brief: "A successful call fails to restore the consecutive-failure budget.",
    failingCase: "record(False), record(True), record(False)",
    expected: "expected another attempt · budget exhausted",
    testCount: 3,
    initialCode: `class RetryBudget:
    def __init__(self, limit: int):
        self.limit = limit
        self.consecutive_failures = 0

    def record(self, succeeded: bool) -> bool:
        """Record an outcome and return whether another attempt is allowed."""
        if not succeeded:
            self.consecutive_failures += 1
        return self.consecutive_failures < self.limit`,
  },
  {
    id: "daily-report-boundary",
    problem: "daily-report",
    title: "Timezone boundary duplicates a report",
    repositoryFixture: "fixtures/python/daily_report",
    plantedBugs: ["naive local midnight is compared with UTC timestamps"],
    rubric: { reproduce: 2, localize: 2, hypothesis: 2, minimalPatch: 2, regressionTest: 2 },
    brief: "UTC-aware events are compared with a naive daily boundary.",
    failingCase: "event_ids_for_utc_day(events, aware_utc_day)",
    expected: "expected [2] · received a timezone comparison error",
    testCount: 2,
    initialCode: `from datetime import datetime, timedelta


def event_ids_for_utc_day(events: list[dict], day: datetime) -> list[int]:
    """Return IDs whose UTC timestamps fall within the requested UTC day."""
    start = datetime(day.year, day.month, day.day)
    end = start + timedelta(days=1)
    return [event["id"] for event in events if start <= event["created_at"] < end]`,
  },
  {
    id: "membership-cache",
    problem: "membership-cache",
    title: "Cache invalidation preserves stale membership",
    repositoryFixture: "fixtures/python/membership_cache",
    plantedBugs: ["write invalidates the user key but not the group index"],
    rubric: { reproduce: 2, localize: 2, hypothesis: 2, minimalPatch: 2, regressionTest: 2 },
    brief: "Removing a member leaves the cached group index stale.",
    failingCase: "add('u1', 'g1'), group_members('g1'), remove('u1', 'g1')",
    expected: "expected [] · received ['u1']",
    testCount: 3,
    initialCode: `class Memberships:
    def __init__(self):
        self.members: dict[str, set[str]] = {}
        self.cache: dict[str, object] = {}

    def add(self, user_id: str, group_id: str) -> None:
        self.members.setdefault(group_id, set()).add(user_id)
        self.cache.pop(f"user:{user_id}", None)
        self.cache.pop(f"group:{group_id}", None)

    def remove(self, user_id: str, group_id: str) -> None:
        self.members.get(group_id, set()).discard(user_id)
        self.cache.pop(f"user:{user_id}", None)

    def group_members(self, group_id: str) -> list[str]:
        key = f"group:{group_id}"
        if key not in self.cache:
            self.cache[key] = sorted(self.members.get(group_id, set()))
        return list(self.cache[key])`,
  },
];

class RetryBudget:
    def __init__(self, limit: int):
        self.limit = limit
        self.consecutive_failures = 0

    def record(self, succeeded: bool) -> bool:
        """Record an outcome and return whether another attempt is allowed."""
        if not succeeded:
            self.consecutive_failures += 1
        return self.consecutive_failures < self.limit

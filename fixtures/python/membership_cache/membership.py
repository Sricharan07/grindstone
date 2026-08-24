class Memberships:
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
        return list(self.cache[key])

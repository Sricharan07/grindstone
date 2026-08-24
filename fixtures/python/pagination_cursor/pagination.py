def collect_rows(fetch_page):
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
            cursor = str(int(cursor) + 1)

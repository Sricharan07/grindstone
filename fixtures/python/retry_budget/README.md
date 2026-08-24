# Retry budget

Run `python -m unittest -v`. Successful work should restore the consecutive-failure budget, but the current implementation leaks failure state across calls.

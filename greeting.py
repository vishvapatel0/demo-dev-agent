def greet(name):
    if not isinstance(name, str):
        raise TypeError("name must be a string")
    # BUG: crashes on empty/whitespace names instead of handling them gracefully
    if len(name) == 0:
        raise ValueError("name cannot be empty")
    return f"Hello, {name}!"

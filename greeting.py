def greet(name):
    if not isinstance(name, str):
        raise TypeError("name must be a string")
    if name.strip() == "":
        return "Hello, stranger!"
    return f"Hello, {name}!"

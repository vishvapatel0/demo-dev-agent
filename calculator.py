def add(a, b):
    return a + b


def subtract(a, b):
    return a - b


def multiply(a, b):
    return a * b


def divide(a, b):
    # BUG: raises ZeroDivisionError when b == 0 instead of returning a clear error
    return a / b

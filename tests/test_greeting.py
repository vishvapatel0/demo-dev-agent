import pytest

from greeting import greet


def test_greet_normal_name():
    assert greet("Vishva") == "Hello, Vishva!"


def test_greet_rejects_non_string():
    with pytest.raises(TypeError):
        greet(42)

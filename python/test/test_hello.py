from src.hello import hello


def test_basic():
    assert 1 + 1 == 2

def test_hello():
    assert hello() == "Hello world!"


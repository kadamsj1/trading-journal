from passlib.context import CryptContext
import sys

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

try:
    hash = pwd_context.hash("test")
    print(f"Hash success: {hash}")
except Exception as e:
    print(f"Hash error: {e}")

try:
    hash = pwd_context.hash("")
    print(f"Empty hash success: {hash}")
except Exception as e:
    print(f"Empty hash error: {e}")

try:
    long_pass = "a" * 100
    hash = pwd_context.hash(long_pass)
    print(f"Long hash success: {hash}")
except Exception as e:
    print(f"Long hash error: {e}")

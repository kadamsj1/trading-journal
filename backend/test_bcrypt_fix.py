from passlib.context import CryptContext
import sys

print("Testing with bcrypt__truncate_error=True")
try:
    pwd_context = CryptContext(
        schemes=["bcrypt"], 
        deprecated="auto",
        bcrypt__truncate_error=True
    )
    long_pass = "a" * 100
    hash = pwd_context.hash(long_pass)
    print(f"Long hash success with True: {hash[:20]}...")
except Exception as e:
    print(f"Long hash error with True: {e}")

print("\nTesting with bcrypt__truncate_error=False")
try:
    pwd_context = CryptContext(
        schemes=["bcrypt"], 
        deprecated="auto",
        bcrypt__truncate_error=False
    )
    long_pass = "a" * 100
    hash = pwd_context.hash(long_pass)
    print(f"Long hash success with False: {hash[:20]}...")
except Exception as e:
    print(f"Long hash error with False: {e}")

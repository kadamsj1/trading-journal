from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
print(f"Hashing 'test'...")
try:
    hash = pwd_context.hash("test")
    print(f"Success: {hash}")
except Exception as e:
    print(f"Failed: {e}")

print(f"Hashing 50 chars...")
try:
    hash = pwd_context.hash("a" * 50)
    print(f"Success 50: {hash}")
except Exception as e:
    print(f"Failed 50: {e}")

from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"], 
    deprecated="auto",
    bcrypt__truncate_error=True 
)

long_pass = "a" * 100
print(f"Testing manual truncation workaround...")

try:
    hash = pwd_context.hash(long_pass)
    print(f"Hash success (config handled it): {hash[:20]}...")
except ValueError as e:
    print(f"Caught ValueError: {e}")
    if "72 bytes" in str(e):
        print("Attempting manual truncation...")
        try:
            truncated = long_pass.encode('utf-8')[:72]
            hash = pwd_context.hash(truncated)
            print(f"Manual truncation success: {hash[:20]}...")
        except Exception as e2:
            print(f"Manual truncation failed: {e2}")
    else:
        print("Error unrelated to length")

from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"], 
    deprecated="auto",
    bcrypt__truncate_error=False # Force error to test manual fix
)

long_pass = "a" * 100
print(f"Testing manual truncation workaround v2...")

try:
    hash = pwd_context.hash(long_pass)
    print(f"Hash success (config handled it unexpectedly?): {hash[:20]}...")
except ValueError as e:
    print(f"Caught ValueError as expected: {e}")
    if "72 bytes" in str(e):
        print("Attempting manual truncation logic...")
        try:
            b = long_pass.encode('utf-8')
            trunc_b = b[:72]
            trunc_s = trunc_b.decode('utf-8', errors='ignore')
            print(f"Truncated string len: {len(trunc_s)}")
            
            hash = pwd_context.hash(trunc_s)
            print(f"Manual truncation success: {hash[:20]}...")
        except Exception as e2:
            print(f"Manual truncation failed: {e2}")
    else:
        print("Error unrelated to length")

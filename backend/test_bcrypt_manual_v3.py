from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"], 
    deprecated="auto",
    bcrypt__truncate_error=False 
)

long_pass = "a" * 100
print(f"Testing manual truncation workaround v3...")

try:
    hash = pwd_context.hash(long_pass)
    print(f"Long hash success: {hash[:20]}...")
except ValueError as e:
    print(f"Caught ValueError: {str(e)[:50]}...") # truncate error msg
    if "72 bytes" in str(e):
        print("Trimming to 71 bytes...")
        try:
            b = long_pass.encode('utf-8')
            trunc_b = b[:71]
            trunc_s = trunc_b.decode('utf-8', errors='ignore')
            hash = pwd_context.hash(trunc_s)
            print(f"71 byte hash success: {hash[:20]}...")
        except Exception as e2:
            print(f"71 byte failed: {str(e2)[:50]}...")
        
        print("Trimming to 50 bytes...")
        try:
            b = long_pass.encode('utf-8')
            trunc_b = b[:50]
            trunc_s = trunc_b.decode('utf-8', errors='ignore')
            hash = pwd_context.hash(trunc_s)
            print(f"50 byte hash success: {hash[:20]}...")
        except Exception as e3:
            print(f"50 byte failed: {str(e3)[:50]}...")
    else:
        print("Error unrelated to length")

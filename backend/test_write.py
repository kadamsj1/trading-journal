import os
from pathlib import Path

path = Path("uploads/screenshots")
path.mkdir(parents=True, exist_ok=True)
test_file = path / "test.txt"

try:
    with open(test_file, "w") as f:
        f.write("test")
    print(f"Successfully wrote to {test_file}")
    os.remove(test_file)
    print("Successfully removed test file")
except Exception as e:
    print(f"Error: {e}")

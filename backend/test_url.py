from urllib.parse import urlparse

url = "postgresql://postgres:9w!rE@Yk&dt0R!#dbCqv@db.qvqyfadupyxcpbtoovmt.supabase.co:5432/postgres"
parsed = urlparse(url)
print(f"Hostname: {parsed.hostname}")
print(f"Username: {parsed.username}")
print(f"Password: {parsed.password}")

url_encoded = "postgresql://postgres:9w!rE%40Yk&dt0R!%23dbCqv@db.qvqyfadupyxcpbtoovmt.supabase.co:5432/postgres"
parsed_encoded = urlparse(url_encoded)
print(f"\nFinal Hostname: {parsed_encoded.hostname}")
print(f"Final Username: {parsed_encoded.username}")
print(f"Final Password: {parsed_encoded.password}")

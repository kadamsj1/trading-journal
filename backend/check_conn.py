import socket

hosts = [
    "db.qvqyfadupyxcpbtoovmt.supabase.co",
    "qvqyfadupyxcpbtoovmt.supabase.co",
    "db.qvqyfadupyxcpbtoovmt.supabase.com",
    "qvqyfadupyxcpbtoovmt.supabase.com"
]

for host in hosts:
    try:
        s = socket.create_connection((host, 5432), timeout=3)
        print(f"SUCCESS: {host} is reachable on 5432")
        s.close()
    except Exception as e:
        print(f"FAILED: {host} - {e}")

import socket

regions = [
    "ap-south-1",    # Mumbai
    "us-east-1",     # N. Virginia
    "ap-southeast-1", # Singapore
    "eu-central-1",  # Frankfurt
    "us-west-2",     # Oregon
    "eu-west-1",     # Ireland
]

project_ref = "qvqyfadupyxcpbtoovmt"

for region in regions:
    host = f"aws-0-{region}.pooler.supabase.com"
    try:
        # We can't easily check if it belongs to THIS project without connecting
        # but we can check if the host responds on 5432
        s = socket.create_connection((host, 5432), timeout=2)
        print(f"REACHABLE: {host}")
        s.close()
    except:
        pass

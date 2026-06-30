import requests

SUPABASE_URL = 'https://yzajrlgxezudowsbirzd.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6YWpybGd4ZXp1ZG93c2JpcnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NTEwMjksImV4cCI6MjA5NzAyNzAyOX0.S4ASHMoXtGIfHA4uT9x_7K5QxLzChdEZ-j66gmN2GwU'

response = requests.get(f"{SUPABASE_URL}/rest/v1/?apikey={SUPABASE_KEY}")
if response.ok:
    schema = response.json()
    if "definitions" in schema and "viajes" in schema["definitions"]:
        print("Columns in 'viajes':", list(schema["definitions"]["viajes"]["properties"].keys()))
    elif "definitions" in schema and "Viajes" in schema["definitions"]:
        print("Columns in 'Viajes':", list(schema["definitions"]["Viajes"]["properties"].keys()))
    else:
        print("Table not found in schema definitions.")
else:
    print("Error fetching schema:", response.status_code, response.text)

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from typing import Optional

app = FastAPI()

# Configuración CORS para permitir solicitudes desde el frontend local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, reemplazar con el dominio del frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Credenciales de Supabase
SUPABASE_URL = 'https://yzajrlgxezudowsbirzd.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6YWpybGd4ZXp1ZG93c2JpcnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NTEwMjksImV4cCI6MjA5NzAyNzAyOX0.S4ASHMoXtGIfHA4uT9x_7K5QxLzChdEZ-j66gmN2GwU'

@app.get("/api/viajes")
async def get_viajes(estado: Optional[str] = None, authorization: str = Header(None)):
    """
    Endpoint para obtener los viajes del usuario autenticado.
    Permite filtrar opcionalmente por estado (ej: 'realizado').
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token no proporcionado o inválido")
    
    token = authorization.split(" ")[1]
    
    try:
        temp_supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        temp_supabase.postgrest.auth(token)
        
        # Intentamos obtener desde 'viajes' o 'Viajes'
        try:
            query = temp_supabase.table("viajes").select("*")
            if estado:
                query = query.eq("Estado", estado)
            response = query.execute()
        except Exception:
            query = temp_supabase.table("Viajes").select("*")
            if estado:
                query = query.eq("Estado", estado)
            response = query.execute()
            
        return response.data
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/recuerdos")
async def get_recuerdos(authorization: str = Header(None)):
    """
    Endpoint para obtener los recursos multimedia (recuerdos) asociados a los viajes del usuario.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token no proporcionado o inválido")
    
    token = authorization.split(" ")[1]
    
    try:
        temp_supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        temp_supabase.postgrest.auth(token)
        
        # 1. Obtener los IDs de los viajes del usuario
        try:
            viajes_resp = temp_supabase.table("viajes").select("Id_Viaje").execute()
        except Exception:
            viajes_resp = temp_supabase.table("Viajes").select("Id_Viaje").execute()
            
        viaje_ids = [v["Id_Viaje"] for v in viajes_resp.data]
        
        if not viaje_ids:
            return []
            
        # 2. Obtener la multimedia relacionada a esos viajes
        try:
            media_resp = temp_supabase.table("multimedia_viaje").select("*").in_("Id_Viaje", viaje_ids).execute()
        except Exception:
            media_resp = temp_supabase.table("Multimedia_Viaje").select("*").in_("Id_Viaje", viaje_ids).execute()
            
        return media_resp.data
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

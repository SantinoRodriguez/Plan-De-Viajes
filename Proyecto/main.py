from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from typing import Optional
from pydantic import BaseModel

class ViajeBase(BaseModel):
    Id_Viaje: Optional[int] = None
    Nombre_Viaje: Optional[str] = None
    Destino_Principal: Optional[str] = None
    Fecha_Inicio: Optional[str] = None
    Fecha_Fin: Optional[str] = None
    Duracion_Dias: Optional[int] = None
    Cantidad_Viajeros: Optional[int] = None
    Estado: Optional[str] = 'En planificación'


app = FastAPI()

# Configuración CORS para permitir solicitudes desde el frontend local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, reemplazar con el dominio del frontend
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Credenciales de Supabase
SUPABASE_URL = 'https://yzajrlgxezudowsbirzd.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6YWpybGd4ZXp1ZG93c2JpcnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NTEwMjksImV4cCI6MjA5NzAyNzAyOX0.S4ASHMoXtGIfHA4uT9x_7K5QxLzChdEZ-j66gmN2GwU'

@app.get("/api/health")
async def health():
    """
    Endpoint para comprobar el estado de salud del servidor backend.
    """
    return {"status": "ok"}

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

@app.get("/api/viajes/{id_viaje}")
async def get_viaje(id_viaje: int, authorization: str = Header(None)):
    """
    Endpoint para consultar los datos de un viaje específico.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token no proporcionado o inválido")
    
    token = authorization.split(" ")[1]
    
    try:
        temp_supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        temp_supabase.postgrest.auth(token)
        
        try:
            response = temp_supabase.table("viajes").select("*").eq("Id_Viaje", id_viaje).execute()
        except Exception:
            response = temp_supabase.table("Viajes").select("*").eq("Id_Viaje", id_viaje).execute()
            
        if not response.data:
            raise HTTPException(status_code=404, detail="Viaje no encontrado")
            
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/viajes")
async def save_viaje(viaje: ViajeBase, authorization: str = Header(None)):
    """
    Endpoint para crear o actualizar un viaje.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token no proporcionado o inválido")
    
    token = authorization.split(" ")[1]
    
    try:
        temp_supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Obtenemos el usuario autenticado para asignar el ID si es un viaje nuevo
        auth_response = temp_supabase.auth.get_user(token)
        user = auth_response.user
        
        temp_supabase.postgrest.auth(token)
        
        viaje_data = viaje.dict(exclude_unset=True)
        
        # Si tiene Id_Viaje, hacemos UPDATE
        if viaje.Id_Viaje:
            viaje_id = viaje_data.pop('Id_Viaje')
            try:
                response = temp_supabase.table("viajes").update(viaje_data).eq("Id_Viaje", viaje_id).execute()
            except Exception:
                response = temp_supabase.table("Viajes").update(viaje_data).eq("Id_Viaje", viaje_id).execute()
        else:
            # Si es nuevo, insertamos
            # Dependiendo del esquema de Supabase, puede requerir el Id_Usuario explicitly
            # Asumimos que la tabla tiene una columna "Id_Usuario" o "user_id"
            try:
                viaje_data['Id_Usuario'] = user.id
                response = temp_supabase.table("viajes").insert(viaje_data).execute()
            except Exception:
                viaje_data.pop('Id_Usuario', None)
                viaje_data['user_id'] = user.id
                try:
                    response = temp_supabase.table("viajes").insert(viaje_data).execute()
                except Exception:
                    response = temp_supabase.table("Viajes").insert(viaje_data).execute()
                
        if not response.data:
            raise HTTPException(status_code=400, detail="No se pudo guardar el viaje")
            
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


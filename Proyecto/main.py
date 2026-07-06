from fastapi import applications
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from typing import Optional
from pydantic import BaseModel
import json

def get_fallback_image(nombre: str) -> str:
    nombre_lower = nombre.lower()
    
    # Stock Premium Unsplash Photos
    # Cafés/Bares
    if any(kw in nombre_lower for kw in ['café', 'cafe', 'coffee', 'cafetería', 'bar', 'starbucks', 'pub']):
        return "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop"
    # Museos/Arte
    elif any(kw in nombre_lower for kw in ['museo', 'museum', 'louvre', 'galería', 'gallery', 'arte', 'art', 'exhibición']):
        return "https://images.unsplash.com/photo-1580537659444-1297eb70b2ee?w=800&auto=format&fit=crop"
    # Gastronomía/Restaurantes
    elif any(kw in nombre_lower for kw in ['comida', 'gastronomía', 'restaurante', 'restaurant', 'food', 'cena', 'almuerzo', 'dinner', 'lunch', 'comer', 'eat', 'bistro']):
        return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop"
    # Genérica premium de viajes
    return "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop"


class ViajeBase(BaseModel):
    id_viaje: Optional[int] = None
    nombre_viaje: Optional[str] = None
    destino_principal: Optional[str] = None
    fecha_inicio: Optional[str] = None
    fecha_fin: Optional[str] = None
    duracion_dias: Optional[int] = None
    estado: Optional[str] = 'En planificación'
    presupuesto: Optional[float] = None
    moneda: Optional[str] = 'ARS'
    imagen_url: Optional[str] = None
    ajustes_finales: Optional[dict] = None

class ActividadPayload(BaseModel):
    tipo: str  # "lugares" o "itinerario"
    dia_numero: Optional[int] = None
    nombre: str
    place_id: str
    foto_url: Optional[str] = None
    rating: Optional[float] = None

class ActividadSync(BaseModel):
    tipo: str  # "lugares" o "itinerario"
    dia_numero: int
    nombre: str
    place_id: Optional[str] = None
    foto_url: Optional[str] = None
    url_foto: Optional[str] = None
    rating: Optional[float] = None
    horario: Optional[str] = None
    orden: Optional[int] = None

class RecuerdoPayload(BaseModel):
    id_viaje: int
    id_actividad: Optional[int] = None
    url: str
    descripcion: str


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
    Incluye la cantidad total de lugares (actividades) a visitar.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token no proporcionado o inválido")
    
    token = authorization.split(" ")[1]
    
    try:
        temp_supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        temp_supabase.postgrest.auth(token)
        
        query = temp_supabase.table("viajes").select("*")
        if estado:
            query = query.eq("estado", estado)
        response = query.execute()
        
        viajes_list = response.data
        
        if viajes_list:
            viaje_ids = [v["id_viaje"] for v in viajes_list]
            
            # Obtener itinerarios asociados
            it_resp = temp_supabase.table("itinerarios").select("id_itinerario, id_viaje").in_("id_viaje", viaje_ids).execute()
            it_list = it_resp.data
            
            if it_list:
                it_ids = [it["id_itinerario"] for it in it_list]
                
                # Obtener actividades asociadas a estos itinerarios
                act_resp = temp_supabase.table("actividades").select("id_itinerario").in_("id_itinerario", it_ids).execute()
                act_list = act_resp.data
                
                # Mapear id_itinerario a id_viaje
                it_to_viaje = {it["id_itinerario"]: it["id_viaje"] for it in it_list}
                
                # Contar actividades por viaje
                viaje_counts = {v_id: 0 for v_id in viaje_ids}
                for act in act_list:
                    it_id = act["id_itinerario"]
                    v_id = it_to_viaje.get(it_id)
                    if v_id is not None:
                        viaje_counts[v_id] += 1
                        
                for v in viajes_list:
                    v["cantidad_lugares"] = viaje_counts.get(v["id_viaje"], 0)
            else:
                for v in viajes_list:
                    v["cantidad_lugares"] = 0
        else:
            viajes_list = []
            
        return viajes_list
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/recuerdos")
async def get_recuerdos(id_viaje: Optional[int] = None, authorization: str = Header(None)):
    """
    Endpoint para obtener los recursos multimedia (recuerdos) asociados a los viajes del usuario.
    Si se provee id_viaje, filtra por ese viaje.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token no proporcionado o inválido")
    
    token = authorization.split(" ")[1]
    
    try:
        temp_supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        temp_supabase.postgrest.auth(token)
        
        if id_viaje is not None:
            # Filtrar por id_viaje específico
            media_resp = temp_supabase.table("multimedia_viaje").select("*").eq("id_viaje", id_viaje).execute()
        else:
            # 1. Obtener los IDs de todos los viajes del usuario
            viajes_resp = temp_supabase.table("viajes").select("id_viaje").execute()
            viaje_ids = [v["id_viaje"] for v in viajes_resp.data]
            
            if not viaje_ids:
                return []
                
            # 2. Obtener la multimedia relacionada a esos viajes
            media_resp = temp_supabase.table("multimedia_viaje").select("*").in_("id_viaje", viaje_ids).execute()
            
        return media_resp.data
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/recuerdos")
async def create_recuerdo(payload: RecuerdoPayload, authorization: str = Header(None)):
    """
    Endpoint para crear un nuevo recuerdo multimedia.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token no proporcionado o inválido")
    
    token = authorization.split(" ")[1]
    
    try:
        temp_supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        temp_supabase.postgrest.auth(token)
        
        data_to_insert = {
            "id_viaje": payload.id_viaje,
            "url": payload.url,
            "descripcion": payload.descripcion,
            "tipo": "imagen"
        }
        
        if payload.id_actividad is not None:
            data_to_insert["id_actividad"] = payload.id_actividad
            
        resp = temp_supabase.table("multimedia_viaje").insert(data_to_insert).execute()
        return resp.data
        
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
        
        response = temp_supabase.table("viajes").select("*").eq("id_viaje", id_viaje).execute()
            
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
        
        # Si tiene id_viaje, hacemos UPDATE
        if viaje.id_viaje:
            viaje_id = viaje_data.pop('id_viaje')
            response = temp_supabase.table("viajes").update(viaje_data).eq("id_viaje", viaje_id).execute()
        else:
            # Si es nuevo, insertamos
            viaje_data['id_usuario'] = user.id
            response = temp_supabase.table("viajes").insert(viaje_data).execute()
                
        if not response.data:
            raise HTTPException(status_code=400, detail="No se pudo guardar el viaje")
            
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/viajes/{id_viaje}/actividades")
async def add_actividad(id_viaje: int, payload: ActividadPayload, authorization: str = Header(None)):
    """
    Endpoint para agregar una actividad o lugar a un viaje.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token no proporcionado o inválido")
    
    token = authorization.split(" ")[1]
    
    try:
        temp_supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        temp_supabase.postgrest.auth(token)
        
        # 1. Ensure itinerario exists
        # dia_numero = 0 representa la lista general "Lugares para visitar"
        dia_num = payload.dia_numero if payload.tipo == 'itinerario' else 0
        
        # Search for existing itinerario
        resp_it = temp_supabase.table("itinerarios").select("*").eq("id_viaje", id_viaje).eq("dia_numero", dia_num).execute()
            
        if not resp_it.data:
            # Create itinerario
            new_it = {"id_viaje": id_viaje, "dia_numero": dia_num}
            resp_it = temp_supabase.table("itinerarios").insert(new_it).execute()
                
        # Obtenemos el ID del itinerario
        it_data = resp_it.data[0]
        id_it = it_data.get("id_itinerario")
        
        # 2. Insert actividad packing places metadata in descripcion
        foto_url = payload.foto_url
        if not foto_url or "placeholder" in foto_url.lower():
            foto_url = get_fallback_image(payload.nombre)
            
        desc_data = {
            "place_id": payload.place_id,
            "foto_url": foto_url,
            "rating": payload.rating
        }
        
        new_act = {
            "id_itinerario": id_it,
            "nombre": payload.nombre,
            "descripcion": json.dumps(desc_data),
            "orden": 1
        }
        
        resp_act = temp_supabase.table("actividades").insert(new_act).execute()
            
        return resp_act.data[0]
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/viajes/{id_viaje}/actividades")
async def get_actividades(id_viaje: int, authorization: str = Header(None)):
    """
    Obtiene todas las actividades de un viaje agrupadas/mapeadas por día.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token no proporcionado o inválido")
    
    token = authorization.split(" ")[1]
    
    try:
        temp_supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        temp_supabase.postgrest.auth(token)
        
        # 1. Obtener itinerarios
        resp_it = temp_supabase.table("itinerarios").select("*").eq("id_viaje", id_viaje).execute()
        itinerarios = resp_it.data
        
        if not itinerarios:
            return []
            
        it_ids = [it["id_itinerario"] for it in itinerarios]
        it_map = {it["id_itinerario"]: it["dia_numero"] for it in itinerarios}
        
        # 2. Obtener actividades
        resp_act = temp_supabase.table("actividades").select("*").in_("id_itinerario", it_ids).execute()
        actividades = resp_act.data
        
        # 3. Formatear y decodificar descripción
        result = []
        for act in actividades:
            dia_num = it_map.get(act["id_itinerario"], 0)
            
            # Decodificar JSON en descripcion si existe
            desc_data = {}
            if act.get("descripcion"):
                try:
                    desc_data = json.loads(act["descripcion"])
                except Exception:
                    pass
            
            # REEMPLAZO CRÍTICO: Asegurar mapear las propiedades exactas que requiere script.js
            result.append({
                "nombre": act["nombre"],
                "tipo": "lugares" if dia_num == 0 else "itinerario",
                "dia_numero": dia_num,
                "place_id": desc_data.get("place_id", ""),
                "foto_url": desc_data.get("foto_url", ""),  # <-- Aquí se envía la imagen real
                "rating": desc_data.get("rating", 0),
                "horario": desc_data.get("horario", "")
            })
            
        return result
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/viajes/{id_viaje}/sync_actividades")
async def sync_actividades(id_viaje: int, payload: list[ActividadSync], authorization: str = Header(None)):
    """
    Sincroniza todas las actividades de un viaje.
    Elimina los itinerarios/actividades anteriores y guarda la nueva lista completa.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token no proporcionado o inválido")
    
    token = authorization.split(" ")[1]
    
    try:
        temp_supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        temp_supabase.postgrest.auth(token)
        
        # 1. Obtener itinerarios existentes para este viaje
        resp_it = temp_supabase.table("itinerarios").select("id_itinerario").eq("id_viaje", id_viaje).execute()
        it_ids = [it["id_itinerario"] for it in resp_it.data]
        
        # 2. Eliminar actividades asociadas (si las hay)
        if it_ids:
            temp_supabase.table("actividades").delete().in_("id_itinerario", it_ids).execute()
            
        # 3. Eliminar itinerarios
        temp_supabase.table("itinerarios").delete().eq("id_viaje", id_viaje).execute()
        
        # 4. Agrupar la nueva lista por dia_numero para crear los itinerarios
        from collections import defaultdict
        grouped_acts = defaultdict(list)
        for act in payload:
            grouped_acts[act.dia_numero].append(act)
            
        # 5. Insertar los nuevos itinerarios y sus actividades
        for dia_num, acts in grouped_acts.items():
            # Crear itinerario para este día
            resp_new_it = temp_supabase.table("itinerarios").insert({
                "id_viaje": id_viaje,
                "dia_numero": dia_num
            }).execute()
            
            if not resp_new_it.data:
                raise Exception(f"No se pudo crear el itinerario para el día {dia_num}")
                
            new_it_id = resp_new_it.data[0]["id_itinerario"]
            
            # Preparar e insertar actividades
            # Preparar e insertar actividades
            acts_to_insert = []
            for idx, act in enumerate(acts):
                # Convertimos el modelo Pydantic a un diccionario de Python para leerlo de forma segura
                act_dict = act.dict()
                
                # Buscamos la foto bajo cualquiera de sus posibles nombres en el JSON
                foto_url = act_dict.get("foto_url") or act_dict.get("url_foto")
                
                if not foto_url or "placeholder" in str(foto_url).lower():
                    foto_url = get_fallback_image(act.nombre)
                    
                desc_data = {
                    "place_id": act_dict.get("place_id"),
                    "foto_url": foto_url,
                    "rating": act_dict.get("rating", 0),
                    "horario": act_dict.get("horario") or ""
                }
                acts_to_insert.append({
                    "id_itinerario": new_it_id,
                    "nombre": act_dict.get("nombre"),
                    "descripcion": json.dumps(desc_data),
                    "orden": idx + 1
                })

            if acts_to_insert:
                temp_supabase.table("actividades").insert(acts_to_insert).execute()
                
        return {"status": "success"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))



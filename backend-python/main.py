import os
import requests
import psycopg2
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def log_usage_to_postgres(file_size_bytes: int):
    db_url = os.getenv("POSTGRES_URL")
    if not db_url: return
    try:
        connection = psycopg2.connect(db_url)
        cursor = connection.cursor()
        cursor.execute("CREATE TABLE IF NOT EXISTS usage_stats (id SERIAL PRIMARY KEY, processed_at TIMESTAMPTZ DEFAULT NOW(), file_size_bytes INTEGER);")
        cursor.execute("INSERT INTO usage_stats (file_size_bytes) VALUES (%s);", (file_size_bytes,))
        connection.commit()
        cursor.close()
        connection.close()
    except Exception as e:
        pass

@app.get("/")
def read_root(): 
    return {"message": "SaaS AI API Libre 100% -> Powered By ClipDrop."}

@app.post("/edit-image")
async def edit_image(
    file: UploadFile = File(...),
    intensity: int = Form(50) # Reservado para usos avanzados si escalamos a otra AI
):
    try:
        input_image_bytes = await file.read()
        file_size = len(input_image_bytes)
        
        if file_size == 0: 
            raise HTTPException(status_code=400, detail="El archivo recibido está vacío.")
            
        CLIPDROP_API_KEY = "5e90934b32ff1406d3124c9e3cc618c722bab6e742f2a570c10f710dbb2b95f643f7b288e4aa2b1bd6c5aff1e8e09081"
        if not CLIPDROP_API_KEY:
            raise HTTPException(status_code=500, detail="Falta vincular la CLIPDROP_API_KEY como Variable de Entorno en el Dashboard.")

        # Proceso 100% Serverless: Delegamos la RAM y la magia pesada a la API externa
        # Esto evitará Timeout de 10s en Vercel.
        c_response = requests.post(
            'https://clipdrop-api.co/remove-background/v1',
            files={'image_file': (file.filename, input_image_bytes, file.content_type)},
            headers={'x-api-key': CLIPDROP_API_KEY},
        )
        
        if c_response.ok:
            # Procesado perfecto 
            log_usage_to_postgres(file_size)
            return Response(content=c_response.content, media_type="image/png")
        else:
            raise HTTPException(status_code=c_response.status_code, detail=f"API ClipDrop se quejó: {c_response.text}")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Falló la ejecución de red: {str(e)}")

import os
import requests
import psycopg2
import replicate
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from io import BytesIO
import base64

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
    return {"message": "SaaS AI API Premium -> Powered By Replicate SDXL."}

@app.post("/edit-image")
async def edit_image(
    file: UploadFile = File(...),
    intensity: int = Form(50)
):
    try:
        input_image_bytes = await file.read()
        file_size = len(input_image_bytes)
        
        if file_size == 0: 
            raise HTTPException(status_code=400, detail="El archivo recibido está vacío.")
            
        token = os.getenv("REPLICATE_API_TOKEN")
        if not token:
            raise HTTPException(status_code=500, detail="Falta REPLICATE_API_TOKEN en el servidor.")

        # Convertir a base64 para la API de Replicate
        image_base64 = f"data:{file.content_type};base64,{base64.b64encode(input_image_bytes).decode('utf-8')}"

        # Ejecutar modelo SDXL Inpainting (lucataco/sdxl-inpainting)
        # Usamos los mismos prompts optimizados que en el frontend
        output = replicate.run(
            "lucataco/sdxl-inpainting:91999980d90d8a56b79759d57a2c89288e178129e924a64396e6cf1e4a683935",
            input={
                "image": image_base64,
                "mask": image_base64, # En modo auto sin máscara enviada, el modelo intenta inpainting general
                "prompt": "background texture, seamless reconstruction, high quality, photorealistic, content-aware fill",
                "negative_prompt": "text, watermark, letters, characters, logo, signature, blurry, distorted, messy",
                "num_inference_steps": 30,
                "guidance_scale": 8.0,
                "mask_blur": 4,
            }
        )

        if not output or len(output) == 0:
            raise HTTPException(status_code=500, detail="El modelo no devolvió ningún resultado.")

        result_url = output[0]
        
        # Descargar el resultado para devolverlo como buffer binario
        res = requests.get(result_url)
        if res.status_code != 200:
            raise HTTPException(status_code=500, detail="No se pudo descargar el resultado de Replicate.")

        log_usage_to_postgres(file_size)
        return Response(content=res.content, media_type="image/png")

    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error del motor IA: {str(e)}")

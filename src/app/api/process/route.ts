import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

const getReplicate = () => new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get("file") as File;
    const maskFile = formData.get("mask_file") as File | null;

    if (!imageFile) {
      return NextResponse.json({ detail: "Falta el archivo de imagen" }, { status: 400 });
    }

    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const imageBase64 = `data:${imageFile.type};base64,${imageBuffer.toString("base64")}`;

    let maskBase64 = "";
    if (maskFile) {
      const maskBuffer = Buffer.from(await maskFile.arrayBuffer());
      maskBase64 = `data:${maskFile.type};base64,${maskBuffer.toString("base64")}`;
    }

    // Modelo lucataco/sdxl-inpainting oficial en Replicate
    // Optimizado para eliminación de marcas de agua (Content-Aware Fill)
    const replicate = getReplicate();
    const output = await replicate.run(
      "lucataco/sdxl-inpainting:91999980d90d8a56b79759d57a2c89288e178129e924a64396e6cf1e4a683935",
      {
        input: {
          image: imageBase64,
          mask: maskBase64 || imageBase64,
          prompt: "background texture, seamless reconstruction, high quality, photorealistic, content-aware fill",
          negative_prompt: "text, watermark, letters, characters, logo, signature, blurry, distorted, messy",
          num_inference_steps: 30,
          guidance_scale: 8.0,
          mask_blur: 4,
        }
      }
    ) as string[];

    const resultUrl = output[0];
    
    // Fetch directo para evitar errores de CORS y Access Denied en el cliente
    const resultRes = await fetch(resultUrl);
    if (!resultRes.ok) throw new Error("Error fetching result from Replicate");
    
    const resultBuffer = await resultRes.arrayBuffer();

    return new NextResponse(resultBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err: any) {
    console.error("AI Engine Error:", err);
    return NextResponse.json(
      { detail: `[REPLICATE-ENGINE] Error: ${err.message}` },
      { status: 500 }
    );
  }
}

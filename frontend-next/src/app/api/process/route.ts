import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    const backendUrl = process.env.BACKEND_URL || "https://saas-ia-editor.vercel.app/edit-image";
    
    const response = await fetch(backendUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { detail: `Error del motor IA: ${errorText}` },
        { status: response.status }
      );
    }

    const imageBuffer = await response.arrayBuffer();
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": "inline; filename=result.png",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { detail: `Error de red: ${err.message}` },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const yamlPath = path.join(process.cwd(), "docs", "openapi.yaml");
    const yamlContent = fs.readFileSync(yamlPath, "utf-8");

    return new NextResponse(yamlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/yaml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "OpenAPI specification could not be loaded." },
      { status: 500 }
    );
  }
}

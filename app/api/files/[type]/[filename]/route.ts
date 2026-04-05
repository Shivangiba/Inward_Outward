import { NextResponse } from "next/server";
import { join } from "path";
import { readFile } from "fs/promises";
import { getServerSession } from "@/lib/auth-server";

export async function GET(
    request: Request,
    { params }: { params: { type: string; filename: string } }
) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const type = params.type;
        const filename = params.filename;

        // Path safety check
        if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
            return NextResponse.json({ error: "Invalid path" }, { status: 400 });
        }

        const filePath = join(process.cwd(), "public", "uploads", type, filename);
        
        try {
            const fileBuffer = await readFile(filePath);
            
            // Determine content type
            let contentType = "application/octet-stream";
            if (filename.toLowerCase().endsWith(".pdf")) contentType = "application/pdf";
            else if (filename.toLowerCase().endsWith(".jpg") || filename.toLowerCase().endsWith(".jpeg")) contentType = "image/jpeg";
            else if (filename.toLowerCase().endsWith(".png")) contentType = "image/png";

            return new NextResponse(fileBuffer, {
                headers: {
                    "Content-Type": contentType,
                    "Content-Disposition": `inline; filename="${filename}"`,
                    "Cache-Control": "public, max-age=31536000, immutable"
                }
            });
        } catch (err) {
            console.error("File not found on disk:", filePath);
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }
    } catch (error: any) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { getServerSession } from "@/lib/auth-server";

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

export async function POST(request: Request) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const formData = await request.formData();
        const file = formData.get("file") as File;
        const type = formData.get("type") as string; // 'inward' or 'outward'

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create unique filename
        const timestamp = Date.now();
        const extension = file.name.split('.').pop();
        const filename = `${type}_${timestamp}.${extension}`;
        
        const uploadDir = join(process.cwd(), "public", "uploads", type);
        const path = join(uploadDir, filename);

        // Ensure directory exists
        await mkdir(uploadDir, { recursive: true });
        
        await writeFile(path, buffer);

        return NextResponse.json({ 
            success: true, 
            path: `/uploads/${type}/${filename}`,
            filename: file.name
        });
    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Failed to upload file", details: error.message }, { status: 500 });
    }
}

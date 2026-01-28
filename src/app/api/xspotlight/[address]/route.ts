import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ address: string }> }
) {
    // Next.js 15 requires awaiting params
    const { address } = await params;

    if (!address) {
        return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

    try {
        const response = await fetch(`https://id-api.multiversx.com/api/v1/users/${address}`, {
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch from xSpotlight: ${response.statusText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

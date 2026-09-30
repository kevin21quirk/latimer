import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { image, field } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Validate base64 image
    if (!image.startsWith('data:image/')) {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
    }

    // Only allow whitelisted image fields
    const imageField = field === "coverImage" ? "coverImage" : "profileImage";

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: {
        [imageField]: image,
      },
      select: {
        profileImage: true,
        coverImage: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error uploading profile image:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}

// Delete profile image
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: {
        profileImage: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting profile image:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}

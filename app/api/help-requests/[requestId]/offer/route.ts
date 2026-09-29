import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await requireAuth();
    const { requestId } = await params;

    // Businesses cannot respond to help requests (safeguarding decision #2).
    const viewer = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { accountType: true, isAdmin: true },
    });
    if (!viewer || !hasPermission(viewer, "help-requests:respond")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Check if request exists and is open
    const helpRequest = await prisma.helpRequest.findUnique({
      where: { id: requestId },
    });

    if (!helpRequest) {
      return NextResponse.json(
        { message: "Help request not found" },
        { status: 404 }
      );
    }

    if (helpRequest.status !== "OPEN") {
      return NextResponse.json(
        { message: "This help request is no longer available" },
        { status: 400 }
      );
    }

    if (helpRequest.requesterId === session.userId) {
      return NextResponse.json(
        { message: "You cannot offer help on your own request" },
        { status: 400 }
      );
    }

    // Update request with helper
    const updated = await prisma.helpRequest.update({
      where: { id: requestId },
      data: {
        helperId: session.userId,
        status: "IN_PROGRESS",
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Offer help error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

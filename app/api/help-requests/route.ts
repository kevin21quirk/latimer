import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { z } from "zod";

const createHelpRequestSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(["COMPANIONSHIP", "FOOD_SUPPORT", "TRANSPORT", "HOME_HELP", "EMERGENCY", "OTHER"]),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  location: z.string().optional(),
});

async function getViewer(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, accountType: true, isAdmin: true },
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const viewer = await getViewer(session.userId);
    if (!viewer || !hasPermission(viewer, "help-requests:create")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const data = createHelpRequestSchema.parse(body);

    const helpRequest = await prisma.helpRequest.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        urgency: data.urgency,
        location: data.location,
        requesterId: session.userId,
      },
    });

    return NextResponse.json(helpRequest, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.issues },
        { status: 400 }
      );
    }

    console.error("Create help request error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await requireAuth();
    const viewer = await getViewer(session.userId);
    if (!viewer || !hasPermission(viewer, "help-requests:view")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const helpRequests = await prisma.helpRequest.findMany({
      where: {
        status: "OPEN",
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            profileImage: true,
            city: true,
          },
        },
      },
      orderBy: [
        { urgency: "desc" },
        { createdAt: "desc" },
      ],
    });

    // Safeguarding: exact location stays with the requester until a helper is
    // accepted. The requester (and admins) still see their own location.
    const canSeeLocation = (requesterId: string) =>
      requesterId === viewer.id || viewer.isAdmin;

    return NextResponse.json(
      helpRequests.map(({ location, ...rest }) => ({
        ...rest,
        location: canSeeLocation(rest.requesterId) ? location : null,
      }))
    );
  } catch (error) {
    console.error("Get help requests error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

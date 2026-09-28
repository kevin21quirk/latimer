import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";

    console.log("Search query received:", query, "Length:", query.length);

    if (!query || query.trim() === "") {
      console.log("Empty query, returning empty array");
      return NextResponse.json([]);
    }

    const searchLower = query.toLowerCase();
    console.log("Searching for:", searchLower);

    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            id: {
              not: session.userId, // Exclude current user
            },
          },
          {
            OR: [
              {
                firstName: {
                  startsWith: searchLower,
                  mode: "insensitive",
                },
              },
              {
                lastName: {
                  startsWith: searchLower,
                  mode: "insensitive",
                },
              },
              {
                companyName: {
                  startsWith: searchLower,
                  mode: "insensitive",
                },
              },
              {
                charityName: {
                  startsWith: searchLower,
                  mode: "insensitive",
                },
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        accountType: true,
        profileImage: true,
        companyName: true,
        charityName: true,
      },
      take: 20,
      orderBy: {
        firstName: "asc",
      },
    });

    console.log("Found users:", users.length);
    return NextResponse.json(users);
  } catch (error) {
    console.error("User search error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

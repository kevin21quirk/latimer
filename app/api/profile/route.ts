import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phoneNumber: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().min(1).optional(),
  postcode: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  charityNumber: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  interests: z.array(z.string()).optional(),
  marketingConsent: z.boolean().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const data = updateProfileSchema.parse(body);

    // Build update data object with only provided fields
    const updateData: Prisma.UserUpdateInput = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber || null;
    if (data.address !== undefined) updateData.address = data.address || null;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.postcode !== undefined) updateData.postcode = data.postcode || null;
    if (data.companyName !== undefined) updateData.companyName = data.companyName || null;
    if (data.charityNumber !== undefined) updateData.charityNumber = data.charityNumber || null;
    if (data.bio !== undefined) updateData.bio = data.bio || null;
    if (data.interests !== undefined) updateData.interests = data.interests;
    if (data.marketingConsent !== undefined) updateData.marketingConsent = data.marketingConsent;

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        accountType: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.issues },
        { status: 400 }
      );
    }

    console.error("Update profile error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        accountType: true,
        dateOfBirth: true,
        phoneNumber: true,
        address: true,
        city: true,
        postcode: true,
        companyName: true,
        charityNumber: true,
        bio: true,
        profileImage: true,
        coverImage: true,
        marketingConsent: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

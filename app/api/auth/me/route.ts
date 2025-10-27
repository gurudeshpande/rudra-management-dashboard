// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

if (!process.env.JWT_SECRET) {
  throw new Error("Missing required environment variable: JWT_SECRET");
}

export async function GET(request: Request) {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          message: "Unauthorized - No token provided",
          error: "Please log in to access this resource",
        },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    try {
      // Verify the JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
        role: string;
        email: string;
      };

      // Find the user in database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          {
            message: "User not found",
            error: "User account may have been deleted",
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: "Current user fetched successfully",
        user,
      });
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError);
      return NextResponse.json(
        {
          message: "Invalid token",
          error: "Please log in again",
        },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error("Error fetching current user:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

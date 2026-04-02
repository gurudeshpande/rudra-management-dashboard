// app/api/auth/login/route.ts
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";


const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

if (!process.env.JWT_SECRET) {
  throw new Error("Missing required environment variable: JWT_SECRET");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log(body);

    // Validate input
    const validatedInput = LoginSchema.safeParse(body);
    if (!validatedInput.success) {
      return new Response(
        JSON.stringify({
          message: "Validation error",
          errors: validatedInput.error.issues,
        }),
        { status: 400 }
      );
    }

    const { email, password } = validatedInput.data;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });

    console.log(user);
    if (!user) {
      console.log("hii");
      return new Response(JSON.stringify({ message: "Invalid credentials" }), {
        status: 401,
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    console.log(isPasswordValid);
    if (!isPasswordValid) {
      return new Response(JSON.stringify({ message: "Invalid credentials" }), {
        status: 401,
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    const { password: _, ...userWithoutPassword } = user;

    return new Response(JSON.stringify({ token, user: userWithoutPassword }), {
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}

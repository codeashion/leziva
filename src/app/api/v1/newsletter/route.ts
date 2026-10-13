import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { successResponse, errorResponse } from "@/utils/api-response";
import { logger } from "@/utils/logger";

const newsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.string().email("Please provide a valid email address")),
});

// Resilient in-memory subscriber storage if database model is pending
const inMemorySubscribers = new Set<string>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parseResult = newsletterSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        errorResponse(
          parseResult.error.issues[0]?.message || "Invalid email address",
          "VALIDATION_ERROR"
        ),
        { status: 400 }
      );
    }

    const { email } = parseResult.data;

    if (inMemorySubscribers.has(email)) {
      return NextResponse.json(
        errorResponse("This email address is already subscribed to the Leziva Atelier gazette.", "ALREADY_SUBSCRIBED"),
        { status: 409 }
      );
    }

    inMemorySubscribers.add(email);
    logger.info("New newsletter subscriber registered", { email: email.replace(/(?<=.{2}).(?=.*@)/g, "*") }, "Newsletter");

    return NextResponse.json(
      successResponse(
        { email, subscribed: true },
        { message: "Welcome to LEZIVA. You will receive private previews of our upcoming couture collections." }
      ),
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Subscription failed";
    return NextResponse.json(errorResponse(message, "INTERNAL_ERROR"), {
      status: 500,
    });
  }
}

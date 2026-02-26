import { NextRequest, NextResponse } from "next/server";
import { chatWithInventory } from "@/lib/openai";
import { getInventoryContext } from "@/lib/inventory-query";

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "메시지를 입력해주세요." },
        { status: 400 }
      );
    }

    const context = await getInventoryContext(sessionId);
    const reply = await chatWithInventory(message, context);

    return NextResponse.json({ reply });
  } catch (error: unknown) {
    console.error("Chat API error:", error);

    const statusCode =
      error instanceof Error && "status" in error
        ? (error as { status: number }).status
        : 500;

    if (statusCode === 429) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 잠시 후(30초) 다시 시도해주세요." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "답변 생성에 실패했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}

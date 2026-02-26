import { NextRequest, NextResponse } from "next/server";
import { verifySlackRequest } from "@/lib/slack";
import { chatWithInventory } from "@/lib/openai";
import { getInventoryContext } from "@/lib/inventory-query";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);

    // Slack 요청 검증
    const signature = request.headers.get("x-slack-signature") ?? "";
    const timestamp = request.headers.get("x-slack-request-timestamp") ?? "";
    const signingSecret = process.env.SLACK_SIGNING_SECRET;

    if (signingSecret) {
      const isValid = verifySlackRequest(
        signingSecret,
        signature,
        timestamp,
        body
      );
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid request signature" },
          { status: 401 }
        );
      }
    }

    const userMessage = params.get("text") ?? "";

    if (!userMessage.trim()) {
      return NextResponse.json({
        response_type: "ephemeral",
        text: "사용법: `/재고 콜라 몇 개 있어?`\n재고에 대해 궁금한 점을 물어보세요!",
      });
    }

    // LLM 응답 생성 (Slack은 3초 내 응답 필요하므로 비동기 처리)
    const context = await getInventoryContext();
    const reply = await chatWithInventory(userMessage, context);

    return NextResponse.json({
      response_type: "in_channel",
      text: `*질문:* ${userMessage}\n\n${reply}`,
    });
  } catch (error) {
    console.error("Slack command error:", error);
    return NextResponse.json({
      response_type: "ephemeral",
      text: "오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    });
  }
}

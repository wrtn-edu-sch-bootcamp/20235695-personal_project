import OpenAI from "openai";

export const SYSTEM_PROMPT = `너는 편의점 재고 관리 도우미 "InvenBot"이야.
사용자가 재고에 대해 질문하면 제공된 재고 데이터를 기반으로 정확하게 답변해.

답변 규칙:
1. 특정 상품 조회 → 상품명에 키워드가 포함된 품목을 찾아 수량과 상태를 알려줘
2. 전체 현황 질문 → 전체 품목 수, 확인 완료 수, 불일치 수를 요약해줘
3. 불일치 목록 질문 → 불일치(mismatched) 상태인 품목만 정리해줘
4. 미확인 품목 질문 → 대기(pending) 상태인 품목을 알려줘
5. 요약 요청 → 전체 재고 확인 결과를 간결하게 요약해줘

상태 설명:
- pending: 아직 확인하지 않은 품목
- matched: 재고서 수량과 실물 수량이 일치
- mismatched: 재고서 수량과 실물 수량이 불일치

항상 한국어로 친절하고 간결하게 답변해. 데이터에 없는 정보는 추측하지 말고 "해당 정보가 없습니다"라고 답변해.`;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function chatWithInventory(
  userMessage: string,
  inventoryContext: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required.");
  }
  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const prompt = `현재 재고 데이터:\n${inventoryContext}\n\n질문: ${userMessage}`;

  // 최대 3회 재시도 (429 에러 시)
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      });
      return result.choices[0]?.message?.content || "답변을 생성할 수 없습니다.";
    } catch (error: unknown) {
      const status =
        error instanceof Error && "status" in error
          ? (error as { status: number }).status
          : 0;

      if (status === 429 && attempt < 2) {
        const waitTime = (attempt + 1) * 10000;
        console.log(`Rate limited. Retrying in ${waitTime / 1000}s...`);
        await sleep(waitTime);
        continue;
      }
      throw error;
    }
  }

  return "답변을 생성할 수 없습니다.";
}

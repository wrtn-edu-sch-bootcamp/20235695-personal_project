import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const STUDY_SYSTEM_PROMPT = `당신은 학생들의 복습을 돕는 AI 튜터입니다.

주어진 과목에 대해 다음 기준으로 복습 내용을 생성하세요:
- 핵심 개념 1-2개를 간결하게 설명 (최대 200자)
- 실생활 예시나 비유를 포함
- 이해를 돕는 질문 1개 추가
- 친근하고 격려하는 톤 사용

예시:
"📚 운영체제 - 프로세스와 스레드

프로세스는 실행 중인 프로그램, 스레드는 프로세스 내 실행 단위입니다. 
식당에 비유하면 프로세스는 식당 전체, 스레드는 각 직원이에요.

💡 질문: 멀티스레딩의 장점은 무엇일까요?"

형식을 지키되, 매번 다른 주제와 내용을 생성하세요.`;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY가 설정되지 않았습니다." },
        { status: 500 }
      );
    }
    const client = new OpenAI({ apiKey });
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const { subjectName } = await req.json();

    if (!subjectName) {
      return NextResponse.json(
        { error: "과목명이 필요합니다" },
        { status: 400 }
      );
    }

    let content = "";
    let retries = 3;

    while (retries > 0) {
      try {
        const result = await client.chat.completions.create({
          model,
          messages: [
            { role: "system", content: STUDY_SYSTEM_PROMPT },
            {
              role: "user",
              content: `"${subjectName}" 과목에 대한 복습 내용을 생성해주세요.`,
            },
          ],
          temperature: 0.7,
        });
        content = result.choices[0]?.message?.content || "";
        break;
      } catch (err) {
        const error = err as Error;
        if (error.message?.includes("429") && retries > 1) {
          await sleep(10000);
          retries--;
        } else {
          throw err;
        }
      }
    }

    if (!content) {
      throw new Error("복습 내용 생성 실패");
    }

    const supabase = await createClient();
    const { data: activeSession } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("status", "active")
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    if (activeSession) {
      await supabase.from("study_reminders").insert({
        session_id: activeSession.id,
        subject_name: subjectName,
        content,
      });

      await supabase
        .from("study_sessions")
        .update({
          last_reminder_at: new Date().toISOString(),
          reminder_count: activeSession.reminder_count + 1,
        })
        .eq("id", activeSession.id);
    }

    return NextResponse.json({ content });
  } catch (error) {
    const err = error as Error;
    console.error("Study reminder error:", error);
    return NextResponse.json(
      { error: err.message || "복습 내용 생성 실패" },
      { status: 500 }
    );
  }
}

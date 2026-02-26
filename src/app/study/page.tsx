"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StudentSubject, StudySession, StudyReminder } from "@/types/study";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Clock, CheckCircle2, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function StudyPage() {
  const [subjects, setSubjects] = useState<StudentSubject[]>([]);
  const [activeSession, setActiveSession] = useState<StudySession | null>(null);
  const [currentReminder, setCurrentReminder] = useState<StudyReminder | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [nextReminderIn, setNextReminderIn] = useState<number | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeSession || !activeSession.last_reminder_at) return;

    const interval = setInterval(() => {
      const lastReminder = new Date(activeSession.last_reminder_at!).getTime();
      const now = Date.now();
      const elapsed = now - lastReminder;
      const remaining = 1 * 60 * 1000 - elapsed; // 1분으로 변경 (테스트용)

      if (remaining > 0) {
        setNextReminderIn(Math.ceil(remaining / 1000));
      } else {
        setNextReminderIn(0);
        // 타이머 완료 시 자동으로 다음 알림 생성
        if (!generating && !currentReminder) {
          generateReminder();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession, generating, currentReminder]);

  async function loadData() {
    const [subjectsRes, sessionRes, reminderRes] = await Promise.all([
      supabase
        .from("student_subjects")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("study_sessions")
        .select("*")
        .eq("status", "active")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("study_reminders")
        .select("*")
        .is("confirmed_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (subjectsRes.data) setSubjects(subjectsRes.data);
    if (sessionRes.data) setActiveSession(sessionRes.data);
    if (reminderRes.data) setCurrentReminder(reminderRes.data);

    setLoading(false);
  }

  async function startSession(subjectId: string) {
    const { data, error } = await supabase
      .from("study_sessions")
      .insert({
        subject_id: subjectId,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "오류",
        description: "세션 시작 실패",
        variant: "destructive",
      });
    } else {
      setActiveSession(data);
      toast({ title: "성공", description: "복습 모드가 시작되었습니다" });
      await generateReminder(subjectId);
    }
  }

  async function generateReminder(subjectId?: string) {
    if (!activeSession && !subjectId) return;

    setGenerating(true);
    const targetSubjectId = subjectId || activeSession?.subject_id;
    const subject = subjects.find((s) => s.id === targetSubjectId);

    if (!subject) {
      toast({
        title: "오류",
        description: "과목을 찾을 수 없습니다",
        variant: "destructive",
      });
      setGenerating(false);
      return;
    }

    try {
      const res = await fetch("/api/study/reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectName: subject.subject_name }),
      });

      if (!res.ok) throw new Error("복습 내용 생성 실패");

      await res.json();

      const { data: newReminder } = await supabase
        .from("study_reminders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (newReminder) {
        setCurrentReminder(newReminder);
      }

      await loadData();
      toast({ title: "새 복습 내용", description: "확인해주세요!" });
    } catch (err) {
      const error = err as Error;
      toast({
        title: "오류",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  }

  async function confirmReminder() {
    if (!currentReminder) return;

    await supabase
      .from("study_reminders")
      .update({ confirmed_at: new Date().toISOString() })
      .eq("id", currentReminder.id);

    setCurrentReminder(null);
    toast({ title: "완료", description: "30분 후 다음 알림을 받습니다" });
    await loadData();
  }

  async function stopSession() {
    if (!activeSession) return;

    await supabase
      .from("study_sessions")
      .update({ status: "completed" })
      .eq("id", activeSession.id);

    setActiveSession(null);
    setCurrentReminder(null);
    setNextReminderIn(null);
    toast({ title: "종료", description: "복습 모드가 종료되었습니다" });
  }

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="container mx-auto p-4 pb-24 max-w-2xl">
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">과목을 먼저 등록하세요</h2>
            <p className="text-muted-foreground mb-6">
              복습할 과목을 추가해야 학습 모드를 시작할 수 있습니다
            </p>
            <Link href="/study/subjects">
              <Button>과목 관리로 이동</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pb-24 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">📖 학습 복습 모드</h1>

      {activeSession ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-green-500" />
                  복습 중
                </span>
                {nextReminderIn !== null && nextReminderIn > 0 && (
                  <span className="text-sm font-normal text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    다음 알림: {formatTime(nextReminderIn)}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                총 {activeSession.reminder_count}개의 복습 완료
              </p>
              <Button variant="destructive" onClick={stopSession} className="w-full">
                복습 모드 종료
              </Button>
            </CardContent>
          </Card>

          {currentReminder ? (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="text-primary">
                  🔔 {currentReminder.subject_name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {currentReminder.content}
                </div>
                <Button
                  onClick={confirmReminder}
                  className="w-full"
                  disabled={generating}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  확인 완료
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {generating ? "복습 내용 생성 중..." : "다음 알림을 기다리는 중..."}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground mb-4">
            복습할 과목을 선택하세요
          </p>
          {subjects.map((subject) => (
            <Card key={subject.id} className="cursor-pointer hover:border-primary">
              <CardContent
                className="py-4"
                onClick={() => startSession(subject.id)}
              >
                <h3 className="font-semibold">{subject.subject_name}</h3>
                {subject.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {subject.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

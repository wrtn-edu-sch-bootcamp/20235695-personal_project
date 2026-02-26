"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StudentSubject, StudySession, StudyReminder } from "@/types/study";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  Clock,
  CheckCircle2,
  Play,
  Maximize2,
  Minimize2,
  Plus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

const REMINDER_INTERVAL_MS = 30 * 60 * 1000;

export default function StudyPage() {
  const [subjects, setSubjects] = useState<StudentSubject[]>([]);
  const [activeSession, setActiveSession] = useState<StudySession | null>(null);
  const [currentReminder, setCurrentReminder] = useState<StudyReminder | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [nextReminderIn, setNextReminderIn] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [addingSubject, setAddingSubject] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: "", description: "" });
  const generatingRef = useRef(false);
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
      const remaining = REMINDER_INTERVAL_MS - elapsed;

      if (remaining > 0) {
        setNextReminderIn(Math.ceil(remaining / 1000));
      } else {
        setNextReminderIn(0);
        // 타이머 완료 시 자동으로 다음 알림 생성
        if (!generatingRef.current && !currentReminder) {
          generateReminder();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession, currentReminder]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeSession || currentReminder || generatingRef.current) return;

    const lastReminderTime = activeSession.last_reminder_at
      ? new Date(activeSession.last_reminder_at).getTime()
      : 0;
    const isDue =
      !lastReminderTime || Date.now() - lastReminderTime >= REMINDER_INTERVAL_MS;

    if (isDue) {
      generateReminder();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession?.id, activeSession?.last_reminder_at, currentReminder?.id]);

  async function loadData() {
    const [subjectsRes, sessionRes] = await Promise.all([
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
    ]);

    if (subjectsRes.data) {
      setSubjects(subjectsRes.data);
    }

    if (sessionRes.data) {
      setActiveSession(sessionRes.data);
      const { data: reminderData } = await supabase
        .from("study_reminders")
        .select("*")
        .eq("session_id", sessionRes.data.id)
        .is("confirmed_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setCurrentReminder(reminderData ?? null);
    } else {
      setActiveSession(null);
      setCurrentReminder(null);
    }

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
    if (generatingRef.current) return;

    generatingRef.current = true;
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
      generatingRef.current = false;
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
      generatingRef.current = false;
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

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      toast({
        title: "오류",
        description: "전체화면 전환을 지원하지 않는 환경입니다",
        variant: "destructive",
      });
    }
  }

  async function addSubject() {
    if (!newSubject.name.trim()) {
      toast({
        title: "입력 오류",
        description: "과목명을 입력하세요",
        variant: "destructive",
      });
      return;
    }

    setAddingSubject(true);
    const { error } = await supabase.from("student_subjects").insert({
      subject_name: newSubject.name.trim(),
      description: newSubject.description.trim() || null,
    });

    if (error) {
      toast({
        title: "오류",
        description: "과목 추가 실패",
        variant: "destructive",
      });
    } else {
      toast({ title: "성공", description: "과목이 추가되었습니다" });
      setNewSubject({ name: "", description: "" });
      await loadData();
    }
    setAddingSubject(false);
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
      <div className="mb-6 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">📖 학습 복습 모드</h1>
        <div className="flex gap-2">
          <Link href="/study/subjects">
            <Button variant="outline" size="sm">
              과목 관리
            </Button>
          </Link>
          {activeSession && (
            <Button variant="secondary" size="sm" onClick={toggleFullscreen}>
              {isFullscreen ? (
                <>
                  <Minimize2 className="mr-2 h-4 w-4" />
                  전체화면 종료
                </>
              ) : (
                <>
                  <Maximize2 className="mr-2 h-4 w-4" />
                  전체화면
                </>
              )}
            </Button>
          )}
        </div>
      </div>

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
          <Card>
            <CardHeader>
              <CardTitle>과목 빠른 추가</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="과목명 (예: 운영체제)"
                value={newSubject.name}
                onChange={(e) =>
                  setNewSubject({ ...newSubject, name: e.target.value })
                }
              />
              <Textarea
                placeholder="설명 (선택사항)"
                value={newSubject.description}
                onChange={(e) =>
                  setNewSubject({
                    ...newSubject,
                    description: e.target.value,
                  })
                }
                rows={2}
              />
              <Button
                onClick={addSubject}
                className="w-full"
                disabled={addingSubject}
              >
                <Plus className="mr-2 h-4 w-4" />
                {addingSubject ? "추가 중..." : "과목 추가"}
              </Button>
            </CardContent>
          </Card>

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

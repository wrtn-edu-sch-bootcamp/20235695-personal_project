"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StudentSubject } from "@/types/study";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SubjectsClient() {
  const [subjects, setSubjects] = useState<StudentSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSubject, setNewSubject] = useState({ name: "", description: "" });
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    loadSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSubjects() {
    const { data, error } = await supabase
      .from("student_subjects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "오류",
        description: "과목 목록을 불러올 수 없습니다",
        variant: "destructive",
      });
    } else {
      setSubjects(data || []);
    }
    setLoading(false);
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
      loadSubjects();
    }
  }

  async function deleteSubject(id: string) {
    const { error } = await supabase
      .from("student_subjects")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "오류",
        description: "과목 삭제 실패",
        variant: "destructive",
      });
    } else {
      toast({ title: "성공", description: "과목이 삭제되었습니다" });
      loadSubjects();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pb-24 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">📚 과목 관리</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>새 과목 추가</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              setNewSubject({ ...newSubject, description: e.target.value })
            }
            rows={3}
          />
          <Button onClick={addSubject} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            과목 추가
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {subjects.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              등록된 과목이 없습니다
            </CardContent>
          </Card>
        ) : (
          subjects.map((subject) => (
            <Card key={subject.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex-1">
                  <h3 className="font-semibold">{subject.subject_name}</h3>
                  {subject.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {subject.description}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteSubject(subject.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

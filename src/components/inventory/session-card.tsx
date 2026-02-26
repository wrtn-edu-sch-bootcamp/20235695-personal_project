"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { InventorySession } from "@/types/database";
import { CheckCircle, Clock, Package } from "lucide-react";

interface SessionCardProps {
  session: InventorySession;
}

export function SessionCard({ session }: SessionCardProps) {
  const progress =
    session.total_items > 0
      ? Math.round((session.checked_items / session.total_items) * 100)
      : 0;

  const isCompleted = session.status === "completed";

  return (
    <Link href={`/session/${session.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-base font-semibold leading-tight">
              {session.name}
            </CardTitle>
            <Badge variant={isCompleted ? "default" : "secondary"}>
              {isCompleted ? (
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> 완료
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> 진행중
                </span>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              {session.checked_items} / {session.total_items} 품목
            </span>
            <span className="font-medium text-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {new Date(session.created_at).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

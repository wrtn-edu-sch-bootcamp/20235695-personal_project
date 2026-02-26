export interface StudentSubject {
  id: string;
  subject_name: string;
  description: string | null;
  created_at: string;
}

export interface StudySession {
  id: string;
  subject_id: string;
  status: "active" | "paused" | "completed";
  started_at: string;
  last_reminder_at: string | null;
  reminder_count: number;
}

export interface StudyReminder {
  id: string;
  session_id: string;
  subject_name: string;
  content: string;
  confirmed_at: string | null;
  created_at: string;
}

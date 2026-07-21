export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  plan: "free" | "pro";
  meetings_count: number;
  stripe_customer_id: string | null;
  created_at: string;
}

export interface Meeting {
  id: string;
  user_id: string;
  title: string | null;
  type: "internal" | "client" | "sales";
  duration_seconds: number | null;
  summary: string | null;
  decisions: string[];
  transcript: string | null;
  audio_url: string | null;
  created_at: string;
  actions?: Action[];
}

export interface Action {
  id: string;
  meeting_id: string;
  user_id: string;
  title: string;
  owner_name: string | null;
  due_date: string | null;
  priority: "high" | "medium" | "low";
  status: "open" | "done";
  reminder_sent: boolean;
  created_at: string;
  meetings?: Pick<Meeting, "id" | "title">;
}

export interface MeetingRecipient {
  id: string;
  meeting_id: string;
  email: string;
  sent_at: string | null;
}

export type ActionStatus = "overdue" | "today" | "upcoming" | "done";

export function getActionStatus(action: Action): ActionStatus {
  if (action.status === "done") return "done";
  if (!action.due_date) return "upcoming";
  const due = new Date(action.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  if (due < today) return "overdue";
  if (due.getTime() === today.getTime()) return "today";
  return "upcoming";
}

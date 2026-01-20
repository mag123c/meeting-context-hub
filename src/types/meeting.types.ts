export interface ActionItem {
  task: string;
  assignee: string | null;
  deadline: string | null;
}

export interface MeetingSummary {
  title: string;
  date: string | null;
  participants: string[];
  summary: string;
  decisions: string[];
  actionItems: ActionItem[];
  keyPoints: string[];
  openIssues: string[];
  nextSteps: string[];
  project?: string | null; // AI가 추출한 프로젝트명
  sprint?: string | null;  // AI가 추출한 스프린트명
}

export interface Meeting {
  id: string;
  transcript: string;
  summary: MeetingSummary;
  tags: string[];
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMeetingInput {
  transcript: string;
  source?: string;
  project?: string; // 프로젝트 이름
  sprint?: string; // 스프린트 식별자
}

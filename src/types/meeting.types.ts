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
  project?: string | null;  // AI-extracted project name
  sprint?: string | null;   // AI-extracted sprint name
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
  project?: string;   // Project name (hierarchy: level 1)
  category?: string;  // Category name (hierarchy: level 2)
  sprint?: string;    // Sprint identifier
}

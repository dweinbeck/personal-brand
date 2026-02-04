export interface TodoistProject {
  id: string;
  name: string;
  comment_count: number;
  order: number;
  color: string;
  is_shared: boolean;
  is_favorite: boolean;
  is_inbox_project: boolean;
  is_team_inbox: boolean;
  view_style: string;
  url: string;
}

export interface TodoistSection {
  id: string;
  project_id: string;
  order: number;
  name: string;
}

export interface TodoistTask {
  id: string;
  project_id: string;
  section_id: string;
  content: string;
  description: string;
  is_completed: boolean;
  order: number;
  priority: number;
  due: {
    date: string;
    string: string;
    recurring: boolean;
  } | null;
  labels: string[];
}

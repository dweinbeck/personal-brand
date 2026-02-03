export interface Project {
  name: string;
  description: string;
  language: string | null;
  stars: number;
  url: string;
  homepage: string | null;
  topics: string[];
}

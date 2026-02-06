import accomplishmentsData from "@/data/accomplishments.json";

export interface Accomplishment {
  slug: string;
  title: string;
  role: string;
  years: string;
  company: string;
  companyLogo?: string | null;
  description: string;
  skills: string[];
  setup?: string;
  workCompleted?: string;
  results?: string;
  skillsUnlocked?: string[];
}

export function getAccomplishments(): Accomplishment[] {
  return accomplishmentsData as Accomplishment[];
}

export function getAccomplishmentBySlug(
  slug: string,
): Accomplishment | undefined {
  return getAccomplishments().find((a) => a.slug === slug);
}

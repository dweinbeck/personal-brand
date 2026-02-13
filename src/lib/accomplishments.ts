import accomplishmentsData from "@/data/accomplishments.json";

export interface Accomplishment {
  slug: string;
  title: string;
  role: string;
  years: string;
  company: string;
  location?: string;
  companyLogo?: string | null;
  tags: string[];
  setup?: string;
  workCompleted?: string;
  results?: string;
  skillsExercised?: string[];
}

export function getAccomplishments(): Accomplishment[] {
  return accomplishmentsData as Accomplishment[];
}

export function getAccomplishmentBySlug(
  slug: string,
): Accomplishment | undefined {
  return getAccomplishments().find((a) => a.slug === slug);
}

import customGptsData from "@/data/custom-gpts.json";

export interface CustomGpt {
  slug: string;
  name: string;
  description: string;
  url: string;
  tags: string[];
}

export function getCustomGpts(): CustomGpt[] {
  return customGptsData as CustomGpt[];
}

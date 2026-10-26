import type { Course, CourseLevel } from "./types";

type Seed = [slug: string, title: string, category: string, level: CourseLevel, actual: number, final: number];

const SEED: Seed[] = [
  ["full-stack-development-ai", "Full-Stack Development using AI", "Web Development", "Intermediate", 999, 699],
  ["machine-learning", "Machine Learning", "AI & Data", "Advanced", 999, 699],
  ["generative-ai-llm-engineering", "Generative AI & LLM Engineering", "AI & Data", "Advanced", 999, 699],
  ["data-structures-algorithms", "Data Structures & Algorithms", "Programming", "Intermediate", 999, 699],
  ["mlops-ai-deployment", "MLOps & AI Deployment", "AI & Data", "Advanced", 999, 699],
];

export const COURSE_SEED: Course[] = SEED.map(
  ([slug, title, category, level, actual, final]) => ({
    id: slug,
    slug,
    title,
    category,
    level,
    actualPrice: actual,
    discountedPrice: final,
    active: true,
  }),
);

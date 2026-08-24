import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LearnWorkspace } from "@/components/learn-workspace";
import { isLessonSlug, learningLesson } from "@/lib/learning/catalog";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: isLessonSlug(slug) ? learningLesson(slug).title : "Lesson" };
}

export default async function LessonPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ step?: string }> }) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  if (!isLessonSlug(slug)) notFound();
  return <LearnWorkspace lessonSlug={slug} initialStep={query.step} />;
}

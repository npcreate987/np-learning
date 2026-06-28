import { redirect } from "next/navigation";

export default async function LearnPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/classes/${slug}`);
}

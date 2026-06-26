import { TiktokFeed } from "@/components/tiktok-feed";

export const metadata = { title: "คลาส TikTok" };

export default async function ClassFeedPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <TiktokFeed slug={slug} />;
}

import { MockJoinLink } from "@/components/mock/MockJoinLink";

export default async function MockJoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <MockJoinLink code={decodeURIComponent(code)} />;
}

import { MockRoom } from "@/components/mock/MockRoom";

export default async function MockSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MockRoom sessionId={id} />;
}

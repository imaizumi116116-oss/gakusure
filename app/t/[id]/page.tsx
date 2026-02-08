import { redirect } from 'next/navigation';

type Params = {
  id: string;
};

export default function LegacyThreadRedirect({ params }: { params: Params }) {
  redirect(`/thread/${params.id}`);
}

import { PageHeader } from '@/components/PageHeader';
import { ChatPanel } from '@/components/ChatPanel';
import { useStore } from '@/store/useStore';

export default function Communication() {
  const labels = useStore((s) => s.moduleLabels);
  const employees = useStore((s) => s.employees);
  const dispatcher = employees.find((e) => e.role === 'dispatcher');

  return (
    <div>
      <PageHeader
        title={labels.communication}
        description="One shared channel between dispatch and every driver."
      />
      <ChatPanel side="dispatch" authorId={dispatcher?.id ?? 'emp-06'} title="Dispatch channel" />
    </div>
  );
}

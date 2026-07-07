import { PageHeader } from '@/components/PageHeader';
import { ChatPanel } from '@/components/ChatPanel';
import { useCurrentEmployee, useStore } from '@/store/useStore';

export default function DriverCommunication() {
  const me = useCurrentEmployee();
  const labels = useStore((s) => s.moduleLabels);

  return (
    <div>
      <PageHeader
        title={labels.communication}
        description="Message dispatch on the shared channel."
      />
      <ChatPanel side="driver" authorId={me?.id ?? 'emp-01'} title="Dispatch channel" />
    </div>
  );
}

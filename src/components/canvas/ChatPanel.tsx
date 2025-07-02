import React from 'react';
import ChatSession from '@/components/ChatSession';
import { Session, ChatMessage } from '@/pages/Assistant';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatPanelProps {
  session: Session;
  onUpdateMessages: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void;
  isCollapsed: boolean;
  className?: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  session,
  onUpdateMessages,
  isCollapsed,
  className
}) => {
  if (isCollapsed) {
    return null;
  }

  return (
    <div className={cn(
      "flex flex-col h-full bg-card border-r border-border",
      className
    )}>
      <div className="flex-1 min-h-0">
        <ChatSession
          session={session}
          onUpdateSessionMessages={onUpdateMessages}
          selectedFile={null}
          onCloseFileViewer={() => {}}
          onFileSelect={() => {}}
          compact={true} // Enable compact mode for canvas
        />
      </div>
    </div>
  );
};
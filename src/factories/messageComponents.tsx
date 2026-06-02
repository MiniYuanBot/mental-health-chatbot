import ChatBubble from '../components/ChatBubble';
import type { ChatMessage, Profile } from '../utils/storage';

type MessageComponentProps = {
  message: ChatMessage;
  profile: Profile;
};

export function UserMessage({ message, profile }: MessageComponentProps) {
  return <ChatBubble message={message} nickname={profile.nickname} />;
}

export function AIMessage({ message, profile }: MessageComponentProps) {
  return <ChatBubble message={message} nickname={profile.nickname} />;
}
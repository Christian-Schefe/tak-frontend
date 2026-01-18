import { Component, computed, inject, input } from '@angular/core';
import { ChatMessageConversation, ChatService } from '../../services/chat-service/chat-service';
import { DatePipe } from '@angular/common';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { PlayerService } from '../../services/player-service/player-service';

@Component({
  selector: 'app-chat-conversation',
  imports: [DatePipe, ScrollPanelModule],
  templateUrl: './chat-conversation.html',
  styleUrl: './chat-conversation.css',
})
export class ChatConversation {
  chatService = inject(ChatService);
  playerService = inject(PlayerService);
  source = input.required<ChatMessageConversation>();

  playerInfos = this.playerService.getComputedPlayerInfosByAccountId(() => {
    const ids = new Set<string>();
    const messages = this.chatService.getMessageSignal(this.source())();
    for (const msg of messages) {
      ids.add(msg.fromAccountId);
    }
    return Array.from(ids);
  });

  messages = computed(() => {
    const messages = this.chatService.getMessageSignal(this.source())();
    const result = [];
    for (let i = 0; i < messages.length; i++) {
      const prev = i > 0 ? messages[i - 1] : null;
      const showTimestamp =
        !prev || areTimestampsDifferentMinutes(prev.timestamp, messages[i].timestamp);
      result.push({ msg: messages[i], showTimestamp });
    }
    return result;
  });
}

function areTimestampsDifferentMinutes(t1: number, t2: number): boolean {
  const date1 = new Date(t1);
  const date2 = new Date(t2);
  return (
    date1.getUTCFullYear() !== date2.getUTCFullYear() ||
    date1.getUTCMonth() !== date2.getUTCMonth() ||
    date1.getUTCDate() !== date2.getUTCDate() ||
    date1.getUTCHours() !== date2.getUTCHours() ||
    date1.getUTCMinutes() !== date2.getUTCMinutes()
  );
}

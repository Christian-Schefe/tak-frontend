import { Component, computed, inject, signal } from '@angular/core';
import { ChatConversation } from '../chat-conversation/chat-conversation';
import { InputTextModule } from 'primeng/inputtext';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { ButtonModule } from 'primeng/button';
import { lucideSend } from '@ng-icons/lucide';
import { ChatMessageConversation, ChatService } from '../../services/chat-service/chat-service';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'primeng/tabs';
import { PlayerService } from '../../services/player-service/player-service';

@Component({
  selector: 'app-game-chat-panel',
  imports: [ChatConversation, InputTextModule, NgIcon, ButtonModule, FormsModule, TabsModule],
  templateUrl: './game-chat-panel.html',
  styleUrl: './game-chat-panel.css',
  viewProviders: [provideIcons({ lucideSend })],
})
export class GameChatPanel {
  playerService = inject(PlayerService);

  chatSources = computed(() => {
    const map = this.chatService.chatSources();
    const result: ChatMessageConversation[] = [];
    for (const conv of map.values()) {
      result.push(conv);
    }
    result.sort((a, b) => a.id.localeCompare(b.id));
    return result;
  });

  chatSourceId = signal<string>('global');
  chatSource = computed<ChatMessageConversation>(() => {
    const id = this.chatSourceId();
    return this.chatService.chatSources().get(id) ?? { id: 'global', type: 'global' };
  });

  playerInfos = this.playerService.getComputedPlayerInfosByAccountId(() => {
    const ids = new Set<string>();
    for (const conv of this.chatSources()) {
      if (conv.type === 'private') {
        ids.add(conv.toAccountId);
      }
    }
    return Array.from(ids);
  });

  onValueChange(id: unknown) {
    if (typeof id !== 'string') {
      return;
    }
    this.chatSourceId.set(id);
  }

  chatService = inject(ChatService);

  message = signal<string>('');

  onSendMessage() {
    const msg = this.message();
    if (msg.trim().length === 0) {
      return;
    }
    this.chatService.sendMessage(this.chatSource(), msg);
    this.message.set('');
  }
}

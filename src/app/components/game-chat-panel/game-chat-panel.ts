import { Component, computed, effect, inject, signal } from '@angular/core';
import { ChatConversation } from '../chat-conversation/chat-conversation';
import { InputTextModule } from 'primeng/inputtext';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { ButtonModule } from 'primeng/button';
import { lucideSend } from '@ng-icons/lucide';
import { ChatMessageConversation, ChatService } from '../../services/chat-service/chat-service';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'primeng/tabs';
import { PlayerService } from '../../services/player-service/player-service';
import { IdentityService } from '../../services/identity-service/identity-service';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'app-game-chat-panel',
  imports: [
    ChatConversation,
    InputTextModule,
    NgIcon,
    ButtonModule,
    FormsModule,
    TabsModule,
    TextareaModule,
  ],
  templateUrl: './game-chat-panel.html',
  styleUrl: './game-chat-panel.css',
  viewProviders: [provideIcons({ lucideSend })],
})
export class GameChatPanel {
  private playerService = inject(PlayerService);
  identityService = inject(IdentityService);

  chatService = inject(ChatService);

  chatSources = computed(() => {
    const map = this.chatService.chatSources();
    const result: ChatMessageConversation[] = [];
    for (const conv of map.values()) {
      result.push(conv);
    }
    const identity = this.identityService.identity();
    result.sort((a, b) => {
      if (a.type === 'global' || (a.type === 'room' && b.type === 'private')) {
        return -1;
      } else if (b.type === 'global' || (b.type === 'room' && a.type === 'private')) {
        return 1;
      } else if (a.type === 'private' && b.type === 'private') {
        const aOpponentId = a.account_id1 === identity?.accountId ? a.account_id2 : a.account_id1;
        const bOpponentId = b.account_id1 === identity?.accountId ? b.account_id2 : b.account_id1;
        return aOpponentId.localeCompare(bOpponentId);
      } else if (a.type === 'room' && b.type === 'room') {
        return a.roomName.localeCompare(b.roomName);
      } else {
        return 0;
      }
    });
    return result.map((conv) => ({
      conv: conv,
      id: this.chatService.conversationId(conv),
    }));
  });

  private _loadChatHistoryEffect = effect(() => {
    const conv = this.chatSource();
    this.chatService.loadChatHistory(conv);
    console.log('Chat source changed, loading history for', conv);
  });

  chatSourceId = signal<string>('global');
  chatSource = computed<ChatMessageConversation>(() => {
    const id = this.chatSourceId();
    return this.chatService.chatSources().get(id) ?? { type: 'global' };
  });

  playerInfos = this.playerService.getComputedPlayerInfosByAccountId(() => {
    const ids = new Set<string>();
    const identity = this.identityService.identity();
    for (const conv of this.chatSources()) {
      if (conv.conv.type === 'private') {
        ids.add(conv.conv.account_id1);
        ids.add(conv.conv.account_id2);
      }
    }
    if (identity) {
      ids.delete(identity.accountId);
    }
    return Array.from(ids);
  });

  onValueChange(id: unknown) {
    if (typeof id !== 'string') {
      return;
    }
    this.chatSourceId.set(id);
  }

  textareaKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSendMessage();
    }
  }

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

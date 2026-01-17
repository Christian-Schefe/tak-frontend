import { Component, inject, signal } from '@angular/core';
import { ChatConversation } from '../chat-conversation/chat-conversation';
import { InputTextModule } from 'primeng/inputtext';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { ButtonModule } from 'primeng/button';
import { lucideSend } from '@ng-icons/lucide';
import { ChatService } from '../../services/chat-service/chat-service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-game-chat-panel',
  imports: [ChatConversation, InputTextModule, NgIcon, ButtonModule, FormsModule],
  templateUrl: './game-chat-panel.html',
  styleUrl: './game-chat-panel.css',
  viewProviders: [provideIcons({ lucideSend })],
})
export class GameChatPanel {
  chatSource = { type: 'global' } as const;

  chatService = inject(ChatService);

  message = signal<string>('');

  onSendMessage() {
    const msg = this.message();
    if (msg.trim().length === 0) {
      return;
    }
    this.chatService.sendMessage(this.chatSource, msg);
    this.message.set('');
  }
}

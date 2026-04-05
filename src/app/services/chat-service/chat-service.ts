import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { IdentityService } from '../identity-service/identity-service';
import z from 'zod';
import { WsService } from '../ws-service/ws-service';
import { GameService } from '../game-service/game-service';
import { PlayerService } from '../player-service/player-service';
import { HttpClient } from '@angular/common/http';

export type ChatMessage = z.infer<typeof wsChatMessage>;

export const chatMessageConversation = z.union([
  z.object({ type: z.literal('global') }),
  z.object({ type: z.literal('room'), roomName: z.string() }),
  z.object({ type: z.literal('private'), accountId1: z.string(), accountId2: z.string() }),
]);

export const wsChatMessage = z.object({
  messageId: z.number(),
  sender: z.string(),
  message: z.string(),
  conversation: chatMessageConversation,
  timestamp: z.number(),
});

export type ChatMessageConversation = z.infer<typeof chatMessageConversation>;

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  identityService = inject(IdentityService);
  wsService = inject(WsService);
  gameService = inject(GameService);
  playerService = inject(PlayerService);

  messageSignals = new Map<string, WritableSignal<ChatMessage[]>>();

  private readonly _chatMessageEffect = this.wsService.subscribeEffect(
    'chatMessage',
    wsChatMessage,
    (data) => {
      const messageSignal = this.getMessageSignal(data.conversation);
      messageSignal.update((messages) => [...messages, data]);
    },
  );

  getMessageSignal(conversation: ChatMessageConversation): WritableSignal<ChatMessage[]> {
    const id = this.conversationId(conversation);
    const messages = this.messageSignals.get(id);
    if (messages) {
      return messages;
    }
    const messageSignal = signal<ChatMessage[]>([]);
    this.messageSignals.set(id, messageSignal);
    return messageSignal;
  }

  sendMessage(conversation: ChatMessageConversation, message: string) {
    const identity = this.identityService.identity();
    if (!identity) {
      return;
    }
    this.wsService
      .sendMessage('chatMessage', {
        message,
        conversation,
      })
      .subscribe(() => {
        console.log('Message sent');
      });
  }

  conversationId(conversation: ChatMessageConversation): string {
    if (conversation.type === 'global') {
      return 'global';
    } else if (conversation.type === 'room') {
      return `room:${conversation.roomName}`;
    } else {
      const ids = [conversation.accountId1, conversation.accountId2].sort();
      return `private:${ids.join(':')}`;
    }
  }

  private httpClient = inject(HttpClient);

  loadChatHistory(conversation: ChatMessageConversation) {
    this.httpClient
      .get<ChatMessage[]>(`/api2/chat/${this.conversationId(conversation)}?limit=50`)
      .subscribe((newMessages) => {
        const messageSignal = this.getMessageSignal(conversation);
        messageSignal.update((messages) => {
          const updatedMessages = [...messages, ...newMessages];

          const uniqueMessages = Array.from(
            new Map(updatedMessages.map((msg) => [msg.messageId, msg])).values(),
          );
          const sortedMessages = uniqueMessages.sort((a, b) => {
            if (a.timestamp !== b.timestamp) {
              return a.timestamp - b.timestamp;
            }
            return a.messageId - b.messageId;
          });
          console.log('Loaded chat history for', conversation, sortedMessages);
          return sortedMessages;
        });
      });
  }
}

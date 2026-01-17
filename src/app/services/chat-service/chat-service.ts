import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { IdentityService } from '../identity-service/identity-service';

export interface ChatMessage {
  fromAccountId: string;
  message: string;
  timestamp: number;
}

export type ChatMessageSource =
  | { type: 'global' }
  | { type: 'room'; roomName: string }
  | { type: 'private'; fromAccountId: string };

const dummyMessages: ChatMessage[] = [
  { fromAccountId: 'user1', message: 'Hello everyone!', timestamp: Date.now() - 1000 * 60 * 5 },
  { fromAccountId: 'user2', message: 'Hi user1!', timestamp: Date.now() - 1000 * 60 * 5 + 2000 },
  { fromAccountId: 'user3', message: 'Good to see you all here.', timestamp: Date.now() },
];

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  identityService = inject(IdentityService);

  globalMessages = signal<ChatMessage[]>([...dummyMessages]);
  roomMessages = new Map<string, WritableSignal<ChatMessage[]>>();
  privateMessages = new Map<string, WritableSignal<ChatMessage[]>>();

  getMessageSignal(source: ChatMessageSource): WritableSignal<ChatMessage[]> {
    switch (source.type) {
      case 'global':
        return this.globalMessages;
      case 'room': {
        const roomMessages = this.roomMessages.get(source.roomName);
        if (roomMessages) {
          return roomMessages;
        }
        const roomSignal = signal<ChatMessage[]>([]);
        this.roomMessages.set(source.roomName, roomSignal);
        return roomSignal;
      }
      case 'private': {
        const privateMessages = this.privateMessages.get(source.fromAccountId);
        if (privateMessages) {
          return privateMessages;
        }
        const privateSignal = signal<ChatMessage[]>([]);
        this.privateMessages.set(source.fromAccountId, privateSignal);
        return privateSignal;
      }
    }
  }

  sendMessage(source: ChatMessageSource, message: string) {
    const identity = this.identityService.identity();
    if (!identity) {
      return;
    }
    const newMessage: ChatMessage = {
      fromAccountId: identity.accountId,
      message,
      timestamp: Date.now(),
    };
    const messageSignal = this.getMessageSignal(source);
    messageSignal.update((messages) => [...messages, newMessage]);
  }
}

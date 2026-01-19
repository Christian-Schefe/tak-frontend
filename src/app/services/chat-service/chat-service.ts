import { computed, inject, Injectable, signal, WritableSignal } from '@angular/core';
import { IdentityService } from '../identity-service/identity-service';
import z from 'zod';
import { WsService } from '../ws-service/ws-service';
import { GameService } from '../game-service/game-service';
import { PlayerService } from '../player-service/player-service';

export interface ChatMessage {
  fromAccountId: string;
  message: string;
  timestamp: number;
}

export const chatMessageTarget = z.union([
  z.object({ type: z.literal('global') }),
  z.object({ type: z.literal('room'), roomName: z.string() }),
  z.object({ type: z.literal('private'), toAccountId: z.string() }),
]);

export const wsChatMessage = z.object({
  fromAccountId: z.string(),
  message: z.string(),
  target: chatMessageTarget,
});

export type ChatMessageConversation =
  | { id: string; type: 'global' }
  | { id: string; type: 'room'; roomName: string }
  | { id: string; type: 'private'; toAccountId: string };

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  identityService = inject(IdentityService);
  wsService = inject(WsService);
  gameService = inject(GameService);
  playerService = inject(PlayerService);

  messageSignals = new Map<ChatMessageConversation['id'], WritableSignal<ChatMessage[]>>();

  opponentPlayerInfos = this.playerService.getComputedPlayerInfos(() => {
    const identity = this.identityService.identity();
    const opponents = new Set<string>();
    if (identity) {
      const thisPlayerGames = this.gameService.thisPlayerGames();
      for (const game of thisPlayerGames) {
        const opponentId =
          game.playerIds.white === identity.playerId ? game.playerIds.black : game.playerIds.white;
        opponents.add(opponentId);
      }
    }
    return Array.from(opponents);
  });

  chatSources = computed<Map<ChatMessageConversation['id'], ChatMessageConversation>>(() => {
    const opponents = Object.values(this.opponentPlayerInfos())
      .map((info) => (info.hasValue() ? info.value().accountId : ''))
      .filter((id) => id !== '');
    const convs: ChatMessageConversation[] = [{ id: 'global', type: 'global' }];
    for (const opponentId of opponents) {
      convs.push({
        id: `private:${opponentId}`,
        type: 'private',
        toAccountId: opponentId,
      });
    }
    const map = new Map<ChatMessageConversation['id'], ChatMessageConversation>();
    for (const conv of convs) {
      map.set(conv.id, conv);
    }
    return map;
  });

  private readonly _chatMessageEffect = this.wsService.subscribeEffect(
    'chatMessage',
    wsChatMessage,
    (data) => {
      const newMessage: ChatMessage = {
        fromAccountId: data.fromAccountId,
        message: data.message,
        timestamp: Date.now(),
      };
      let conversation: ChatMessageConversation;
      if (data.target.type === 'global') {
        conversation = { id: 'global', type: 'global' };
      } else if (data.target.type === 'room') {
        conversation = {
          id: `room:${data.target.roomName}`,
          type: 'room',
          roomName: data.target.roomName,
        };
      } else {
        const identity = this.identityService.identity();
        if (identity && data.target.toAccountId === identity.accountId) {
          conversation = {
            id: `private:${data.fromAccountId}`,
            type: 'private',
            toAccountId: data.fromAccountId,
          };
        } else {
          conversation = {
            id: `private:${data.target.toAccountId}`,
            type: 'private',
            toAccountId: data.target.toAccountId,
          };
        }
      }
      const messageSignal = this.getMessageSignal(conversation);
      messageSignal.update((messages) => [...messages, newMessage]);
    },
  );

  getMessageSignal(conversation: ChatMessageConversation): WritableSignal<ChatMessage[]> {
    const messages = this.messageSignals.get(conversation.id);
    if (messages) {
      return messages;
    }
    const messageSignal = signal<ChatMessage[]>([]);
    this.messageSignals.set(conversation.id, messageSignal);
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
        target:
          conversation.type === 'global'
            ? { type: 'global' }
            : conversation.type === 'room'
              ? { type: 'room', roomName: conversation.roomName }
              : { type: 'private', toAccountId: conversation.toAccountId },
      })
      .subscribe(() => {
        console.log('Message sent');
      });
  }
}

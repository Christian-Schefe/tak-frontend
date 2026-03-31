import { Component, computed, effect, inject, input, viewChild } from '@angular/core';
import { ChatMessageConversation, ChatService } from '../../services/chat-service/chat-service';
import { DatePipe } from '@angular/common';
import { ScrollPanel, ScrollPanelModule } from 'primeng/scrollpanel';
import { PlayerService } from '../../services/player-service/player-service';
import { MarkdownModule } from 'ngx-markdown';
import { differenceInCalendarDays } from 'date-fns';
import { markedEmoji } from 'marked-emoji';

interface Emote {
  code: string;
  name: string;
  url: string;
}

const emotes: Emote[] = [
  {
    code: 'road-toad',
    name: 'Road Toad',
    url: '/emotes/road_toad.png',
  },

  {
    code: 'flat-rat',
    name: 'Flat Rat',
    url: '/emotes/flat_rat.png',
  },
];

const emoteMap = new Map<string, Emote>(emotes.map((e) => [e.code, e]));

export function emoteExtension() {
  return markedEmoji({
    emojis: Object.fromEntries(emotes.map((e) => [e.code, e.code])),
    renderer: (token) => {
      console.log('Rendering emoji', token);
      const emote = emoteMap.get(token.emoji);
      if (!emote) {
        return token.emoji;
      }
      return `<img src="${emote.url}" alt="${emote.name}" class="inline h-8 w-8 mx-0.5 align-bottom pointer-events-none" />`;
    },
  });
}

@Component({
  selector: 'app-chat-conversation',
  imports: [DatePipe, ScrollPanelModule, MarkdownModule],
  templateUrl: './chat-conversation.html',
  styleUrl: './chat-conversation.css',
})
export class ChatConversation {
  private chatService = inject(ChatService);
  private playerService = inject(PlayerService);
  source = input.required<ChatMessageConversation>();

  scrollPanel = viewChild.required(ScrollPanel);

  playerInfos = this.playerService.getComputedPlayerInfosByAccountId(() => {
    const ids = new Set<string>();
    const messages = this.chatService.getMessageSignal(this.source())();
    for (const msg of messages) {
      ids.add(msg.sender);
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
      const showDate = !prev || areTimestampsDifferentDays(prev.timestamp, messages[i].timestamp);
      result.push({ msg: messages[i], showTimestamp, showDate });
    }
    return result;
  });

  private readonly _scrollEffect = effect(() => {
    this.messages();
    setTimeout(() => {
      this.scrollPanel().scrollTop(Infinity);
      console.log('Scrolled to bottom');
    });
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

function areTimestampsDifferentDays(t1: number, t2: number): boolean {
  const date1 = new Date(t1);
  const date2 = new Date(t2);
  return differenceInCalendarDays(date1, date2) !== 0;
}

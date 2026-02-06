import { Component, computed, inject, input } from '@angular/core';
import { ChatMessageConversation, ChatService } from '../../services/chat-service/chat-service';
import { DatePipe } from '@angular/common';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { PlayerService } from '../../services/player-service/player-service';

type TextToken =
  | {
      type: 'text';
      text: string;
    }
  | { type: 'emote'; emote: Emote };

interface Emote {
  code: string;
  name: string;
  url: string;
}
const EMOTE_RE = /:([a-z0-9_-]+):/gi;

function parseMessage(text: string, emotes: Map<string, Emote>): TextToken[] {
  const tokens: TextToken[] = [];
  let last = 0;

  for (const match of text.matchAll(EMOTE_RE)) {
    if (match.index > last) {
      tokens.push({ type: 'text', text: text.slice(last, match.index) });
    }

    const shortcode = `:${match[1]}:`;
    const emote = emotes.get(shortcode);

    if (emote) {
      tokens.push({ type: 'emote', emote: emote });
    } else {
      tokens.push({ type: 'text', text: shortcode });
    }

    last = match.index + shortcode.length;
  }

  if (last < text.length) {
    tokens.push({ type: 'text', text: text.slice(last) });
  }

  return tokens;
}

const emotes: Emote[] = [
  {
    code: ':road-toad:',
    name: 'Road Toad',
    url: '/emotes/road_toad.png',
  },

  {
    code: ':flat-rat:',
    name: 'Flat Rat',
    url: '/emotes/flat_rat.png',
  },
];

const emoteMap = new Map<string, Emote>(emotes.map((e) => [e.code, e]));

@Component({
  selector: 'app-chat-conversation',
  imports: [DatePipe, ScrollPanelModule],
  templateUrl: './chat-conversation.html',
  styleUrl: './chat-conversation.css',
})
export class ChatConversation {
  private chatService = inject(ChatService);
  private playerService = inject(PlayerService);
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
      const tokens = parseMessage(messages[i].message, emoteMap);
      result.push({ msg: messages[i], tokens, showTimestamp });
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

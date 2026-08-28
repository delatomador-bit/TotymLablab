import type { Clan, PlayerMode, TarotSuit, TargetType } from '../types/totym';

export const CLAN_LABELS: Record<Clan, string> = {
  berserkers: 'Berserkers',
  druids: 'Druids',
  bards: 'Bards',
  zealots: 'Zealots',
  mystics: 'Mystics',
};

export const CLAN_COLORS: Record<Clan, string> = {
  berserkers: '#e0533c',
  druids: '#3fae6b',
  bards: '#4f8fd9',
  zealots: '#d4a93a',
  mystics: '#9b6bd4',
};

export const SUIT_LABELS: Record<NonNullable<TarotSuit>, string> = {
  wands: 'Wands',
  cups: 'Cups',
  swords: 'Swords',
  pentacles: 'Pentacles',
};

export const TARGET_LABELS: Record<NonNullable<TargetType>, string> = {
  self: 'Self',
  opponent: 'Opponent',
  two_opponents: 'Two opponents',
  any: 'Any',
  all: 'All',
};

export const PLAYER_MODES: PlayerMode[] = ['1v1', '3-player', '4-player'];

export const PLAYER_MODE_LABELS: Record<PlayerMode, string> = {
  '1v1': '1v1',
  '3-player': '3-player',
  '4-player': '4-player',
};

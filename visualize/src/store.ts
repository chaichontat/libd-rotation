import { writable, type Writable } from 'svelte/store';

export type State = {
  showingType: string;

  locked: number;
  lockedCoords: { x: number; y: number };
  currIdx: number;
  currCoords: { x: number; y: number };
};

export const store: Writable<State> = writable({
  showingType: '',
  locked: -1,
  lockedCoords: { x: 0, y: 0 },
  currIdx: 0,
  currCoords: { x: 0, y: 0 }
});

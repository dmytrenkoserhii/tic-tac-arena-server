export type Move = {
  cell_index: number;
  game_id: string;
  id: string;
  mark: 'x' | 'o';
  move_number: number;
  player_id: string;
};

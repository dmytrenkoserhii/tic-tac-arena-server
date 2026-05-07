export type Game = {
  id: string;
  o_player_id: string;
  room_id: string;
  status: 'in_progress' | 'x_won' | 'o_won' | 'draw';
  winner_id: string | null;
  x_player_id: string;
};

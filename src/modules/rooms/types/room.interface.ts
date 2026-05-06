export type Room = {
  code: string
  guest_id: string | null
  host_id: string
  id: string
  status: 'waiting' | 'ready' | 'closed'
}

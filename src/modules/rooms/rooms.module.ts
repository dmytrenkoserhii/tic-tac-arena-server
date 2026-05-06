import { Module } from '@nestjs/common'

import { SupabaseModule } from '../../supabase/supabase.module'
import { RoomsController } from './controllers'
import { RoomsService } from './services'

@Module({
  controllers: [RoomsController],
  imports: [SupabaseModule],
  providers: [RoomsService],
})
export class RoomsModule {}

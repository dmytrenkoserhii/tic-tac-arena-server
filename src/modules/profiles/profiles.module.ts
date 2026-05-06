import { Module } from '@nestjs/common'

import { SupabaseModule } from '../../supabase/supabase.module'
import { ProfilesController } from './controllers'
import { ProfilesService } from './services'

@Module({
  controllers: [ProfilesController],
  imports: [SupabaseModule],
  providers: [ProfilesService],
})
export class ProfilesModule {}

import { Module } from '@nestjs/common';

import { SupabaseModule } from '../../supabase/supabase.module';
import { GamesController } from './controllers';
import { GamesService } from './services';

@Module({
  controllers: [GamesController],
  imports: [SupabaseModule],
  providers: [GamesService],
})
export class GamesModule {}

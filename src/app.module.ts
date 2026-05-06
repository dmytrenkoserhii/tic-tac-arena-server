import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { AppController } from './app.controller'
import { AppService } from './app.service'
import { GamesModule } from './modules/games/games.module'
import { RoomsModule } from './modules/rooms/rooms.module'
import { SupabaseModule } from './supabase/supabase.module'
import { appConfig } from './config/app.config'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    GamesModule,
    RoomsModule,
    SupabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Test, TestingModule } from '@nestjs/testing'

import { AppController } from './app.controller'
import { AppService } from './app.service'
import { SupabaseAuthGuard } from './auth/supabase-auth.guard'

describe('AppController', () => {
  let appController: AppController

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue({ canActivate: () => true })
      .compile()

    appController = app.get<AppController>(AppController)
  })

  describe('root', () => {
    it('should return the API name', () => {
      expect(appController.getHello()).toBe('Tic Tac Arena API')
    })
  })
})

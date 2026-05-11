import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Tic Tac Arena API';
  }

  getHealth() {
    return {
      service: 'tic-tac-arena-api',
      status: 'ok',
    };
  }

  getReady() {
    return {
      service: 'tic-tac-arena-api',
      status: 'ready',
    };
  }
}

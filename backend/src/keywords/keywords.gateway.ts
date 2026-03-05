import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { KeywordsService } from './keywords.service';

@WebSocketGateway({
  cors: { origin: true },
  path: '/ws-keywords',
})
export class KeywordsGateway implements OnGatewayInit {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly keywordsService: KeywordsService) {}

  afterInit() {
    // Gateway initialized
  }

  async broadcastKeywordsUpdate(): Promise<void> {
    const keywords = await this.keywordsService.getTopKeywords(5);
    this.server.emit('keywords:updated', { keywords });
  }
}


import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiAssistantController } from './ai-assistant.controller';
import { AiAssistantService } from './ai-assistant.service';
import { AiConversation } from './entities/ai-conversation.entity';
import { AiMessage } from './entities/ai-message.entity';
import { User } from '../users/entities/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([AiConversation, AiMessage, User])
    ],
    controllers: [AiAssistantController],
    providers: [AiAssistantService],
    exports: [AiAssistantService]
})
export class AiAssistantModule { }

import { Context, SessionFlavor } from 'grammy';
import { ConversationFlavor, Conversation } from '@grammyjs/conversations';

export interface SessionData {
    lastInteraction: number;
    tempRip?: string; // For passing data to conversation
    reportType?: 'positive' | 'negative'; // Type of report being created
}

export type MyContext = Context & SessionFlavor<SessionData> & ConversationFlavor<any>;
export type MyConversation = Conversation<MyContext>;

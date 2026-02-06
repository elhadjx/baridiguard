import dotenv from 'dotenv';

dotenv.config();

export const config = {
    botToken: process.env.BOT_TOKEN || '',
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/baridiguard',
    adminChannelId: process.env.ADMIN_CHANNEL_ID || '',
    adminTelegramId: process.env.ADMIN_TELEGRAM_ID ? Number(process.env.ADMIN_TELEGRAM_ID) : undefined,
    logLevel: process.env.LOG_LEVEL || 'info',
};

// Validate critical environment variables
if (!config.botToken) {
    throw new Error('❌ BOT_TOKEN is required in .env file');
}

import mongoose from 'mongoose';
import { setupBot } from './bot';
import { config } from './config';
import logger from './utils/logger';

async function main() {
    try {
        // 1. Connect to Database
        logger.info('Connecting to MongoDB...');
        await mongoose.connect(config.mongoUri);
        logger.info('✅ MongoDB connected.');

        // 2. Start Bot
        logger.info('Starting Telegram Bot...');
        const bot = await setupBot();

        // Start running
        bot.start({
            onStart: (botInfo) => {
                logger.info(`✅ Bot @${botInfo.username} is running.`);
            }
        });

        // Graceful Shutdown
        process.once('SIGINT', () => {
            logger.info('SIGINT received. Stopping bot...');
            bot.stop();
            mongoose.connection.close();
        });
        process.once('SIGTERM', () => {
            logger.info('SIGTERM received. Stopping bot...');
            bot.stop();
            mongoose.connection.close();
        });

    } catch (error) {
        logger.error('Failed to start application:', error);
        process.exit(1);
    }
}

main();

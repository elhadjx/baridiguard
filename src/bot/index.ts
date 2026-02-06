import { Bot, session } from 'grammy';
import { conversations, createConversation } from '@grammyjs/conversations';
import { MyContext, SessionData } from './context';
import { config } from '../config';
import { checkRipHandler } from './handlers/checkLogic';
import { reportConversation } from './handlers/reportLogic';
import { registrationConversation } from './handlers/registrationLogic';
import { helpCommand, profileCommand, statsCommand, myReportsCommand, aboutCommand } from './handlers/userCommands';
import logger from '../utils/logger';
import { Rip } from '../models/Rip';
import { Report } from '../models/Report';
import { User } from '../models/User';

export async function setupBot() {
    const bot = new Bot<MyContext>(config.botToken);

    // Middleware: Session
    bot.use(session({
        initial: (): SessionData => ({ lastInteraction: Date.now() }),
        getSessionKey: (ctx) => ctx.from?.id.toString()
    }));

    // Middleware: Conversations
    bot.use(conversations());
    bot.use(createConversation(reportConversation, "report"));
    bot.use(createConversation(registrationConversation, "registration"));

    // Middleware: Check Registration (except for /start)
    bot.use(async (ctx, next) => {
        // Allow /start command to pass through
        if (ctx.message?.text?.startsWith('/start')) {
            return next();
        }

        const telegramId = ctx.from?.id;
        if (!telegramId) {
            return next();
        }

        const user = await User.findOne({ telegramId });

        if (!user || !user.isRegistered) {
            await ctx.reply(
                "⚠️ **لازم تسجل أولاً!**\n\n" +
                "ابعث /start باش تسجل في البوت."
            );
            return; // Don't proceed
        }

        return next();
    });

    // Commands
    bot.command("start", async (ctx) => {
        const telegramId = ctx.from?.id;
        if (!telegramId) return;

        const user = await User.findOne({ telegramId });

        // If user is not registered, start registration flow
        if (!user || !user.isRegistered) {
            await ctx.conversation.enter("registration");
            return;
        }

        // If already registered, show welcome message
        const ripCount = await Rip.countDocuments();
        const reportCount = await Report.countDocuments();

        await ctx.reply(
            "🛡 **مرحباً بك في بريدي قارد (BaridiGuard)**\n\n" +
            "⚠️ **ملاحظة:** البوت حالياً في فترة تجريبية.\n\n" +
            "أنا بوت يعاونك باش تتحقق من مصداقية حسابات بريدي موب (RIP) وتبلغ على المحتالين.\n\n" +
            `📊 **إحصائيات المجتمع:**\n` +
            `• ${ripCount} رقم مراقب\n` +
            `• ${reportCount} بلاغ (Reports)\n\n` +
            "**كيفاش تستعمل البوت:**\n" +
            "\n🔍 `/check <RIP>`\n" +
            " أرسل رقم الـ RIP (20 رقم) باش تشوف إذا آمن ولا لا\n" +
            "\n\n🚨 `/report`\n" +
            " باش تبلغ على محتال أو تشكر بائع ثقة\n\n" +
            "\n\nحافظ على دراهمك وتأكد قبل ما تبعث! 🇩🇿\n\n",
            { parse_mode: "Markdown" }
        );
    });

    bot.command("check", checkRipHandler);

    // Handler for regex based checking (User sends just the number)
    bot.on("message:text", async (ctx, next) => {
        if (/^\d{20}$/.test(ctx.message.text)) {
            ctx.match = ctx.message.text;
            await checkRipHandler(ctx);
        } else {
            await next();
        }
    });

    bot.command("report", async (ctx) => {
        logger.info(`Entering report conversation for ${ctx.from?.id}`);
        // Clear previous session flags to trigger "What type?" question
        if (ctx.session) {
            ctx.session.reportType = undefined;
            ctx.session.tempRip = undefined;
        }
        await ctx.conversation.enter("report");
    });

    // User Commands
    bot.command("help", helpCommand);
    bot.command("profile", profileCommand);
    bot.command("stats", statsCommand);
    bot.command("myreports", myReportsCommand);
    bot.command("about", aboutCommand);

    // Callbacks
    bot.callbackQuery(/^report_start_(\d+)/, async (ctx) => {
        const ripMatches = ctx.callbackQuery.data.match(/^report_start_(\d+)/);
        if (ripMatches && ripMatches[1]) {
            logger.info(`Starting report via callback for RIP ${ripMatches[1]}`);
            if (ctx.session) {
                ctx.session.tempRip = ripMatches[1];
                ctx.session.reportType = 'negative'; // Pre-select NEGATIVE
            }
            await ctx.answerCallbackQuery();
            await ctx.conversation.enter("report");
        }
    });

    bot.callbackQuery(/^vouch_start_(\d+)/, async (ctx) => {
        const ripMatches = ctx.callbackQuery.data.match(/^vouch_start_(\d+)/);
        if (ripMatches && ripMatches[1]) {
            logger.info(`Starting vouch via callback for RIP ${ripMatches[1]}`);
            if (ctx.session) {
                ctx.session.tempRip = ripMatches[1];
                ctx.session.reportType = 'positive'; // Pre-select POSITIVE
            }
            await ctx.answerCallbackQuery();
            await ctx.conversation.enter("report");
        }
    });

    bot.callbackQuery(/^dispute_(\d+)/, async (ctx) => {
        await ctx.answerCallbackQuery({ text: "تواصل مع الدعم الفني لتقديم طعن (Dispute).", show_alert: true });
    });

    // Admin Callbacks
    bot.callbackQuery(/^admin_approve_(.+)/, async (ctx) => {
        // Check if user is admin
        if (ctx.from?.id !== config.adminTelegramId) {
            await ctx.answerCallbackQuery({ text: "❌ غير مصرح لك", show_alert: true });
            return;
        }

        const reportId = ctx.callbackQuery.data.split('_')[2];
        try {
            const report = await Report.findById(reportId);
            if (report) {
                report.status = 'published';
                await report.save();

                await ctx.editMessageText(
                    ctx.callbackQuery.message?.text + `\n\n✅ **تم القبول بواسطة ${ctx.from.first_name}**`,
                    { parse_mode: 'Markdown' }
                );
                await ctx.answerCallbackQuery({ text: "✅ تم قبول البلاغ", show_alert: true });
            }
        } catch (error) {
            logger.error('Error approving report:', error);
            await ctx.answerCallbackQuery({ text: "❌ خطأ في القبول", show_alert: true });
        }
    });

    bot.callbackQuery(/^admin_reject_(.+)/, async (ctx) => {
        // Check if user is admin
        if (ctx.from?.id !== config.adminTelegramId) {
            await ctx.answerCallbackQuery({ text: "❌ غير مصرح لك", show_alert: true });
            return;
        }

        const reportId = ctx.callbackQuery.data.split('_')[2];
        try {
            const report = await Report.findById(reportId);
            if (report) {
                report.status = 'rejected';
                await report.save();

                // Update reporter's rejected count
                await User.findOneAndUpdate(
                    { telegramId: report.reporterId },
                    { $inc: { reportsRejected: 1 } }
                );

                await ctx.editMessageText(
                    ctx.callbackQuery.message?.text + `\n\n❌ **تم الرفض بواسطة ${ctx.from.first_name}**`,
                    { parse_mode: 'Markdown' }
                );
                await ctx.answerCallbackQuery({ text: "❌ تم رفض البلاغ", show_alert: true });
            }
        } catch (error) {
            logger.error('Error rejecting report:', error);
            await ctx.answerCallbackQuery({ text: "❌ خطأ في الرفض", show_alert: true });
        }
    });

    bot.callbackQuery(/^admin_view_rip_(.+)/, async (ctx) => {
        // Check if user is admin
        if (ctx.from?.id !== config.adminTelegramId) {
            await ctx.answerCallbackQuery({ text: "❌ غير مصرح لك", show_alert: true });
            return;
        }

        const ripNumber = ctx.callbackQuery.data.replace('admin_view_rip_', '');
        ctx.match = ripNumber;
        await checkRipHandler(ctx);
        await ctx.answerCallbackQuery();
    });

    // RIP Owner Notification Callbacks
    bot.callbackQuery('view_my_profile', async (ctx) => {
        await ctx.answerCallbackQuery();
        await profileCommand(ctx);
    });

    bot.callbackQuery(/^check_(\d+)/, async (ctx) => {
        const ripMatches = ctx.callbackQuery.data.match(/^check_(\d+)/);
        if (ripMatches && ripMatches[1]) {
            ctx.match = ripMatches[1];
            await checkRipHandler(ctx);
            await ctx.answerCallbackQuery();
        }
    });

    // Error Handling
    bot.catch((err) => {
        logger.error(`Bot Error: ${err}`);
    });

    return bot;
}

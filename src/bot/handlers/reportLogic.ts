import { MyContext, MyConversation } from '../context';
import { Report } from '../../models/Report';
import { RiskEngine } from '../../services/RiskEngine';
import { InlineKeyboard } from 'grammy';

export async function reportConversation(conversation: MyConversation, ctx: MyContext) {
    const reporterId = ctx.from?.id;
    if (!reporterId) {
        await ctx.reply("خطأ: ما قدرتش نعرف شكون نتا.");
        return;
    }

    // Check: One report per day limit (rate limiting)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const hasRecentReport = await conversation.external(() => Report.exists({
        reporterId,
        timestamp: { $gte: twentyFourHoursAgo }
    }));

    if (hasRecentReport) {
        await ctx.reply("❌ تقدر تبلغ غير مرة وحدة في 24 ساعة. ولي غدوة.");
        return;
    }

    let rip = ctx.session?.tempRip;

    // Step 1: Get RIP if not set
    if (!rip) {
        await ctx.reply("أكتب رقم الـ RIP (20 رقم) لي حاب تبلغ عليه:");
        const ripMsg = await conversation.waitFor(":text");
        rip = ripMsg.message?.text || "";

        // Basic validation
        if (!/^\d{20}$/.test(rip)) {
            await ctx.reply("❌ غالط. الـ RIP لازم يكون فيه 20 رقم. عاود دير /report.");
            return;
        }
    }

    // Check: One report per RIP limit (ever)
    const hasExistingReport = await conversation.external(() => Report.exists({
        ripNumber: rip,
        reporterId
    }));

    if (hasExistingReport) {
        await ctx.reply(`❌ ديجا بلغت على الـ RIP (${rip}) من قبل. تقدر تبلغ غير مرة وحدة على كل حساب.`);
        return;
    }

    // Step 1.5: Determine Report Type (if not set by button)
    let reportType = ctx.session?.reportType;
    if (!reportType) {
        const typeKeyboard = new InlineKeyboard()
            .text("🚨 نبلغ على احتيال", "set_negative").row()
            .text("✅ نصح بيه (بائع ثقة)", "set_positive");

        await ctx.reply(`راك حاب تبلغ على مشكل ولا تشكر هاد السيد؟`, { reply_markup: typeKeyboard });

        const typeCtx = await conversation.waitForCallbackQuery(["set_negative", "set_positive"]);
        reportType = typeCtx.callbackQuery.data === "set_positive" ? "positive" : "negative";
        await typeCtx.answerCallbackQuery();
    }

    // Step 2: Category Selection based on Type
    let category = "";
    if (reportType === 'negative') {
        const categoryKeyboard = new InlineKeyboard()
            .text("📦 السلعة ما وصلتش", "product_not_received").row()
            .text("💱 احتيال عملات/بايسيرا", "crypto_scam").row()
            .text("🛠 الخدمة ما داروهاش", "service_not_delivered").row()
            .text("🎣 رابط احتيالي (Phishing)", "phishing").row()
            .text("آخر", "other");

        await ctx.reply(`⚠️ راك تبلغ على احتيال في الـ RIP: ${rip}\n\nخير السبب:`, { reply_markup: categoryKeyboard });
        const categoryCtx = await conversation.waitForCallbackQuery([
            "product_not_received", "crypto_scam", "service_not_delivered", "phishing", "other"
        ]);
        category = categoryCtx.callbackQuery.data;
        await categoryCtx.answerCallbackQuery();

    } else {
        // Positive Flow
        const categoryKeyboard = new InlineKeyboard()
            .text("⚡ خدمة سريعة", "fast_service").row()
            .text("🤝 تاجر ثقة", "honest_trader").row()
            .text("✅ مليح (عام)", "positive_other");

        await ctx.reply(`✅ راك تنصح بالـ RIP: ${rip}\n\nخير السبب:`, { reply_markup: categoryKeyboard });
        const categoryCtx = await conversation.waitForCallbackQuery([
            "fast_service", "honest_trader", "positive_other"
        ]);
        category = categoryCtx.callbackQuery.data;
        await categoryCtx.answerCallbackQuery();
    }

    await ctx.reply(`صح، خيرت: ${category}`);

    // Step 3: Description
    await ctx.reply("احكيلي واش صرا في 2-3 جمل (لازم):");
    const descCtx = await conversation.waitFor(":text");
    const description = descCtx.message?.text || "";

    // Step 4: Evidence
    const skipKeyboard = new InlineKeyboard().text("سي بون (كملت)", "skip");
    await ctx.reply("📸 (اختياري) ابعثلي صور الأدلة (سكرين شوت). ابعث شحال من حبة، ومبعد عبز 'سي بون'.", { reply_markup: skipKeyboard });

    const fileIds: string[] = [];

    while (true) {
        const evidenceCtx = await conversation.waitFor([":photo", "callback_query:data"]);

        if (evidenceCtx.callbackQuery?.data === "skip") {
            await evidenceCtx.answerCallbackQuery();
            break;
        } else if (evidenceCtx.message?.photo) {
            // Get the largest photo
            const fileId = evidenceCtx.message.photo[evidenceCtx.message.photo.length - 1].file_id;
            fileIds.push(fileId);
            await ctx.reply(`✅ وصلتني الصورة #${fileIds.length}. زيد ابعث ولا كليكي سي بون.`);
        }
    }

    // Save to DB
    await ctx.reply("⏳ راني نسجل فالبلاغ...");

    // Get Credibility
    const weight = await conversation.external(() => RiskEngine.getUserCredibility(reporterId));

    let savedReport: any = null;

    await conversation.external(async () => {
        // @ts-ignore
        const report = new Report({
            ripNumber: rip,
            reporterId: reporterId,
            category,
            description,
            evidence: {
                hasEvidence: fileIds.length > 0,
                fileIds: fileIds
            },
            weight: weight,
            status: 'published'
        });
        const savedReportDoc = await report.save();
        savedReport = savedReportDoc.toObject();

        // Trigger Risk Recalculation
        await RiskEngine.calculateRiskScore(rip!);
    });

    await ctx.reply(
        `✅ **سي بون! البلاغ تاعك تسجل.**\n` +
        `يعطيك الصحة كي راك تعاون فالمجتمع.\n` +
        `رقم الـ RIP: ${rip}`
    );

    // Notify admin and RIP owner (blocking in code, but user already got the reply)
    if (savedReport) {
        try {
            // We await external to ensure grammY can track the state correctly
            await conversation.external(async () => {
                const { AdminNotificationService } = await import('../../services/AdminNotificationService');
                const { RipOwnerNotificationService } = await import('../../services/RipOwnerNotificationService');

                const api = ctx.api as any;

                // 1. Notify Admin
                await AdminNotificationService.notifyAdminOfNewReport(api, savedReport);

                // 2. Notify RIP Owner
                const reporterName = ctx.from?.first_name || ctx.from?.username;
                await RipOwnerNotificationService.notifyRipOwner(api, savedReport, reporterName);
            });
        } catch (error) {
            console.error('Failed to send notifications:', error);
        }
    }

    // Clear session
    if (ctx.session) {
        ctx.session.tempRip = undefined;
        ctx.session.reportType = undefined;
    }
}

import { MyContext, MyConversation } from '../context';
import { User } from '../../models/User';
import { Keyboard } from 'grammy';
import { Rip } from '../../models/Rip';
import { Report } from '../../models/Report';

export async function registrationConversation(conversation: MyConversation, ctx: MyContext) {
    const telegramId = ctx.from?.id;

    if (!telegramId) {
        await ctx.reply("خطأ: ما قدرتش نعرف شكون نتا.");
        return;
    }

    // Step 1: Request Phone Number
    const phoneKeyboard = new Keyboard().requestContact("📱 شارك رقمك").resized();

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
        "\n\nحافظ على دراهمك وتأكد قبل ما تبعث! 🇩🇿\n\n" +
        "\n\n" +
        "🔐 **التسجيل في بريدي قارد (BaridiGuard)**\n\n" +
        "⚠️ **ملاحظة:** البوت حالياً في فترة تجريبية.\n\n" +
                "باش تستعمل البوت، لازم تشارك:\n\n" +
        "1️⃣ رقم الهاتف تاعك\n\n" +
        "هذا باش نتأكدو من مصداقية المجتمع ونحاربو النصب.\n\n" +
        "**👇 ابعث رقمك بالزر لي تحت:**",
        { reply_markup: phoneKeyboard }
    );

    const phoneCtx = await conversation.wait();

    let phoneNumber: string | undefined;

    if (phoneCtx.message?.contact) {
        phoneNumber = phoneCtx.message.contact.phone_number;
        await ctx.reply(`✅ رقمك: ${phoneNumber}`);
    } else {
        await ctx.reply("❌ لازم تبعث رقمك باستعمال الزر.");
        return;
    }

    // Step 2: Confirmation
    await conversation.external(async () => {
        await User.findOneAndUpdate(
            { telegramId },
            {
                phoneNumber,
                isRegistered: true,
                username: ctx.from?.username,
                firstName: ctx.from?.first_name
            },
            { upsert: true, new: true }
        );
    });

    await ctx.reply(
        "✅ **التسجيل تم بنجاح! 🎉**\n\n" +
        `رقمك: ${phoneNumber}\n\n` +
        "الآن تقدر تستعمل البوت:\n" +
        "🔍 `/check <RIP>` - ابعث حساب باش تشوف إذا آمن\n" +
        "🚨 `/report` - باش تبلغ أو تنصح",
        { reply_markup: { remove_keyboard: true } }
    );
}

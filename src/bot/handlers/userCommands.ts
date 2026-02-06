import { MyContext } from '../context';
import { User } from '../../models/User';
import { Report } from '../../models/Report';
import { Rip } from '../../models/Rip';

/**
 * /help command - Shows available bot commands
 */
export async function helpCommand(ctx: MyContext) {
    const helpMessage = `
🤖 **بريدي قارد - دليل الاستخدام**

**🔍 التحقق من RIP:**
• \`/check <RIP>\` - تحقق من رقم RIP (20 رقم)
• أو ابعث الرقم مباشرة (20 رقم)

**🚨 التبليغ:**
• \`/report\` - بلغ على احتيال أو نصح ببائع

**📊 معلوماتك:**
• \`/profile\` - شوف معلومات حسابك
• \`/stats\` - شوف إحصائياتك
• \`/myreports\` - شوف بلاغاتك

**ℹ️ معلومات:**
• \`/about\` - عن بريدي قارد
• \`/help\` - دليل الاستخدام

**📞 الدعم:**
إذا حبيت تتواصل معانا: @elhadjx

حافظ على دراهمك وتأكد قبل ما تبعث! 🇩🇿
`;

    await ctx.reply(helpMessage, { parse_mode: 'Markdown' });
}

/**
 * /profile command - Shows user profile and trust score
 */
export async function profileCommand(ctx: MyContext) {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const user = await User.findOne({ telegramId });

    if (!user) {
        await ctx.reply('⚠️ ما لقيناش حسابك. ابعث /start باش تسجل.');
        return;
    }

    // Calculate account age
    const accountAge = Math.floor((Date.now() - user.joinedAt.getTime()) / (1000 * 60 * 60 * 24));

    // Get trust score emoji
    const getTrustEmoji = (score: number) => {
        if (score >= 0.9) return '⭐⭐⭐';
        if (score >= 0.7) return '⭐⭐';
        if (score >= 0.5) return '⭐';
        return '🚨';
    };

    const profileMessage = `
👤 **ملفك الشخصي**

**📱 المعلومات:**
• **الاسم:** ${user.firstName || 'غير محدد'}
• **اسم المستخدم:** @${user.username || 'لا يوجد'}
• **رقم الهاتف:** ${user.phoneNumber ? `${user.phoneNumber.slice(0, 6)}****` : 'غير محدد'}
• **RIP تاعك:** ${user.userRipNumber ? `${user.userRipNumber.slice(0, 8)}...` : 'غير محدد'}

**⚖️ درجة الثقة:**
${getTrustEmoji(user.trustScore)} **${(user.trustScore * 100).toFixed(0)}%**

**📊 الإحصائيات:**
• ${user.reportsSubmitted} بلاغ قدمته
• ${user.reportsRejected} بلاغ مرفوض
• ${accountAge} يوم في المجتمع

**💡 نصيحة:**
كل ما تقدم بلاغات صحيحة وموثوقة، درجة ثقتك تزيد!
`;

    await ctx.reply(profileMessage, { parse_mode: 'Markdown' });
}

/**
 * /stats command - Shows user statistics
 */
export async function statsCommand(ctx: MyContext) {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    // Get overall stats
    const totalUsers = await User.countDocuments({ isRegistered: true });
    const totalRips = await Rip.countDocuments();
    const totalReports = await Report.countDocuments();
    const userReports = await Report.countDocuments({ reporterId: telegramId });

    // Get recent activity
    const recentReports = await Report.find({ reporterId: telegramId })
        .sort({ timestamp: -1 })
        .limit(5);

    // Count positive vs negative
    const positiveCategories = ['fast_service', 'honest_trader', 'positive_other'];
    const positiveCount = await Report.countDocuments({
        reporterId: telegramId,
        category: { $in: positiveCategories }
    });
    const negativeCount = userReports - positiveCount;

    const statsMessage = `
📊 **الإحصائيات**

**🌐 إحصائيات عامة:**
• ${totalUsers} مستخدم مسجل
• ${totalRips} RIP مراقب
• ${totalReports} بلاغ إجمالي

**👤 إحصائياتك:**
• ${userReports} بلاغ قدمته
• 🚨 ${negativeCount} بلاغ سلبي
• ✅ ${positiveCount} تنصيح

${recentReports.length > 0 ? `\n**📝 آخر نشاطاتك:**\n${recentReports.map((r, i) =>
        `${i + 1}. ${r.category} - ${r.timestamp.toLocaleDateString('ar-DZ')}`
    ).join('\n')}` : ''}

كمل البلاغات باش تساعد المجتمع! 💪
`;

    await ctx.reply(statsMessage, { parse_mode: 'Markdown' });
}

/**
 * /myreports command - Lists user's submitted reports
 */
export async function myReportsCommand(ctx: MyContext) {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const reports = await Report.find({ reporterId: telegramId })
        .sort({ timestamp: -1 })
        .limit(10);

    if (reports.length === 0) {
        await ctx.reply(
            '📭 **ما عندك بلاغات باقي**\n\n' +
            'ابعث /report باش تبلغ على محتال أو تنصح ببائع ثقة!'
        );
        return;
    }

    const categoryLabels: { [key: string]: string } = {
        'product_not_received': '📦 السلعة ما وصلتش',
        'crypto_scam': '💱 احتيال عملات',
        'service_not_delivered': '🛠 الخدمة ما داروهاش',
        'phishing': '🎣 رابط احتيالي',
        'fast_service': '⚡ خدمة سريعة',
        'honest_trader': '🤝 تاجر ثقة',
        'positive_other': '✅ مليح (عام)',
        'other': 'آخر'
    };

    const statusLabels: { [key: string]: string } = {
        'pending_review': '⏳ قيد المراجعة',
        'published': '✅ منشور',
        'rejected': '❌ مرفوض'
    };

    let message = `📋 **بلاغاتك (آخر 10)**\n\n`;

    reports.forEach((report, index) => {
        const isPositive = ['fast_service', 'honest_trader', 'positive_other'].includes(report.category);
        const emoji = isPositive ? '✅' : '🚨';

        message += `${index + 1}. ${emoji} **${categoryLabels[report.category]}**\n`;
        message += `   RIP: \`${report.ripNumber}\`\n`;
        message += `   ${statusLabels[report.status]} | ${report.timestamp.toLocaleDateString('ar-DZ')}\n\n`;
    });

    message += `\nابعث /report باش تزيد بلاغ جديد`;

    await ctx.reply(message, { parse_mode: 'Markdown' });
}

/**
 * /about command - About BaridiGuard
 */
export async function aboutCommand(ctx: MyContext) {
    const aboutMessage = `
🛡 **عن بريدي قارد (BaridiGuard)**

⚠️ **ملاحظة:** البوت حالياً في فترة تجريبية.

بريدي قارد هو بوت جزائري مجاني يساعدك على:

✅ **التحقق من مصداقية حسابات بريدي موب**
قبل ما تفيرسي فلوسك، تحقق من الـ RIP

🚨 **التبليغ على المحتالين**
ساعد المجتمع وبلغ على المحتالين

🤝 **التنصيح بالبائعين الثقة**
إذا تعاملت مع بائع مليح، نصح بيه!

**🔒 الخصوصية:**
معلوماتك محفوظة ومشفرة. نستخدم برك:
• رقم تيليجرام
• رقم الهاتف (للتحقق)
• رقم RIP تاعك

**🎯 هدفنا:**
حماية الجزائريين من النصب والاحتيال في التعاملات الإلكترونية.

**📞 تواصل معانا:**
@elhadjx

صنع بـ ❤️ في الجزائر 🇩🇿
`;

    await ctx.reply(aboutMessage, { parse_mode: 'Markdown' });
}

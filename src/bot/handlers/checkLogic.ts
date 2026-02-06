import { MyContext } from '../context';
import { Rip } from '../../models/Rip';

export async function checkRipHandler(ctx: MyContext) {
    const text = ctx.match as string; // /check <RIP>

    if (!text) {
        return ctx.reply("لازم تكتب رقم الـ RIP. مثال: `\n/check 00799999000000000000`", { parse_mode: "Markdown" });
    }

    // Basic regex validation for Algerian RIP (20 digits)
    const ripRegex = /^\d{20}$/;
    if (!ripRegex.test(text)) {
        return ctx.reply("⚠️ خطأ. الـ RIP لازم يكون فيه 20 رقم (بريدي موب).");
    }

    const rip = await Rip.findOne({ ripNumber: text });

    if (!rip || rip.reportCount === 0) {
        return ctx.reply(
            `🟢 **ماكان حتى بلاغ على هذا الـ RIP: ${text}**\n\n` +
            `هذا الـ RIP نظيف عندنا، بالاك ما بلغ عليه حتى واحد. ديما رد بالك.\n\n` +
            `بريدي قارد يجمع بلاغات الناس برك، ما نتحققوش من الهوية.`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "🚨 بلغ على هذا الـ RIP", callback_data: `report_start_${text}` }],
                        [{ text: "✅ بائع موثوق (نصح بيه)", callback_data: `vouch_start_${text}` }]
                    ]
                }
            }
        );
    }

    // Risk Levels
    if (rip.riskScore < 11) {
        // Low Risk
        return ctx.reply(
            `🟢 آمن (خطر منخفض: ${rip.riskScore})\n` +
            `RIP: ${text}\n` +
            `البلاغات: ${rip.reportCount}\n\n` +
            `كاين بلاغ صغير ولا قديم. نورمالمون لاباس.`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "🚨 زيد بلاغ", callback_data: `report_start_${text}` }],
                        [{ text: "✅ بائع موثوق (نصح بيه)", callback_data: `vouch_start_${text}` }]
                    ]
                }
            }
        );
    } else if (rip.riskScore < 41) {
        // Moderate
        return ctx.reply(
            `🟡 رد بالك (خطر متوسط)\n` +
            `RIP: ${text}\n\n` +
            `🔴 نقاط الخطر: ${rip.riskScore}/100\n` +
            `⚠️ البلاغات: ${rip.reportCount}\n` +
            `🏷 السبب: ${rip.tags.join(', ')}\n\n` +
            `ثبت روحك قبل ما تفيرسي.`,
            {
                reply_markup: {
                    inline_keyboard: [[{ text: "🚨 زيد بلاغ", callback_data: `report_start_${text}` }]]
                }
            }
        );
    } else {
        // High Risk
        return ctx.reply(
            `🔴 خطر (خطر عالي!)\n` +
            `RIP: ${text}\n\n` +
            `💀 نقاط الخطر: ${rip.riskScore}/100\n` +
            `⚠️ البلاغات: ${rip.reportCount} (معروف محتال)\n` +
            `🏷 السبب: ${rip.tags.join(', ')}\n\n` +
            `⛔ بالاك تفيرسي دراهم لهذا الـ RIP.\n\n` +
            `إذا نتا مول هذا الحساب، تقدر تقدم طعن (Dispute).`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "🚨 زيد بلاغ", callback_data: `report_start_${text}` }],
                        [{ text: "ℹ️ أنا مول الحساب", callback_data: `dispute_${text}` }]
                    ]
                }
            }
        );
    }
}

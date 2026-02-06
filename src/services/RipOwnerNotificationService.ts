import { Api } from 'grammy';
import logger from '../utils/logger';
import { User } from '../models/User';
import { IReport } from '../models/Report';
import { Rip } from '../models/Rip';

export class RipOwnerNotificationService {
    /**
     * Notifies the owner of a RIP when someone reports it
     */
    static async notifyRipOwner(api: Api, report: IReport, reporterName?: string) {
        try {
            // Find the user who owns this RIP
            const ripOwner = await User.findOne({ userRipNumber: report.ripNumber });

            if (!ripOwner || !ripOwner.telegramId) {
                logger.info(`No owner found for RIP ${report.ripNumber}, skipping notification`);
                return;
            }

            // Don't notify if the reporter is the owner themselves
            if (ripOwner.telegramId === report.reporterId) {
                logger.info(`Reporter is the RIP owner, skipping self-notification`);
                return;
            }

            const isPositive = ['fast_service', 'honest_trader', 'positive_other'].includes(report.category);

            const categoryLabels: { [key: string]: string } = {
                'product_not_received': '📦 السلعة ما وصلتش',
                'crypto_scam': '💱 احتيال عملات/بايسيرا',
                'service_not_delivered': '🛠 الخدمة ما داروهاش',
                'phishing': '🎣 رابط احتيالي',
                'fast_service': '⚡ خدمة سريعة',
                'honest_trader': '🤝 تاجر ثقة',
                'positive_other': '✅ مليح (عام)',
                'other': 'آخر'
            };

            let message = '';

            if (isPositive) {
                // Positive report notification
                message = `🎉 **مبروك! واحد نصح بيك!**\n\n`;
                message += `✅ واحد ينصح بحساب الـ RIP تاعك كتاجر موثوق!\n\n`;
                message += `📋 **التفاصيل:**\n`;
                message += `🏷 السبب: ${categoryLabels[report.category]}\n`;
                message += `💬 التعليق: "${report.description}"\n`;
                if (reporterName) {
                    message += `👤 المستخدم: ${reporterName}\n`;
                }
                message += `\n✨ هذا راح يحسن ريبوتيشن تاعك في المجتمع!\n`;
                message += `شوف التفاصيل الكاملة: /profile`;
            } else {
                // Negative report notification
                message = `⚠️ **تنبيه: بلاغ جديد على حسابك**\n\n`;
                message += `🚨 واحد بلغ على حساب الـ RIP تاعك.\n\n`;
                message += `📋 **التفاصيل:**\n`;
                message += `🏷 السبب: ${categoryLabels[report.category]}\n`;
                message += `💬 التعليق: "${report.description}"\n`;
                if (reporterName) {
                    message += `👤 المستخدم: ${reporterName}\n`;
                }
                message += `\n⚠️ **إذا كنت ما درتيش:**\n`;
                message += `• هذا البلاغ راح يأثر على نقاط الخطر تاع حسابك\n`;
                message += `• إذا البلاغ غالط، تقدر تتواصل مع @elhadjx للطعن\n`;
                message += `• شوف التفاصيل الكاملة: /check ${report.ripNumber}`;
            }

            // Get current RIP stats
            const ripData = await Rip.findOne({ ripNumber: report.ripNumber });
            if (ripData) {
                message += `\n\n📊 **إحصائيات حسابك:**\n`;
                message += `• نقاط الخطر: ${ripData.riskScore}/100\n`;
                message += `• عدد البلاغات: ${ripData.reportCount}`;
            }

            // Send notification to RIP owner
            await api.sendMessage(ripOwner.telegramId, message, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '📊 شوف ملفك', callback_data: 'view_my_profile' },
                            { text: `🔍 شوف الـ RIP`, callback_data: `check_${report.ripNumber}` }
                        ]
                    ]
                }
            });

            logger.info(`Notified RIP owner ${ripOwner.telegramId} of new report on their RIP ${report.ripNumber}`);

        } catch (error) {
            logger.error('Error notifying RIP owner:', error);
        }
    }

    /**
     * Send summary notification to RIP owner about their reputation
     */
    static async sendReputationSummary(api: Api, telegramId: number) {
        try {
            const user = await User.findOne({ telegramId });
            if (!user || !user.userRipNumber) {
                return;
            }

            const ripData = await Rip.findOne({ ripNumber: user.userRipNumber });
            if (!ripData) {
                return;
            }

            const message = `
📊 **ملخص سمعتك**

🔢 **حسابك:** \`${user.userRipNumber}\`

**📈 الإحصائيات:**
• نقاط الخطر: ${ripData.riskScore}/100
• عدد البلاغات: ${ripData.reportCount || 0}
• الحالة: ${this.getStatusLabel(ripData.status)}

${ripData.tags?.length > 0 ? `🏷 **الأوسمة:** ${ripData.tags.join(', ')}` : ''}

حافظ على سمعة مليحة بالتعامل الصادق! 💪
`;

            await api.sendMessage(telegramId, message, {
                parse_mode: 'Markdown'
            });

        } catch (error) {
            logger.error('Error sending reputation summary:', error);
        }
    }

    private static getStatusLabel(status: string): string {
        const labels: { [key: string]: string } = {
            'active': '🟢 نشط',
            'under_review': '🟡 قيد المراجعة',
            'dispute_in_progress': '⚖️ طعن جاري',
            'trusted_merchant': '⭐ تاجر موثوق'
        };
        return labels[status] || status;
    }
}

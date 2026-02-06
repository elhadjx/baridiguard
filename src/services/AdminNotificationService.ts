import { Api } from 'grammy';
import { config } from '../config';
import logger from '../utils/logger';
import { IReport } from '../models/Report';
import { User } from '../models/User';

export class AdminNotificationService {
    /**
     * Forwards a new report to the admin for review
     */
    static async notifyAdminOfNewReport(api: Api, report: IReport) {
        if (!config.adminTelegramId) {
            logger.warn('Admin Telegram ID not configured, skipping notification');
            return;
        }

        try {
            // Get reporter info
            const reporter = await User.findOne({ telegramId: report.reporterId });

            const reportType = ['fast_service', 'honest_trader', 'positive_other'].includes(report.category)
                ? '✅ تنصيح (Positive)'
                : '🚨 بلاغ احتيال (Negative)';

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

            let message = `🔔 **بلاغ جديد وصل**\n\n`;
            message += `📋 **نوع البلاغ:** ${reportType}\n`;
            message += `🏷 **الفئة:** ${categoryLabels[report.category] || report.category}\n`;
            message += `🔢 **RIP المبلغ عنه:** \`${report.ripNumber}\`\n`;
            message += `👤 **المبلغ:** ${reporter?.firstName || 'Unknown'} (@${reporter?.username || 'no_username'})\n`;
            message += `📱 **Telegram ID:** \`${report.reporterId}\`\n`;
            message += `⚖️ **وزن المبلغ:** ${report.weight.toFixed(2)}\n`;
            message += `📅 **التاريخ:** ${report.timestamp.toLocaleString('ar-DZ')}\n\n`;
            message += `📝 **الوصف:**\n${report.description}\n\n`;
            message += `📸 **الأدلة:** ${report.evidence.hasEvidence ? `${report.evidence.fileIds.length} صور` : 'لا يوجد'}\n`;
            message += `🔖 **الحالة:** ${report.status}`;

            // Send main notification
            await api.sendMessage(config.adminTelegramId, message, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '✅ قبول', callback_data: `admin_approve_${report._id}` },
                            { text: '❌ رفض', callback_data: `admin_reject_${report._id}` }
                        ],
                        [
                            { text: '🔍 عرض RIP', callback_data: `admin_view_rip_${report.ripNumber}` }
                        ]
                    ]
                }
            });

            // Send evidence photos if available
            if (report.evidence.hasEvidence && report.evidence.fileIds.length > 0) {
                for (const fileId of report.evidence.fileIds) {
                    try {
                        await api.sendPhoto(config.adminTelegramId, fileId, {
                            caption: `🖼 دليل للبلاغ: ${report._id}`
                        });
                    } catch (photoError) {
                        logger.error('Error sending evidence photo to admin:', photoError);
                    }
                }
            }

            logger.info(`Notified admin of new report: ${report._id}`);
        } catch (error) {
            logger.error('Error notifying admin:', error);
        }
    }

    /**
     * Notify admin of suspicious activity
     */
    static async notifySuspiciousActivity(api: Api, message: string) {
        if (!config.adminTelegramId) {
            return;
        }

        try {
            await api.sendMessage(config.adminTelegramId, `⚠️ **نشاط مشبوه**\n\n${message}`, {
                parse_mode: 'Markdown'
            });
        } catch (error) {
            logger.error('Error notifying admin of suspicious activity:', error);
        }
    }
}

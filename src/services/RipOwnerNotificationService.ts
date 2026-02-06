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
        // Feature disabled: RIP numbers are no longer linked to users
        return;
    }

    /**
     * Send summary notification to RIP owner about their reputation
     */
    static async sendReputationSummary(api: Api, telegramId: number) {
        // Feature disabled: RIP numbers are no longer linked to users
        return;
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

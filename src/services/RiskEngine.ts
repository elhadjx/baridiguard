import { Rip } from '../models/Rip';
import { Report } from '../models/Report';
import { User } from '../models/User';
import logger from '../utils/logger';

export class RiskEngine {

    /**
     * Recalculates the risk score for a specific RIP number based on all active reports.
     * Logic: Score = min(100, sum(report.weight * time_decay))
     */
    static async calculateRiskScore(ripNumber: string): Promise<void> {
        try {
            const reports = await Report.find({ ripNumber, status: 'published' });

            let totalScore = 0;
            const categories: { [key: string]: number } = {};
            const uniqueReporters = new Set<number>();

            const now = new Date();

            for (const report of reports) {
                // 1. Time Decay: Reports lose 50% validity every 6 months (approx 180 days)
                const daysOld = (now.getTime() - report.timestamp.getTime()) / (1000 * 3600 * 24);
                const decayFactor = Math.pow(0.5, daysOld / 180);

                // 2. Base weight is 10 per report, adjusted by reporter credibility (weight)
                // report.weight comes from the reporter's trust at the time of reporting
                const reportValue = 10 * report.weight * decayFactor;

                if (['fast_service', 'honest_trader', 'positive_other'].includes(report.category)) {
                    // Positive reports REDUCE risk
                    totalScore -= (reportValue * 2);
                } else {
                    totalScore += reportValue;
                }

                // Count categories
                categories[report.category] = (categories[report.category] || 0) + 1;
                uniqueReporters.add(report.reporterId);
            }

            // Cap at 100, floor at 0
            const finalScore = Math.max(0, Math.min(100, Math.round(totalScore)));

            // Determine Top Tags
            const sortedTags = Object.entries(categories)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([key]) => key);

            // Updates
            await Rip.findOneAndUpdate(
                { ripNumber },
                {
                    riskScore: finalScore,
                    reportCount: uniqueReporters.size, // Unique reporters count as report count mostly
                    tags: sortedTags,
                    lastReportedAt: reports.length > 0 ? reports[reports.length - 1].timestamp : undefined
                },
                { upsert: true, new: true }
            );

            logger.info(`Updated risk score for ${ripNumber}: ${finalScore}`);

        } catch (error) {
            logger.error('Error calculating risk score:', error);
        }
    }

    /**
     * Gets the credibility weight for a user.
     */
    static async getUserCredibility(telegramId: number): Promise<number> {
        const user = await User.findOne({ telegramId });
        if (!user) return 0.5; // Default for unknown/new execution flow, though user should exist

        // Logic: 
        // New User (< 24h): 0.5
        // Reliable User: trustScore
        return user.trustScore;
    }
}

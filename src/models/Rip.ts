import mongoose, { Schema, Document } from 'mongoose';

export interface IRip extends Document {
    ripNumber: string;
    riskScore: number; // 0-100
    status: 'active' | 'under_review' | 'dispute_in_progress' | 'trusted_merchant';
    lastReportedAt: Date;
    reportCount: number;
    tags: string[];
    meta: {
        ownerClaimed: boolean;
        verifiedMerchant: boolean;
    };
}

const RipSchema: Schema = new Schema({
    ripNumber: { type: String, required: true, unique: true },
    riskScore: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['active', 'under_review', 'dispute_in_progress', 'trusted_merchant'],
        default: 'active'
    },
    lastReportedAt: { type: Date },
    reportCount: { type: Number, default: 0 },
    tags: [{ type: String }],
    meta: {
        ownerClaimed: { type: Boolean, default: false },
        verifiedMerchant: { type: Boolean, default: false },
    }
});

export const Rip = mongoose.model<IRip>('Rip', RipSchema);

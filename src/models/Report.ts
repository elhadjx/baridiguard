import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
    ripNumber: string;
    reporterId: number;
    category: 'product_not_received' | 'crypto_scam' | 'service_not_delivered' | 'phishing' | 'fast_service' | 'honest_trader' | 'positive_other' | 'other';
    description: string;
    evidence: {
        hasEvidence: boolean;
        fileIds: string[];
        hash?: string;
    };
    weight: number;
    timestamp: Date;
    status: 'pending_review' | 'published' | 'rejected';
}

const ReportSchema: Schema = new Schema({
    ripNumber: { type: String, required: true },
    reporterId: { type: Number, required: true },
    category: {
        type: String,
        enum: ['product_not_received', 'crypto_scam', 'service_not_delivered', 'phishing', 'fast_service', 'honest_trader', 'positive_other', 'other'],
        required: true
    },
    description: { type: String, required: true },
    evidence: {
        hasEvidence: { type: Boolean, default: false },
        fileIds: [{ type: String }],
        hash: { type: String }
    },
    weight: { type: Number, default: 1.0 },
    timestamp: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['pending_review', 'published', 'rejected'],
        default: 'pending_review'
    }
});

// Index to prevent duplicate reports (one user can report a RIP only once)
ReportSchema.index({ ripNumber: 1, reporterId: 1 }, { unique: true });

export const Report = mongoose.model<IReport>('Report', ReportSchema);

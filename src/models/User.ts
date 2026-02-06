import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    telegramId: number;
    username?: string;
    firstName?: string;
    phoneNumber?: string;
    userRipNumber?: string;
    isRegistered: boolean;
    trustScore: number;
    reportsSubmitted: number;
    reportsRejected: number;
    joinedAt: Date;
}

const UserSchema: Schema = new Schema({
    telegramId: { type: Number, required: true, unique: true },
    username: { type: String },
    firstName: { type: String },
    phoneNumber: { type: String },
    userRipNumber: { type: String },
    isRegistered: { type: Boolean, default: false },
    trustScore: { type: Number, default: 1.0 },
    reportsSubmitted: { type: Number, default: 0 },
    reportsRejected: { type: Number, default: 0 },
    joinedAt: { type: Date, default: Date.now },
});

// Index for fast RIP owner lookups when sending notifications
UserSchema.index({ userRipNumber: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);

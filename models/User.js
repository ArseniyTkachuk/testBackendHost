import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        default: "/utils/defaultUserImg.png"
    },

    verified: { type: Boolean, default: false },

    emailCodeHash: String,
    emailCodeExpires: Date,

    deleteAt: {
        type: Date,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
        index: { expires: 0 }
    }

}, { timestamps: true })

export default mongoose.model('User', UserSchema);

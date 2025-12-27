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

}, { timestamps: true })

export default mongoose.model('User', UserSchema);

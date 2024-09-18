import mongoose, { Document, Schema } from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"


// Define an interface representing a User document in MongoDB
export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    profile?: string;
    bio?: string;
    gender?: 'male' | 'female';
    bookmarks: mongoose.Types.ObjectId[];
    posts: mongoose.Types.ObjectId[];
    following: mongoose.Types.ObjectId[];
    followers: mongoose.Types.ObjectId[];
    dob: Date;
    age: number;
    resetPasswordToken: string;
    resetPasswordExpires: Date;
    getJwtToken(): Promise<string>;
    comparePassword(password: string): Promise<boolean>;
}

// Define the schema for the User model
const userSchema = new mongoose.Schema<IUser>({
    username: {
        type: String,
        required: [true, "Please enter a username"],
    },
    email: {
        type: String,
        required: [true, "Please enter a valid email"],
        unique: true,
        validate: [validator.isEmail, "Please enter a valid email"],
    },
    password: {
        type: String,
        required: [true, "Please enter a password"],
        minlength: [6, "Password must be at least 6 characters long"],
        select: false
    },
    profile: {
        type: String,
        default: "",
    },
    bio: {
        type: String,
        default: "",
    },
    gender: {
        type: String,
        enum: ["male", "female"],
    },
    bookmarks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
    }],
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    dob: {
        type: Date,
        validate: [validator.isISO8601, "Please enter a valid date of birth"],
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
}, { timestamps: true });

// Virtual field for calculating age
userSchema.virtual('age').get(function (this: IUser) {
    const currentDate = new Date();
    const birthDate = new Date(this.dob);
    let age = currentDate.getFullYear() - birthDate.getFullYear();

    if (
        currentDate.getMonth() < birthDate.getMonth() ||
        (currentDate.getMonth() === birthDate.getMonth() && currentDate.getDate() < birthDate.getDate())
    ) {
        age--;
    }

    return age;
});

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        next()
    }
    this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods.getJwtToken = async function () {
    const token = jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY!, {
        expiresIn: process.env.JWT_EXPIRATION_TIME,
    })
    return token
}

userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {

    return await bcrypt.compare(password, this.password)
}
export const User = mongoose.model<IUser>("User", userSchema);

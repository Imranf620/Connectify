import { NextFunction, Request, Response } from "express";
import catchAsyncError from "../middlewares/catchAsyncError.js";
import { IUser, User } from "../models/userModel.js";
import getJwtToken from "../utils/jwtToken.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import mongoose from "mongoose";
import nodemailer from "nodemailer"



export const register = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const { username, email, password } = req.body;
    const user = await User.create({ username, email, password });
    getJwtToken(201, user, res)
})


export const login = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password")
    if (!user) {
        return next(new ErrorHandler("Invalid credentials", 401))
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
        return next(new ErrorHandler("Invalid credentials", 401))
    }

    getJwtToken(200, user, res)

})

export const updatePassword = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword) {
        return next(new ErrorHandler("Current password is required", 400))
    }
    if (!newPassword || !confirmNewPassword) {
        return next(new ErrorHandler("New password is required", 400))
    }

    let user = await User.findById(req.user).select("+password")
    if (!user) {
        return next(new ErrorHandler("User not found", 404))
    }

    const isMatch = await user.comparePassword(currentPassword)

    if (!isMatch) {
        return next(new ErrorHandler("Current password is incorrect", 401))
    }
    if (newPassword !== confirmNewPassword) {
        return next(new ErrorHandler("New passwords do not match", 400))
    }
    user.password = newPassword;
    await user.save()
    res.status(200).json({ success: true, message: "Password updated successfully" })
})

export const myProfile = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {

    const user = await User.findById(req.user)
    res.status(200).json({ success: true, data: user })
})

export const logout = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {

    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
        sameSite: "strict",
    })

    res.status(200).json({ success: true, message: "Logged out successfully" })
})


export const updateProfile = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {

    const { username, email, dob, bio } = req.body
    let user = await User.findById(req.user)
    if (!user) {
        return next(new ErrorHandler("User not found", 404))
    }
    user = await User.findByIdAndUpdate(req.user, { username, email, dob, bio }, { new: true, runValidators: true })
    res.status(200).json({ success: true, message: "Profile updated successfully", data: user })

})



export const followUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const userToFollow = await User.findById(req.params.id);
    const me = await User.findById(req.user);

    if (!userToFollow) {
        return next(new ErrorHandler("User not found", 404));
    }

    if (!me) {
        return next(new ErrorHandler("Your account was not found", 404));
    }

    const isAlreadyFollowing = userToFollow.followers.includes(me._id as mongoose.Types.ObjectId);

    if (isAlreadyFollowing) {
        await userToFollow.updateOne({ $pull: { followers: me._id } }, { new: true });
        await me.updateOne({ $pull: { following: userToFollow._id } }, { new: true });
    } else {
        await userToFollow.updateOne({ $push: { followers: me._id } }, { new: true });
        await me.updateOne({ $push: { following: userToFollow._id } }, { new: true });
    }

    await userToFollow.save()
    await me.save()

    res.status(200).json({
        success: true,
        message: isAlreadyFollowing ? "Unfollowed" : "Followed",
        data: me
    });
});


export const getMyFollowers = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const account = await User.findById(req.params.id).populate("followers", "username profilePic");

    if (!account) {
        return next(new ErrorHandler("Your account was not found", 404));
    }
    const followers = account.followers;

    res.status(200).json({ success: true, data: followers });
});


export const getMyFollowings = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const me = await User.findById(req.user).populate("following", "username profilePic");

    if (!me) {
        return next(new ErrorHandler("Your account was not found", 404));
    }
    const followings = me.following;
    res.status(200).json({ success: true, data: followings });
});

export const deleteMe = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findByIdAndDelete(req.user);
    if (!user) {
        return next(new ErrorHandler("User not found", 404))
    }

    res.cookie('token', null, {
        expires: new Date(Date.now()),
        httpOnly: true,
        sameSite: "strict",
    })
    res.status(200).json({ success: true, message: "User deleted successfully" })
})

export const getUserProfile = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id)
    if (!user) {
        return next(new ErrorHandler("User not found", 404))
    }

    res.status(200).json({ success: true, data: user })
})


export const getUserFollowers = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id)
    if (!user) {
        return next(new ErrorHandler("User not found", 404))
    }

    res.status(200).json({ success: true, data: user })
})


export const forgetPassword = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return next(new ErrorHandler("User not found with that email", 404));
    }

    // Ensure getResetPasswordToken is properly defined and typed
    const token = user.getResetPasswordToken();

    // Save token to user model
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${req.protocol}://${req.get("host")}/api/v1/users/passwords/reset/${token}`;
    const message = `Your password reset token is :- \n\n ${resetUrl}`;

    try {
        // Ensure environment variables are casted correctly
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST as string,
            port: Number(process.env.EMAIL_PORT),
            service: process.env.EMAIL_SERVICE as string,
            secure: true,
            auth: {
                user: process.env.EMAIL_USERNAME as string,
                pass: process.env.EMAIL_PASSWORD as string
            }
        });

        const messageOption = {
            from: process.env.EMAIL_USERNAME as string,
            to: user.email,
            subject: "Password Reset",
            text: message
        };

        await transporter.sendMail(messageOption);

        // Send success response
        res.status(200).json({
            success: true,
            message: `Password reset email sent to ${user.email}`
        });

    } catch (error) {
        // Reset token fields on error
        user.resetPasswordExpires = undefined;
        user.resetPasswordToken = undefined;
        await user.save({ validateBeforeSave: false });
        console.log(error)

        return next(new ErrorHandler("Failed to send email", 500));
    }
});


export const resetPassword = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {

    let user = await User.findOne({ resetPasswordToken: req.params.token })
    if (!user) {
        return next(new ErrorHandler("Invalid or expired token", 400))
    }
    if (user.resetPasswordExpires && user.resetPasswordExpires.getTime() < Date.now()) {
        return next(new ErrorHandler("Token has expired", 400));
    }

    if (req.body.newPassword !== req.body.confirmNewPassword) {
        return next(new ErrorHandler("Passwords do not match", 400))
    }
    user.password = req.body.newPasswor
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()
    res.status(200).json({ success: true, message: "Password reset successfully" })
})
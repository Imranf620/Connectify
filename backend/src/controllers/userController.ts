import { NextFunction, Request, Response } from "express";
import catchAsyncError from "../middlewares/catchAsyncError.js";
import { User } from "../models/userModel.js";
import getJwtToken from "../utils/jwtToken.js";
import ErrorHandler from "../utils/ErrorHandler.js";


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
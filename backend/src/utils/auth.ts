import { NextFunction, Request, Response } from "express";
import ErrorHandler from "./ErrorHandler.js";
import jwt from "jsonwebtoken";

export const isLoggedIn = (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.cookies;
    if (!token) {
        return next(new ErrorHandler("Please login to access this page", 401));
    }

    const decodedData = jwt.verify(token, process.env.JWT_SECRET_KEY!);
    if (!decodedData) {
        return next(new ErrorHandler("Invalid token, please login again", 401));
    }

    req.user = (decodedData as jwt.JwtPayload).id;

    next();
};

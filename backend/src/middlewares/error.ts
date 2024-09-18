import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler.js";

const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";

    if (err.name === "CastError") {
        const message = `Invalid ${err.path} ID: ${err.value}`;
        err = new ErrorHandler(message, 400)
    }

    if (err.code === 11000) {
        const message = `${Object.keys(err.keyValue)} already exists`
        err = new ErrorHandler(message, 400)

    }

    if (err.name === "JsonWebTokenError") {
        const message = "Invalid token, please login again"
        err = new ErrorHandler(message, 401)
    }

    if (err.name === "TokenExpiredError") {
        const message = "Token has expired, please login again"
        err = new ErrorHandler(message, 401)
    }

    res.status(err.statusCode).json({
        success: false,
        message: err.message,
        error: err.stack
    });
};

export default errorMiddleware;

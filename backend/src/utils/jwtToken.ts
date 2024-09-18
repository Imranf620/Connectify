import { Response } from "express";
import { IUser } from "../models/userModel.js";

const getJwtToken = async (status: number, user: IUser, res: Response) => {
    const token = await user.getJwtToken()

    res.status(status).cookie('token', token, {
        expires: new Date(Date.now() + Number(process.env.COOKIE_EXPIRE!) * 24 * 60 * 60 * 1000),
        httpOnly: true,
        sameSite: 'strict',
    }).json({
        success: true,
        message: `Welcome ${user.username}`
    })
}

export default getJwtToken;
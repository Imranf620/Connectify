import express from "express";
import { login, register, myProfile, logout, updateProfile, followUser, deleteMe, getMyFollowers, getMyFollowings, getUserProfile, updatePassword, forgetPassword, resetPassword } from "../controllers/userController.js";
import { isLoggedIn } from "../utils/auth.js";

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', isLoggedIn, myProfile)
router.get('/logout', isLoggedIn, logout)
router.put('/update', isLoggedIn, updateProfile)
router.put('/update/password', isLoggedIn, updatePassword)
router.post('/follow/:id', isLoggedIn, followUser)
router.delete('/delete', isLoggedIn, deleteMe)
router.get('/followers/:id', isLoggedIn, getMyFollowers)
router.get('/following/:id', isLoggedIn, getMyFollowings)
router.get('/profile/:id', isLoggedIn, getUserProfile)
router.post('/forget/password', isLoggedIn, forgetPassword)
router.post('/reset/password/:token', isLoggedIn, resetPassword)




export default router
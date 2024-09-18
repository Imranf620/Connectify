import express, { Request, Response } from "express";
import dotenv from "dotenv";
import connectDb from "./utils/connectDb.js";
import errorMiddleware from "./middlewares/error.js";
import userRoute from "./routes/userRoute.js"
import cookieParser from "cookie-parser"

dotenv.config();

const app = express();

const port = Number(process.env.PORT) || 8000;

app.get('/', (req: Request, res: Response) => {
    res.send('Route is working fine')
});

app.use(cookieParser())
app.use(express.json());

app.use("/api/v1/users", userRoute)
app.use(errorMiddleware)

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    connectDb();
});

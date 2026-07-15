import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import { env } from './config/env'
import passport from './config/passport'
import routes from "./routes/index";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";


export function createApp() {
    const app = express();

    app.use(helmet);
    app.use(
        cors({
            origin: env.FRONTEND_URL,
            credentials: true,
        })
    );
    app.use(express.json());
    app.use(cookieParser());
    app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));
    app.use(passport.initialize());
    app.use("/api", routes);

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}
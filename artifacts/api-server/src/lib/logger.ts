import pino from "pino";
import pretty from "pino-pretty";

const isProduction = process.env.NODE_ENV === "production";

const options: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
  ],
};

// Pretty, colourised output in development. A plain in-process stream is used instead of
// pino's worker-thread transport: it is more reliable on Windows and under tsx/esbuild.
export const logger = isProduction
  ? pino(options)
  : pino(options, pretty({ colorize: true, sync: true, translateTime: "SYS:HH:MM:ss" }));

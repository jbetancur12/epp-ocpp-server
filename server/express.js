import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import compress from "compression";
import cors from "cors";
import helmet from "helmet";
import ssrPrepass from "react-ssr-prepass";

import Template from "./../template";
import userRoutes from "./routes/user.routes";
import authRoutes from "./routes/auth.routes";
import chargerPointsRoutes from "./routes/chargerPoint.routes";
import devBundle from "./devBundle";
import sse from "./sse";

import React from "react";
import ReactDOMServer from "react-dom/server";
import MainRouter from "./../client/MainRouter";
import { StaticRouter } from "react-router-dom";

import { ServerStyleSheets, ThemeProvider } from "@material-ui/styles";
import theme from "./../client/theme";

const CURRENT_WORKING_DIR = process.cwd();

const app = express();
/*... configure express ... */

devBundle.compile(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
//app.use(compress());
app.use(helmet());
app.use(cors());
app.use(sse);

app.use("/dist", express.static(path.join(CURRENT_WORKING_DIR, "dist")));

app.use("/", userRoutes);
app.use("/", authRoutes);
app.use("/", chargerPointsRoutes);

app.get("*", async (req, res) => {
  const sheets = new ServerStyleSheets();
  const context = {};

  // await ssrPrepass(element)
  const markup = ReactDOMServer.renderToString(
    sheets.collect(
      <StaticRouter location={req.url} context={context}>
        <ThemeProvider theme={theme}>
          <MainRouter />
        </ThemeProvider>
      </StaticRouter>
    )
  );

  if (context.url) {
    return res.redirect(303, context.url);
  }
  const css = sheets.toString();
  res.status(200).send(
    Template({
      markup: markup,
      css: css,
    })
  );
});

app.use((err, req, res, next) => {
  if (err.name === "UnauthorizedError") {
    res.status(401).json({ error: err.name + ": " + err.message });
  } else if (err) {
    res.status(400).json({ error: err.name + ": " + err.message });
    console.log(err);
  }
});

export default app;

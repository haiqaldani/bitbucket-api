// require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const indexRouter = require("./routes/index");
const userRouter = require("./routes/users");
const repoRouter = require("./routes/repository");
const projectRouter = require("./routes/project");
const addonRouter = require("./routes/addon");

const app = express();

app.use(logger("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", userRouter);
app.use("/repository", repoRouter);
app.use("/project", projectRouter);
app.use("/addon", addonRouter);

module.exports = app;

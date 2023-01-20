const express = require('express');
const app = express();
const path = require('path');
const baseRouter = require('./routes/baseRouter');
const cors = require("cors");

app.use(express.static("public"));
app.use(cors());

app.use("/", baseRouter);

module.exports = app;

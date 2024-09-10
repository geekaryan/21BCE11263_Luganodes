const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const DepositRoute = require("./routes/DepositRoute");

//running our express server
const app = express();

app.use(express.json());
app.use(morgan("dev"));
app.use(cors());

app.use("/api/deposit", DepositRoute);
module.exports = app;

//My backend App flow
//so I am making a single route Deposit route which only takes the post request connected my mongoDB database which
//specifically save my data schema which is getting tracked.

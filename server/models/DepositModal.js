//This file contains the schema of the backend application

const mongoose = require("mongoose");

const DepositSchema = new mongoose.Schema({
  txHash: {
    type: String,
    required: [true, "Hash must be there"],
  },
  from: {
    type: String,
    required: true,
  },
  to: {
    type: String,
  },
  value: {
    type: String,
    required: [true, "some value must be there"],
  },
  value: {
    type: String,
  },
  value: {
    type: String,
  },
});

const Deposit = mongoose.model("Deposit", DepositSchema);

module.exports = Deposit;

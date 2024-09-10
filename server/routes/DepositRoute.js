//Routing the post request in this file

const express = require("express");
const DepositController = require("./../controller/DepositController");

const router = express.Router();

router.route("/").post(DepositController.createOrder);

module.exports = router;

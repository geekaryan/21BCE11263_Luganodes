//The controller file is just adding data to the mongoDB database

const Deposit = require("./../models/DepositModal");

exports.createOrder = async (req, res) => {
  try {
    const deposit = await Deposit.create(req.body);
    res.status(200).json({
      status: "success",
      data: {
        deposit,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err.message,
    });
  }
};

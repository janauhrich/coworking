const router = require("express").Router();
const { generate: generateId } = require("shortid");
const Units = require("../models/units");

const publicKeys = "_id kind floor special_monthly_offer company";
const kinds = ["seat", "desk", "small office", "large office", "floor"]

router.get("/", async (req, res, next) => {
  const status = 200;
  const response = await Units.find(req.query);
  res.json({ status, response });
});

router.post("/", async (req, res, next) => {
    const status = 201;
    try {
      const units = await Units.create(req.body);
      const response = await Units.findById(units._id);
  
      res.json({ status, response });
    } catch (error) {
      error.status = 400;
      error.message = "Insert failed. Check that all required data is present and formatted properly.";
  
      next(error);
    }
  });


module.exports = router;

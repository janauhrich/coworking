const router = require("express").Router();
const { generate: generateId } = require("shortid");
const Units = require("../models/units");

const publicKeys = "_id kind floor special_monthly_offer company";
const kinds = ["seat", "desk", "small office", "large office", "floor"];

//GET
// http://localhost:5000/api/v1/units
// http://localhost:5000/api/v1/units?kind=desk
// http://localhost:5000/api/v1/units?floor=2
// http://localhost:5000/api/v1/units?occupied=true
router.get("/units", async (req, res, next) => {
  const status = 200;
  const query = req.query;

  let response = await Units.find(query);

  if (String(Object.keys(query)).includes(`occupied`)) {
    response = await Units.find({ company: { $gt: [] } });
  }

  res.json({ status, response });
});

//Update the unit with whatever information is specified in the request body and return the newly updated document.If the ID provided does not match a unit, return a 404 and an appropriate message.Note: You should allow for the company to be added from this route, if provided.

//PATCH
// http://localhost:5000/api/v1/units/5d36b6459505d2086326b425
// got some inspiration on this from  https://dev.to/aurelkurtula/building-a-restful-api-with-express-and-mongodb--3mmh
router.patch("/units/:id", async (req, res, next) => {

  try {
    let status = 200;
    const findOneAndUpdate = await Units.findById(
      req.params.id,
      (err, unit) => {
        if (err) { 
          console.log(err)
          return
        }
        if (req.body._id) {
          //don't let them update the id, that'd be weird
          delete req.body._id;
        }
        for (let update in req.body) {
          //loop through each object and update if it changed
          unit[update] = req.body[update];
        }
        //I still don't totally get when you need to .save() some things and when you don't but all the examples I looked at had this so it's probably important
        unit.save();
      }
    );
    //this seems to be running before findOneAndUpdate? 
    const response = await Units.findById(req.params.id);
    res.json({ status, response });
  } catch (error) {
    error.status = 404;
    error.message = "Unit not found";
    next(error);
  }
});

router.patch("/units/:id/company", async (req, res, next) => {
  const status = 200;
  try {
    const findOneAndUpdate = await Units.findById(req.params.id, (err, unit) => {
      if (err) { 
        console.log(err)
        return
      }
      for (let update in req.body) {
        unit[update] = req.body[update];
      }
      unit.save();
    });
    const response = await Units.findById(req.params.id);
    res.json({ status, response });
  }  catch (error) {
    error.status = 404;
    error.message = "Unit not found";
    next(error);
  }
});

router.post("/units", async (req, res, next) => {
  const status = 201;
  try {
    const units = await Units.create(req.body);
    const response = await Units.findById(units._id);

    res.json({ status, response });
  } catch (error) {
    error.status = 400;
    error.message =
      "Insert failed. Check that all required data is present and formatted properly.";

    next(error);
  }
});

module.exports = router;

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

//PATCH
// http://localhost:5000/api/v1/units/5d36b6459505d2086326b425

// got some inspiration on this from  https://dev.to/aurelkurtula/building-a-restful-api-with-express-and-mongodb--3mmh
router.patch("/units/:id", async (req, res, next) => {
  try {
    let status = 200;
    const findByID = await Units.findById(req.params.id, (err, unit) => {
      if (err) {
        console.log(err);
        return;
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
    });
    //this seems to be running before findOneAndUpdate?
    const response = await Units.findById(req.params.id);
    res.json({ status, response });
  } catch (error) {
    error.status = 404;
    error.message = "Unit not found";
    next(error);
  }
});

//Patch
//http://localhost:5000/api/v1/units/5d36b6750e7ed60948570285/company

router.patch("/units/:id/company", async (req, res, next) => {
  const status = 200;
  try {
    const findById = await Units.findById(req.params.id, (err, unit) => {
      if (err) {
        console.log(err);
        return;
      }
      for (let update in req.body) {
        unit[update] = req.body[update];
      }
      unit.save();
    });
    const response = await Units.findById(req.params.id);
    res.json({ status, response });
  } catch (error) {
    error.status = 404;
    error.message = "Unit not found";
    next(error);
  }
});

// DELETE
// http://localhost:5000/api/v1/units/5d36b6750e7ed60948570285/company

router.delete("/units/:id/company", async (req, res, next) => {
  const status = 200;
  try {
    const findAndDelete = Units.findById(req.params.id, (err, unit) => {
      if (err) {
        console.log(err);
        return;
      }
      unit.company = [];
      unit.save();
    });
    const response = await Units.findById(req.params.id);
    res.json({ status, response });
  } catch (error) {
    error.status = 404;
    error.message = "Unit not found";
    next(error);
  }
});

//GET
// http://localhost:5000/api/v1/units/5d36b6c09536830a5b7edac3/company/employees
router.get("/units/:id/company/employees", async (req, res, next) => {
  const status = 200;
  try {
    const getDoc = await Units.findById(req.params.id);
    const response = await getDoc.company[0].employee;

    res.json({ status, response });
  } catch (error) {
    if (error.path === "_id") {
      error.status = 404;
      error.message = "Unit not found";
    }
    error.status = 404;
    error.message = "Company not found";
    next(error);
  }
});

//GET
// http://localhost:5000/api/v1/units/5d36b6750e7ed60948570285/company/employees/5d36b6750e7ed60948570287
router.get(
  "/units/:id/company/employees/:employeeid",
  async (req, res, next) => {
    const status = 200;
    try {
      const getDoc = await Units.findById(req.params.id);
      const employees = await getDoc.company[0].employee;
      const response = await employees.find(
        employee => employee.id === req.params.employeeid
      );
      //there's gotta be a better way of organizing this but all googling just shows mongoose schema validation
      if (!response) {
        throw {
          name: "employeeError",
          message: "Employee not found"
        };

        return;
      }
      res.json({ status, response });
    } catch (error) {
      if (error.path === "_id") {
        error.status = 404;
        error.message = "Unit not found";
      } else if (error.name === "employeeError") {
        error.status = 404;
        next(error);
      }
      error.status = 404;
      error.message = "Company not found";
      next(error);
    }
  }
);

//POST
// http://localhost:5000/api/v1/units/5d36b6750e7ed60948570285/company/employees

router.post("/units/:id/company/employees", async (req, res, next) => {
  const status = 201;
  let response = "";
  let theCompany = "";

  //this error handling is hot garbage, WTH does good error handling look like?
  try {
    const findById = await Units.findById(req.params.id, (err, unit) => {
      if (err) {
        return;
      }
      const returnEmployee = function() {
        const employees = theCompany.employee;
        response = employees[employees.length - 1];
      };
      const addEmployee = function() {
        theCompany.employee.push(req.body);
        unit.save();
        returnEmployee();
      };

      try {
        theCompany = unit.company[0];
      } catch (error) {
        error.status = 404;
        error.message = "Company not found";
        next(error);
      }
      try {
        addEmployee();
      } catch (error) {
        error.status = 400;
        error.message =
          "Insert failed. Check that all required data is present and formatted properly.";
        next(error);
      }
      res.json({ status, response });
    });
  } catch (error) {
    if (error.path === "_id") {
      error.status = 404;
      error.message = "Unit not found";
      next(error);
    }
  }
});

//PATCH
// http://localhost:5000/api/v1/units/5d36b6750e7ed60948570285/company/employees/5d3fe332ffef3297cb41d141
router.patch(
  "/units/:id/company/employees/:employeeid",
  async (req, res, next) => {
    let status = 201;
    let response = "";
    let theCompany = "";

    try {
      const findById = await Units.findById(req.params.id, (err, unit) => {
        if (err) {
          status = 404;
          response = "Unit not found";
          return;
        }
        try {
          theCompany = unit.company[0];
        } catch (error) {
          status = 404;
          response = "Company not found";
          next(error);
        }

        theEmployee = theCompany.employee.find(
          employee => employee.id === req.params.employeeid
        );

        if (!theEmployee) {
          status = 404;
          response = "Employee not found";
          return;
        }

        try {
          for (let update in req.body) {
            theEmployee[update] = req.body[update];
          }
          unit.save();
        } catch (error) {
          status = 400;
          response = "Update did not work, check your data";
          next(error);
        }
      });
      if (!response) {
        response = await Units.findById(req.params.id);
      }

      res.json({ status, response });
    } catch (error) {
      console.log(error);
      error.status = "404";
      error.message = "Epic Fail";
      next(error);
    }
  }
);
//DELETE
// http://localhost:5000/api/v1/units/5d36b6750e7ed60948570285/company/employees/5d3fe332ffef3297cb41d141
router.delete(
  "/units/:id/company/employees/:employeeid",
  async (req, res, next) => {
    let status = 201;
    let response = "";
    let theCompany = "";
    let theEmployee = "";

    try {
      const findById = await Units.findById(req.params.id, (err, unit) => {
        if (err) {
          status = 404;
          response = "Unit not found";
          return;
        }
        theCompany = unit.company[0];
        console.log(theCompany);

        if (!theCompany) {
          status = 404;
          response = "Company not found";
          return;
        }
        theEmployeeIndex = theCompany.employee.findIndex(
          employee => employee.id === req.params.employeeid
        );

        if (theEmployeeIndex === -1) {
          status = 404;
          response = "Employee not found";
          return;
        }

        try {
          theCompany.employee.splice(theEmployeeIndex, 1);
          unit.save();
        } catch (error) {
          status = 400;
          response = "Update did not work, check your data";
          next(error);
        }
      });
      if (!response) {
        response = await Units.findById(req.params.id);
      }

      res.json({ status, response });
    } catch (error) {
      console.log(error);
      error.status = "404";
      error.message = "Epic Fail";
      next(error);
    }
  }
);

//GET
// http://localhost:5000/api/v1/companies
// http://localhost:5000/api/v1/companies?name=ko
// http://localhost:5000/api/v1/companies?employees_lte=1
// http://localhost:5000/api/v1/companies?employees_gte=2

router.get("/companies/", async (req, res, next) => {
  const status = 201;
  let response = "";
  const query = req.query;
  try {
    const unitsWithCompanies = await Units.find({ company: { $gt: [] } });
    const companies = await unitsWithCompanies.map(unit => unit.company);
    response = companies;

    if (String(Object.keys(query)).includes(`name`)) {
      // companies name query
      const unitsWithCompanyNamesLike = await companies.filter(company =>
        company[0].name.toLowerCase().includes(query.name.toLowerCase())
      );
      response = unitsWithCompanyNamesLike;
    }
    // employees less than
    if (String(Object.keys(query)).includes(`employees_lte`)) {
      const unitsWithEmployeesLessThan = await companies.filter(
        company => company[0].employee.length <= query.employees_lte
      );
      response = unitsWithEmployeesLessThan;
    }
    // employees greater than
    if (String(Object.keys(query)).includes(`employees_gte`)) {
      const unitsWithEmployeesGreaterThan = await companies.filter(
        company => company[0].employee.length >= query.employees_gte
      );

      response = unitsWithEmployeesGreaterThan;
    }

    res.json({ status, response });
  } catch (error) {
    error.status = 400;
    error.message = "Invalid request";
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

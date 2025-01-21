const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const moment = require("moment");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
var punycode = require("punycode/");

//Variables for storing data
const currentDate = moment();
var fullName = "";
const oneMonthAgoDate = moment().subtract(1, "month");

//Initialisations
var app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//Session Setup
app.use(
  session({
    secret: "your secret key",
    resave: false,
    saveUninitialized: false,
  })
);

//Database Models
var userType = require("./models/userTypeModel");
var user = require("./models/userModel");
var serviceCategory = require("./models/serviceCategoryModel");
var cities = require("./models/citiesModel");
var services = require("./models/servicesModel");
var subCategories = require("./models/subCategoryModel");
var Booking = require("./models/bookingModel");
var serviceAgent = require("./models/serviceAgentModel");

//Database Setup
mongoose.set("strictQuery", false);
mongoose
  .connect(
    "mongodb+srv://meghshah05:Shreeganesh2018@cluster0.tsvylyb.mongodb.net/VeeServe?retryWrites=true&w=majority",
    { useNewUrlParser: true }
  )
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => {
    console.log("ERROR:", err.message);
  });
var status = 0;

//Multer Setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine the destination folder based on some condition, e.g., user role
    let uploadFolder = "public/images/";

    // You can adjust this logic based on your application's requirements
    if (req.path.includes("/addServiceAgent")) {
      uploadFolder += "service_provider";
    } else {
      uploadFolder += "services";
    }

    cb(null, uploadFolder);
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 }, // 1 MB
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single("image");

function checkFileType(file, cb) {
  // Allowed file types
  const filetypes = /jpeg|jpg|png|gif/;

  // Check extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  // Check mime type
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Images Only!");
  }
}

//Dashboard
app.get("/dashboard", async function (req, res) {
  if (req.session.isLoggedIn) {
    try {
      var orderCount = 0;
      var totalRevenue = 0;
      var topServices = [];
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1); // Get the date of one month ago

      Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: lastMonth },
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalRevenue: { $sum: "$price" },
          },
        },
      ])
        .then((result) => {
          orderCount = result.length > 0 ? result[0].count : 0;
          totalRevenue = result.length > 0 ? result[0].totalRevenue : 0;

          console.log(
            "Total number of bookings in the last month:",
            orderCount
          );
          console.log("Total revenue in the last month:", totalRevenue);
        })
        .catch((error) => {
          console.error("An error occurred while counting bookings:", error);
        });

      const customerCount = await user.countDocuments({
        userType: "63fa32a9d782b1c67dbfa2c5",
        createdAt: { $gte: oneMonthAgoDate, $lt: currentDate },
      }); // Retrieve count of users
      const cityCount = await cities.countDocuments();
      const recentUsers = await user
        .find({ userType: "63fa32a9d782b1c67dbfa2c5" }) // Use an object to specify field name and value for filtering
        .sort({ createdAt: -1 }) // Sort by createdAt field in descending order
        .limit(4); // Retrieve most recent 4 users

      Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: lastMonth }, // Filter bookings with date greater than or equal to last month
          },
        },
        {
          $group: {
            _id: "$serviceId",
            totalBookings: { $sum: 1 },
            totalRevenue: { $sum: "$price" },
          },
        },
        {
          $sort: {
            totalBookings: -1,
          },
        },
        {
          $limit: 3,
        },
      ])
        .then(async (result) => {
          topServices = [];
          for (const service of result) {
            const serviceData = await services.findById(service._id).lean();
            if (serviceData) {
              topServices.push({
                serviceName: serviceData.name,
                totalBookings: service.totalBookings,
                totalRevenue: service.totalRevenue,
              });
            }
          }
          console.log("Top 5 trending services of the month:");
          console.log(topServices);
          res.render("admin_index", {
            recentUsers,
            fullName,
            customerCount,
            cityCount,
            orderCount,
            totalRevenue,
            topServices,
          });
        })
        .catch((error) => {
          console.error(
            "An error occurred while finding top trending services:",
            error
          );
        });
    } catch (error) {
      console.error(error);
      // Handle error and send appropriate response
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.redirect("/");
  }
});

//Login Page
app.get("/", function (req, res) {
  res.render("admin_login", { message: "" });
});

//Services Page
app.get("/services", function (req, res) {
  if (req.session.isLoggedIn) {
    services
      .find()
      .populate("type", "categoryName") // Populate the 'serviceCategoryId' field with 'name' from the referenced model
      .then((services) => {
        res.render("admin_services", {
          fullName: fullName,
          services: services,
        });
      })
      .catch((err) => {
        console.error(err);
        res.redirect("/");
      });
  } else {
    res.redirect("/");
  }
});

app.get("/addService", function (req, res) {
  if (req.session.isLoggedIn) {
    serviceCategory
      .find()
      .then((serviceCategory) => {
        res.render("admin_addService", {
          fullName: fullName,
          serviceCategories: serviceCategory,
        });
      })
      .catch((err) => {
        console.error(err);
        res.redirect("/");
      });
  } else {
    res.redirect("/");
  }
});

app.get("/addSubcategory", function (req, res) {
  if (req.session.isLoggedIn) {
    serviceCategory
      .find()
      .then((serviceCategory) => {
        res.render("admin_addSubCategory", {
          fullName: fullName,
          serviceCategories: serviceCategory,
        });
      })
      .catch((err) => {
        console.error(err);
        res.redirect("/");
      });
  } else {
    res.redirect("/");
  }
});

app.get("/addServiceAgent", function (req, res) {
  if (req.session.isLoggedIn) {
    serviceCategory
      .find()
      .then((serviceCategory) => {
        res.render("admin_addServiceAgent", {
          fullName: fullName,
          serviceCategories: serviceCategory,
        });
      })
      .catch((err) => {
        console.error(err);
        res.redirect("/");
      });
  } else {
    res.redirect("/");
  }
});

app.get("/addCity", function (req, res) {
  if (req.session.isLoggedIn) {
    res.render("admin_addCity", {
      fullName: fullName,
    });
  } else {
    res.redirect("/");
  }
});

app.get("/getSubcategories/:categoryId", function (req, res) {
  var categoryId = req.params.categoryId;
  subCategories
    .find({ categoryId: categoryId })
    .then(function (subcategories) {
      res.json(subcategories);
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).send("An error occurred while fetching subcategories.");
    });
});

app.get("/updateService/:id", function (req, res) {
  if (req.session.isLoggedIn) {
    var id = req.params.id;
    services
      .findOne({ _id: id })
      .populate("type")
      .then((service) => {
        serviceCategory
          .find()
          .then((serviceCategories) => {
            subCategories
              .find({ category: service.category })
              .then((serviceSubcategories) => {
                res.render("admin_updateService", {
                  fullName: fullName,
                  service: service,
                  serviceCategories: serviceCategories,
                  serviceSubcategories: serviceSubcategories,
                });
              })
              .catch((err) => {
                console.error(err);
                res.redirect("/");
              });
          })
          .catch((err) => {
            console.error(err);
            res.redirect("/");
          });
      });
  }
});

app.get("/serviceAgents", function (req, res) {
  if (req.session.isLoggedIn) {
    serviceAgent
      .find()
      .populate("serviceCategory", "categoryName")
      .exec(function (err, serviceAgents) {
        if (err) {
          console.error("Error retrieving service agents:", err);
          res.status(500).send("Error: could not retrieve service agents.");
        } else {
          res.render("admin_serviceAgents", {
            fullName: fullName,
            serviceAgents: serviceAgents,
          });
        }
      });
  } else {
    res.redirect("/");
  }
});

//Delete Service
app.delete("/delete/:id", async function (req, res) {
  var id = req.params.id;
  try {
    await services.deleteOne({ _id: id }).exec();
    res.sendStatus(204); // Send a 204 No Content status code indicating successful deletion
  } catch (err) {
    console.log(err);
    res.sendStatus(500); // Send a 500 Internal Server Error status code indicating an error occurred
  }
});

app.get("/checkBookings/:id", async function (req, res) {
  const id = req.params.id;

  try {
    // Check if there are any bookings for the service provider
    const bookingsCount = await Booking.countDocuments({
      serviceProvider: id,
    }).exec();

    const hasBookings = bookingsCount > 0;

    res.json({ hasBookings });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ error: "An error occurred while checking bookings." });
  }
});

app.delete("/deleteAgent/:id", async function (req, res) {
  var id = req.params.id;

  try {
    // Check if there are any bookings for the service provider
    const bookingsCount = await Booking.countDocuments({
      serviceProvider: id,
    }).exec();

    if (bookingsCount === 0) {
      // No bookings found, delete the service provider
      await serviceAgent.deleteOne({ _id: id }).exec();
      res.sendStatus(204); // Send a 204 No Content status code indicating successful deletion
    } else {
      // Bookings found, do not delete the service provider
      res.sendStatus(400);
    }
  } catch (err) {
    console.log(err);
    res.sendStatus(500); // Send a 500 Internal Server Error status code indicating an error occurred
  }
});

app.delete("/deleteCity/:id", async function (req, res) {
  var id = req.params.id;
  try {
    await cities.deleteOne({ _id: id }).exec();
    res.sendStatus(204); // Send a 204 No Content status code indicating successful deletion
  } catch (err) {
    console.log(err);
    res.sendStatus(500); // Send a 500 Internal Server Error status code indicating an error occurred
  }
});

app.get("/charts", function (req, res) {
  if (req.session.isLoggedIn) {
    res.render("admin_charts", {
      fullName: fullName,
    });
  } else {
    res.redirect("/");
  }
});

app.get("/cities", function (req, res) {
  if (req.session.isLoggedIn) {
    cities
      .find()
      .then((cities) => {
        res.render("admin_cities", {
          fullName: fullName,
          cities: cities,
        });
      })
      .catch((err) => {
        console.error(err);
        res.redirect("/");
      });
  } else {
    res.redirect("/");
  }
});

app.get("/bookings", function (req, res) {
  if (req.session.isLoggedIn) {
    Booking.find()
      .populate({
        path: "serviceId",
      })
      .populate({
        path: "serviceProviderId",
        select: "name",
      })
      .then((bookings) => {
        res.render("admin_bookings", {
          fullName: fullName,
          bookings: bookings,
        });
      })
      .catch((err) => {
        console.error(err);
        res.redirect("/");
      });
  } else {
    res.redirect("/");
  }
});

//Logout
app.get("/logout", function (req, res) {
  req.session.destroy(function (err) {
    res.redirect("/");
  });
});

//Login
app.post("/", function (req, res) {
  var email = req.body.username;
  var password = req.body.password;

  user
    .findOne({ emailAddress: email })
    .then((foundUser) => {
      if (foundUser) {
        if (
          foundUser.password == password &&
          foundUser.userType == "63fc2e9fdcce68d572e609c4"
        ) {
          req.session.isLoggedIn = true;
          req.session.emailAddress = foundUser.emailAddress;
          fullName = foundUser.fullName;
          res.redirect("/dashboard");
        } else if (foundUser.password !== password) {
          res.render("admin_login", { message: "Incorrect Password" });
        } else if (foundUser.userType !== "63fc2e9fdcce68d572e609c4") {
          res.render("admin_login", { message: "You are not an Admin" });
        }
      } else {
        res.render("admin_login", { message: "User not Available" });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/addService", function (req, res) {
  upload(req, res, function (err) {
    if (err) {
      console.error(err);
      res.render("admin_addService", {
        fullName: fullName,
        serviceCategories: serviceCategory,
        error: err,
      });
    } else {
      const { category, subcategory, name, price, description } = req.body;

      const newService = new services({
        type: category,
        subCategory: subcategory,
        name: name,
        price: price,
        description: description,
        image: req.file ? `/images/services/${req.file.filename}` : null, // modified to include the path of the uploaded image file
      });
      newService
        .save()
        .then((service) => {
          console.log("Service added: ", service);
          res.redirect("/services");
        })
        .catch((err) => {
          console.error(err);
          res.render("admin_addService", {
            fullName: fullName,
            serviceCategories: serviceCategory,
            error: "Error adding service. Please try again later.",
          });
        });
    }
  });
});

app.post("/updateService/:id", function (req, res) {
  upload(req, res, function (err) {
    var id = req.params.id;
    var serviceName = req.body.name;
    var serviceCategoryId = req.body.category;
    var serviceDescription = req.body.description;
    var servicePrice = req.body.price;
    var subCategory = req.body.subcategory;
    var imageURL = req.file ? `/images/services/${req.file.filename}` : null;

    // Find the service record by ID
    services
      .findById(id)
      .then(function (service) {
        if (!service) {
          console.error(`Service with ID ${id} not found`);
          return res.status(404).send("Service not found");
        }

        if (imageURL) {
          // Delete the current image, if any
          if (service.image) {
            fs.unlink(`public${service.image}`, function (err) {
              if (err) {
                console.error(`Error deleting image ${service.image}:`, err);
              } else {
                console.log(`Image ${service.image} deleted successfully`);
              }
            });
          }

          // Save the new image URL to the service record
          service.image = imageURL;
        }

        // Update the service record with the new data
        service.name = serviceName;
        service.category = serviceCategoryId;
        service.description = serviceDescription;
        service.price = servicePrice;
        service.subCategory = subCategory;

        return service.save();
      })
      .then(function () {
        // Redirect to the services page
        res.redirect("/services");
      })
      .catch(function (err) {
        console.error(`Error updating service with ID ${id}:`, err);
        res.status(500).send("Error updating service");
      });
  });
});

app.post("/addSubCategory", function (req, res) {
  const { category, name } = req.body;

  // Create a new subCategory document
  const newSubCategory = new subCategories({
    title: name,
    categoryId: category,
  });

  // Save the new subCategory document to the database
  newSubCategory
    .save()
    .then(function (savedSubCategory) {
      res.redirect("/services");
    })
    .catch(function (error) {
      console.error("Error saving subCategory:", error);
      res.status(500).send("Error: could not add subCategory.");
    });
});

app.post("/addCity", function (req, res) {
  const { cityName, stateName, countryName } = req.body;

  // Create a new city document
  const newCity = new cities({
    cityName: cityName,
    stateName: stateName,
    countryName: countryName,
  });

  // Save the new city document to the database
  newCity
    .save()
    .then(function (savedCity) {
      res.redirect("/cities");
    })
    .catch(function (error) {
      console.error("Error saving city:", error);
      res.status(500).send("Error: could not add city.");
    });
});

app.post("/addServiceAgent", (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).send({ message: err.message });
    }

    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).send("Please upload an image.");
    }

    const { category, name, userName, password } = req.body;
    const newServiceAgent = new serviceAgent({
      name,
      serviceCategory: category,
      userName,
      password,
      // Assuming you want to store the image path
      imagePath: req.file.path,
    });

    newServiceAgent
      .save()
      .then(() => res.redirect("/serviceAgents"))
      .catch((error) => {
        console.error("Error saving service agent:", error);
        res.status(500).send("Error saving service agent.");
      });
  });
});

//Server Setup
app.listen(3000, function () {
  console.log("Server started on port 3000");
});

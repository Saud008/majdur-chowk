//Require Statements
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");
var punycode = require("punycode/");

//Initialisations
var app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(flash());

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

app.use(
  session({
    secret: "your secret key",
    resave: false,
    saveUninitialized: false,
  })
);

//Set up the database variable
const userType = require("./models/userTypeModel");
const user = require("./models/userModel");
const serviceCategory = require("./models/serviceCategoryModel");
const cities = require("./models/citiesModel");
const feedback = require("./models/feedbackModel");
const services = require("./models/servicesModel");
const subCategory = require("./models/subCategoryModel");
const Cart = require("./models/cartModel");
const Booking = require("./models/bookingModel");
const ServiceAgent = require("./models/serviceAgentModel");

//Transporter for nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "veeserveservices@gmail.com",
    pass: "kfwifhshtrkbqbew",
  },
});

var userCart = { items: [] };
var email;
//Get Requests

//Get Request for Home Page
app.get("/", async function (req, res) {
  try {
    const foundCategories = await serviceCategory.find({ isActive: true });
    const feedbacks = await feedback.find().populate("userId");

    if (req.session.isLoggedIn && req.session.emailAddress) {
      const userEmail = req.session.emailAddress;

      if (req.cookies.newcart) {
        const newCartItems = req.cookies.newcart.items;
        console.log(req.session.userId);
        const foundCart = await Cart.findOne({ user: req.session.userId });

        if (foundCart) {
          const items = foundCart.items;
          items.push(...newCartItems);
          foundCart.items = items;
          res.clearCookie("newcart");
          console.log("The NewCart is not clearing");
          await foundCart.save();
        } else {
          const cart = new Cart({
            user: req.session.userId,
            items: newCartItems,
          });
          res.clearCookie("newcart");
          console.log("The NewCart is not clearing");
          await cart.save();
        }

        userCart.items = foundCart.items;
        console.log(userCart);
        res.render("index", {
          status: 1,
          categories: foundCategories,
          testimonials: feedbacks,
          cart: userCart,
        });
      } else {
        const foundCart = await Cart.findOne({ user: req.session.userId });
        if (foundCart) userCart.items = foundCart.items;
        console.log(userCart);
        res.render("index", {
          status: 1,
          categories: foundCategories,
          testimonials: feedbacks,
          cart: userCart,
        });
      }
    } else {
      if (req.cookies.newcart) {
        userCart = req.cookies.newcart;
        console.log(userCart);
        res.render("index", {
          status: 0,
          categories: foundCategories,
          testimonials: feedbacks,
          cart: userCart,
        });
      } else {
        userCart = { items: [] };
        console.log(userCart);
        res.render("index", {
          status: 0,
          categories: foundCategories,
          testimonials: feedbacks,
          cart: userCart,
        });
      }
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Error: could not access data.");
  }
});

//Get Request for Login Page
app.get("/login", function (req, res) {
  res.render("login", { message: "" });
});

app.get("/cart", async function (req, res) {
  const error = req.query.error;

  if (req.session.isLoggedIn) {
    try {
      const foundCart = await Cart.findOne({ user: req.session.userId }).populate({
        path: "items.serviceId",
        model: "services_mst",
      });

      if (foundCart) {
        let subtotal = 0;
        for (let item of foundCart.items) {
          subtotal += item.serviceId.price;
        }
        res.render("cart", {
          cart: foundCart,
          status: 1,
          subtotal: subtotal,
          error: error,
        });
      } else {
        console.log("No cart found");
      }
    } catch (err) {
      console.log(err);
      res.status(500).send("Error: could not access cart.");
    }
  } else {
    let subtotal = 0;
    const items = userCart.items;
    const promises = items.map(async (item) => {
      const service = await services.findOne({ _id: item.serviceId });
      return { serviceId: service };
    });
    const results = await Promise.all(promises);
    const foundCart = {
      items: results,
      user: "Guest",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    foundCart.totalItems = foundCart.items.length;
    for (let item of foundCart.items) {
      subtotal += item.serviceId.price;
    }
    res.render("cart", {
      cart: foundCart,
      status: 0,
      subtotal: subtotal,
      error: error,
    });
  }
});

//Get Request for Register Page
app.get("/register", function (req, res) {
  cities.find({}, "cityName", function (err, foundCities) {
    if (err) {
      console.log(err);
    } else {
      if (foundCities) {
        res.render("register", { cities: foundCities });
      } else {
        console.log("No cities found");
      }
    }
  });
});

//Get Request for Services Page
app.get("/services", async function (req, res) {
  try {
    const foundCategories = await serviceCategory.find({ isActive: true });

    if (req.session.isLoggedIn) {
      const foundCart = await Cart.findOne({ user: req.session.userId });
      res.render("services", {
        status: 1,
        categories: foundCategories,
        cart: foundCart,
      });
    } else {
      userCart = req.cookies.newcart || { items: [] };
      res.render("services", {
        status: 0,
        categories: foundCategories,
        cart: userCart,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/services/:id", async function (req, res) {
  var id = req.params.id;
  try {
    const foundServices = await services.find({ type: id }).populate("subCategory");

    if (foundServices.length > 0) {
      let currentSubCategory = null;
      let subcategoryServices = [];
      foundServices.forEach((service) => {
        if (service.subCategory.title !== currentSubCategory) {
          currentSubCategory = service.subCategory.title;
          subcategoryServices.push([]);
        }
        subcategoryServices[subcategoryServices.length - 1].push(service);
      });

      if (req.session.isLoggedIn) {
        const foundCart = await Cart.findOne({ user: req.session.userId });
        const cartServiceIds = foundCart.items.map((item) =>
          item.serviceId.toString()
        );

        res.render("services_detail", {
          status: 1,
          subcategoryServices: subcategoryServices,
          cart: foundCart,
          cartServiceIds: cartServiceIds,
          req: req,
        });
      } else {
        userCart = req.cookies.newcart || { items: [] };
        const cartServiceIds = userCart.items.map((item) =>
          item.serviceId.toString()
        );

        res.render("services_detail", {
          status: 0,
          subcategoryServices: subcategoryServices,
          cart: userCart,
          cartServiceIds: cartServiceIds,
          req: req,
        });
      }
    } else {
      console.log("No services found");
      res.redirect("/services");
    }
  } catch (err) {
    console.log(err);
    res.redirect("/services");
  }
});

//Get Request for About Page
app.get("/about", function (req, res) {
  if (req.session.isLoggedIn)
    res.render("about", { status: 1, cart: userCart });
  else res.render("about", { status: 0, cart: userCart });
});

//Get Request for Contact Page
app.get("/forgotPassword", function (req, res) {
  res.render("forgot_password", { message: "" });
});

//Get Request for Reset Password Page
app.get("/reset-password/:token", (req, res) => {
  user.findOne(
    {
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    },
    (err, account) => {
      if (err) {
        return err;
      }

      if (!account) {
        return res.render("forgot_password", {
          message: "Password reset token is invalid or has expired.",
        });
      }

      res.render("reset-password", { token: req.params.token, message: "" });
    }
  );
});

//Get Request for Contact Page
app.get("/contact", function (req, res) {
  if (req.session.isLoggedIn)
    res.render("contact", { status: 1, cart: userCart });
  else res.render("contact", { status: 0, cart: userCart });
});

//Get Request for Logout
app.get("/signOut", function (req, res) {
  req.session.destroy();
  res.redirect("/");
});

app.get("/delete_service", (req, res) => {
  const serviceId = req.query.serviceId;
  if (req.session.isLoggedIn) {
    Cart.findOneAndUpdate(
      { user: req.session.userId },
      { $pull: { items: { serviceId: serviceId } } },
      { new: true },
      (err, cart) => {
        if (err) {
          console.error(err);
          res.status(500).send("Internal Server Error.");
        } else {
          res.redirect("/cart");
        }
      }
    );
  } else {
    const cart = req.cookies.newcart || { items: [] };
    const itemIndex = cart.items.findIndex(
      (item) => item.serviceId == serviceId
    );
    if (itemIndex >= 0) {
      cart.items.splice(itemIndex, 1);
      res.cookie("newcart", cart);
      res.redirect("/cart");
    } else {
      res.status(400).send("Service not found in cart.");
      console.log("Service not found in cart.");
    }
  }
  // Perform the delete operation here
});

app.get("/add_address", (req, res) => {
  cities.find({}, "cityName", function (err, foundCities) {
    if (err) {
      console.log(err);
    } else {
      if (foundCities) {
        res.render("add_address", { cities: foundCities });
      } else {
        console.log("No cities found");
      }
    }
  });
});

app.get("/my-account", async function (req, res) {
  try {
    // Retrieve the user details from the database
    const foundUser = await user.findById(req.session.userId);

    res.render("my-account", {
      fullName: foundUser.fullName,
      emailAddress: foundUser.emailAddress,
      contact: foundUser.contact,
      address: foundUser.address,
      status: 1,
      cart: userCart,
    });
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

app.get("/my-orders", async function (req, res) {
  try {
    const orders = await Booking.find({
      customerId: req.session.userId,
    })
      .populate("serviceId", "name")
      .populate("serviceProviderId", "name")
      .exec();

    res.render("my-orders", {
      orders: orders,
      status: 1,
      cart: userCart,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

//Post Requests

//Post Request for Login Page
app.post("/login", function (req, res) {
  var email = req.body.email;
  var password = req.body.password;
  user.findOne({ emailAddress: email }, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        if (
          bcrypt.compareSync(password, foundUser.password) &&
          foundUser.isActive == true &&
          foundUser.userType == "63fa32a9d782b1c67dbfa2c5"
        ) {
          req.session.isLoggedIn = true;
          req.session.userId = foundUser.id;
          console.log(req.session.userId);
          req.session.emailAddress = foundUser.emailAddress;
          req.flash("success", "Logged in successfully.");
          res.redirect("/");
        } else if (foundUser.userType != "63fa32a9d782b1c67dbfa2c5") {
          console.log("Invalid User Type");
          res.render("login", { message: "You aren't a Customer" });
        } else {
          console.log("Invalid Password");
          res.render("login", { message: "Invalid Password" });
        }
      } else {
        console.log("Invalid Email");
        res.render("login", { message: "Invalid Email" });
      }
    }
  });
});

//Post Request for Register Page
app.post("/register", function (req, res) {
  var fullName = req.body.name;
  email = req.body.email;
  var password = req.body.password;
  var confirmPassword = req.body.confirmPassword;
  var contact = req.body.contact;

  user.findOne({ emailAddress: email }, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        console.log("Email already exists");
        res.render("login", { message: "Email already exists" });
      } else {
        if (password == confirmPassword) {
          var newUser = new user({
            fullName: fullName,
            emailAddress: email,
            password: password,
            contact: contact,
            isActive: true,
            userType: "63fa32a9d782b1c67dbfa2c5",
          });
          newUser.save(function (err) {
            if (err) {
              console.log(err);
            } else {
              console.log("User Created");
              res.redirect("/add_address");
            }
          });
        } else {
          console.log("Passwords don't match");
          res.redirect("/register");
        }
      }
    }
  });
});

//Post Request for Forgot Password Page
app.post("/forgot-password", (req, res, next) => {
  const { email } = req.body;

  user.findOne({ emailAddress: email }, (err, account) => {
    if (err) {
      return next(err);
    }

    if (!account) {
      return res.render("forgot_password", {
        message: "No account with that email address exists.",
      });
    }

    const token = crypto.randomBytes(20).toString("hex");

    account.resetPasswordToken = token;
    account.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    account.save((err) => {
      if (err) {
        return next(err);
      }

      const mailOptions = {
        to: account.emailAddress,
        from: "veeserveservies@gmail.com",
        subject: "Password Reset",
        text: `You are receiving this email because you (or someone else) has requested the reset of the password for your account.\n\n
          Please click on the following link, or paste this into your browser to complete the process:\n\n
          http://${req.headers.host}/reset-password/${token} \n\n
          If you did not request this, please ignore this email and your password will remain unchanged.\n`,
      };

      transporter.sendMail(mailOptions, (err) => {
        if (err) {
          return next(err);
        }

        res.render("forgot_password", {
          message:
            "An email has been sent to your email address with further instructions.",
        });
      });
    });
  });
});

//Post Request for Reset Password Page
app.post("/reset-password/:token", async (req, res, next) => {
  const { password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.render("reset-password", { message: "Passwords do not match." });
  }

  try {
    const account = await user.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!account) {
      return res.render("forgot_password", {
        message: "Password reset token is invalid or has expired.",
      });
    } else {
      account.password = password;
      account.resetPasswordToken = undefined;
      account.resetPasswordExpires = undefined;

      await account.save();
      res.render("reset-password", {
        message: "Your password has been reset successfully.",
        token: undefined,
      });
    }
  } catch (err) {
    return next(err);
  }
});

//Post Request for Contact Us Page
app.post("/contact-us", function (req, res) {
  const { name, email, message, subject } = req.body;

  // Create email content
  const mailOptions = {
    from: email, // replace with your email address
    to: "veeserveservices@gmail.com", // replace with your company's email address
    subject: subject,
    text: `This email was sent from: ${name} (${email})\n\n${message}`,
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
      // Send alert to client with error message
      res.send(
        '<script>alert("Failed to send email. Please try again."); window.location="/contact";</script>'
      );
    } else {
      console.log(`Email sent: ${info.response}`);
      // Send alert to client with success message
      res.send(
        '<script>alert("Thank you for contacting us. We will get back to you shortly."); window.location="/contact";</script>'
      );
    }
  });
});

//Post Request for Search
app.post("/search-service", function (req, res) {
  const serviceSearched = req.body.serviceSearched;

  // Query the database for service categories that match the search value
  serviceCategory
    .find({ categoryName: { $regex: serviceSearched, $options: "i" } })
    .then(function (categories) {
      // Generate the search results as HTML and send to the client
      const resultsHtml = categories
        .map(function (category) {
          return `<li><a href="/services/${category._id}" class="search-result">${category.categoryName}</a></li>`;
        })
        .join("");
      if (resultsHtml !== "") {
        res.send(`<ul class="dropdown-menu">${resultsHtml}</ul>`);
      } else {
        res.send("");
      }
    })
    .catch(function (err) {
      console.log(err);
      res.status(500).send("Error: could not retrieve search results.");
    });
});

app.post("/add-to-cart", function (req, res) {
  const serviceId = req.body.serviceId;
  const fromPage = req.body.fromPage;

  if (req.session.isLoggedIn && req.session.userId) {
    // If user is logged in, save cart to database
    const id = req.session.userId;
    const newCartItem = { serviceId: serviceId };
    Cart.findOne({ user: id })
      .then(function (foundCart) {
        if (foundCart) {
          // Cart already exists for user, update cart items
          const items = foundCart.items;
          items.push(newCartItem);
          foundCart.items = items;
          return foundCart.save();
        } else {
          // Cart does not exist for user, create new cart
          const cart = new Cart({
            user: id,
            items: [newCartItem],
          });
          return cart.save();
        }
      })
      .then(function (updatedCart) {
        userCart.items = updatedCart.items;
        console.log(userCart);
        res.redirect(fromPage);
      })
      .catch(function (err) {
        console.log(err);
        res.status(500).send("Error: could not access cart.");
      });
  } else {
    // If user is not logged in, save cart to session object
    const newCartItem = { serviceId: serviceId };
    let cart = req.cookies.newcart || { items: [] };
    cart.items.push(newCartItem);
    userCart.items = cart.items;
    res.cookie("newcart", cart, { maxAge: 86400000 });
    console.log(userCart);
    res.redirect(fromPage);
  }
});

app.post("/checkout", async function (req, res) {
  // Check if the user is logged in
  if (!req.session.isLoggedIn) {
    res.redirect("/cart?error=Please log in to proceed with checkout.");
    return;
  }

  // Get the selected date and time slots from the form data
  const selectedDates = req.body.dates;
  const selectedTimeSlots = req.body.timeslots;
  var i = 0;
  const assignedServiceAgents = new Set();

  console.log(selectedDates);
  console.log(selectedTimeSlots);

  // Get the service categories of the selected services
  const serviceIds = Object.keys(selectedDates);
  console.log(serviceIds);
  const serviceCategories = new Set();
  for (const serviceId of serviceIds) {
    const service = await services.findById(serviceId).populate("type");
    serviceCategories.add(service.type._id);
  }

  console.log(serviceCategories);
  // Check if all service agents serving the same category are available for the selected date and time slots
  // Check if all service agents serving the same category are available for the selected date and time slots
  let isAvailable = true;
  let unavailableServices = [];
  for (const serviceCategoryId of serviceCategories) {
    const serviceAgents = await ServiceAgent.find({
      serviceCategory: serviceCategoryId,
    });
    console.log("serviceCategoryId: " + serviceCategoryId);
    //console.log(serviceAgents);
    let isServiceCategoryAvailable = false;

    for (const serviceAgent of serviceAgents) {
      const { name, _id } = serviceAgent;

      // Find the service IDs for the current serviceCategoryId
      const serviceIdsForCategory = [];
      for (const id of serviceIds) {
        const service = await services.findById(id).populate("type");
        console.log(service);
        if (service.type._id.toString() === serviceCategoryId.toString()) {
          serviceIdsForCategory.push(id);
        }
      }

      let isServiceAgentAvailable = true;
      console.log("Service IDs for category: " + serviceIdsForCategory);

      for (const serviceId of serviceIdsForCategory) {
        const date = selectedDates[serviceId];
        const timeSlot = selectedTimeSlots[serviceId];
        console.log("Date: " + date + " Time: " + timeSlot);

        // Check if a booking already exists for the current serviceId, service agent, date, and time slot
        const booking = await Booking.findOne({
          serviceCategoryId: serviceCategoryId,
          serviceProviderId: _id,
          date: date,
          timeSlot: timeSlot,
        });

        if (booking) {
          isServiceAgentAvailable = false;
          break; // Exit the loop if the service agent is not available for any of the selected services
        }
      }

      if (isServiceAgentAvailable) {
        isServiceCategoryAvailable = true;
        assignedServiceAgents.add(_id);
        // Fetch the user's details from the users model
        const fetchedUser = await user.findById(req.session.userId);
        if (!fetchedUser) {
          res.redirect("/cart?error=User not found.");
          return;
        }

        for (const serviceId of serviceIdsForCategory) {
          const date = selectedDates[serviceId];
          const timeSlot = selectedTimeSlots[serviceId];
          console.log("Date: " + date + " Time: " + timeSlot);

          var price = await services.findById(serviceId, "price");
          // Assign each service to the available service agent of that category
          const newBooking = new Booking({
            serviceId: serviceIds[i],
            serviceCategoryId: serviceCategoryId, // Store the serviceCategoryId for the booking
            serviceProviderId: _id,
            customerId: req.session.userId,
            date: date,
            price: price.price,
            timeSlot: timeSlot,
            customerName: fetchedUser.fullName, // Fetch the user's name
            customerEmail: fetchedUser.emailAddress, // Fetch the user's email
            customerPhone: fetchedUser.contact, // Fetch the user's contact number
            status: "Yet To Serve",
          });
          await newBooking.save();
        }

        userCart = { items: [] };
        break;
      }
    }

    if (!isServiceCategoryAvailable) {
      isAvailable = false;
      unavailableServices.push(serviceCategoryId);
    }
    i++;
  }

  //Update the cart with the unavailable services and empty it once all services are booked
  if (unavailableServices.length > 0) {
    // Update the cart with the unavailable services
    await Cart.findOneAndUpdate(
      { user: req.session.userId },
      { $pull: { items: { serviceId: { $in: unavailableServices } } } },
      { new: true }
    );
    // Show a success message for the services whose orders are placed
    const availableServicesMessage = `The following services are successfully booked: ${Array.from(
      serviceCategories
    )
      .filter((category) => !unavailableServices.includes(category))
      .join(", ")}`;
    res.redirect(
      `/cart?success=${encodeURIComponent(
        availableServicesMessage
      )}&error=The following services are not available for the requested date and time slots: ${unavailableServices.join(
        ", "
      )}`
    );
  } else {
    // Empty the cart entry in the database once all services are booked
    await Cart.findOneAndUpdate({ user: req.session.userId }, { items: [] });
    // Redirect to the checkout success page
    res.send(
      '<script>alert("Order Placed Successfully."); window.location.href="/";</script>'
    );
  }
});

app.post("/my-account", async function (req, res) {
  try {
    const { fullName, emailAddress, contact, address } = req.body;

    // Update the user details in the database
    await user.findByIdAndUpdate(req.session.userId, {
      fullName: fullName,
      emailAddress: emailAddress,
      contact: contact,
      address: address,
    });

    res.redirect("/my-account");
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

app.post("/add_address", async function (req, res) {
  try {
    const { address, city, pin } = req.body;
    const cityData = await cities.findOne({ _id: city });
    const cityName = cityData ? cityData.cityName : "";

    var updatedAddress = `${address}, ${cityName}, ${pin}`;

    await user.updateOne(
      { emailAddress: email },
      {
        address: updatedAddress,
      }
    );
    res.redirect("/login");
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

app.put("/cancel-booking/:orderId", (req, res) => {
  const orderId = req.params.orderId;

  // Assuming you have a ServiceBooking model/schema defined
  Booking.findOneAndUpdate(
    { _id: orderId },
    { status: "Cancelled", serviceProviderId: null },
    { new: true }
  )
    .then((updatedBooking) => {
      if (updatedBooking) {
        // The booking was successfully updated
        res.json({ success: true });
      } else {
        // No booking found with the provided orderId
        res.status(404).json({ success: false, message: "Booking not found" });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "An error occurred while cancelling the booking",
      });
    });
});

//set up port to listen on port 3500
app.listen(3500, function () {
  console.log("Server started on port 3500");
});

const path = require("path");
const fs = require("fs");
const https = require("https");

require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

const errorController = require("./controllers/error");

const User = require("./models/user");

const MONGODB_URL = `mongodb+srv://${process.env.MONGODB_ATLAS_USER}:${process.env.MONGODB_ATLAS_PASSWORD}@aiva-shop.nfxlb6u.mongodb.net/${process.env.MONGODB_ATLAS_DB_NAME}`;

const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URL,
  collection: "sessions",
});

// const winston = require('winston')
// const expressWinston = require('express-winston');

// const myFormat = winston.format.printf(({ level, message, timestamp }) => {
//   return `${level}: ${timestamp}  ${message}`;
// });

// app.use(expressWinston.logger({
//   transports: [
//     new winston.transports.Console()
//   ],
//   format: winston.format.combine(
//     winston.format.colorize({
//       colors: { info: 'blue', error: 'red' },
//       all: true,
//     }),
//     winston.format.timestamp({
//       format: 'DD/MM/YYYY [at] HH:mm:ss'
//     }),
//     myFormat
//   ),
//   colorize: true,
//   meta: false,
// }));

const csrfProtection = csrf();


const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// template engine config

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);

app.use(helmet());
app.use(compression());
app.use(morgan("combined", { stream: accessLogStream }));

// Middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);
app.use(csrfProtection);
app.use(flash());

// get user from session and add to every request
app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }

      req.user = user;
      next();
    })
    .catch((err) => {
      next(new Error(err));
    });
});

// add global variables to views
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

// handle error page
app.get("/500", errorController.get500);
app.use(errorController.get404);

// error middleware
app.use((error, req, res, next) => {
  res.redirect("/500");
});

const PORT = process.env.PORT || 3000;

async function main() {
  try {
    await mongoose.connect(MONGODB_URL);
    app.listen(PORT, () => {
      console.log(`Listening on ${PORT}`);
    });
  } catch (err) {
    console.log(err);
  }
}

main();

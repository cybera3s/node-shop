const express = require("express");
const { check, body } = require("express-validator");

const authController = require("../controllers/auth");
const User = require("../models/user");

const router = express.Router();

router.get("/login", authController.getLogin);

router.post("/login", [
  body('email', "Please enter a valid email")
  .isEmail()
  .normalizeEmail({"gmail_remove_dots": false }),
  body('password', "Please enter a valid password with at least 4 characters.")
  .isLength({min: 4})
  .trim()
], 
authController.postLogin);

router.get("/signup", authController.getSignUp);

router.post(
  "/signup",
  [
    check("email", "Please Enter a Valid Email")
      .isEmail()
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject("E-Mail Already exists!");
          }
        });
      }).
      normalizeEmail({"gmail_remove_dots": false }),
    body(
      "password",
      "Please Enter a password with at least 4 characters."
    ).isLength({ min: 4 })
    .trim(),
    body("confirmPassword")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords have to match!");
      }
      return true;
    })
    .trim(),
  ],
  authController.postSignUp
);

router.get("/logout", authController.getLogout);

router.get("/reset", authController.getReset);

router.post("/reset", authController.postReset);

router.get("/reset/:token", authController.getNewPassword);

router.post("/new-password", authController.postNewPassword);

module.exports = router;

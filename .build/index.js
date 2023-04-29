"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var import_koa = __toESM(require("koa"));
var import_cors = __toESM(require("@koa/cors"));
var import_koa_router = __toESM(require("koa-router"));
var import_koa_bodyparser = __toESM(require("koa-bodyparser"));
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var import_mongoose = __toESM(require("mongoose"));
var import_bcrypt = __toESM(require("bcrypt"));
const app = new import_koa.default();
const router = new import_koa_router.default();
app.use((0, import_cors.default)());
app.use((0, import_koa_bodyparser.default)());
app.use(router.routes());
const mongo = process.env["mongo"];
import_mongoose.default.connect(mongo, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const verifyToken = async (ctx, next) => {
  const authHeader = ctx.request.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    ctx.status = 401;
    ctx.body = { message: "Authentication failed" };
    return;
  }
  try {
    const decodedToken = import_jsonwebtoken.default.verify(token, secret);
    ctx.state.user = decodedToken;
    await next();
  } catch (err) {
    ctx.status = 401;
    ctx.body = { message: "Authentication failed" };
  }
};
const userSchema = new import_mongoose.default.Schema({
  email: String,
  username: String,
  password: String,
  staff: Boolean
});
const User = import_mongoose.default.model("User", userSchema);
router.post("/addUser", async (ctx) => {
  const { email, username, password, staff } = ctx.request.body;
  const saltRounds = 10;
  const hashedPassword = await import_bcrypt.default.hash(password, saltRounds);
  const user = new User({
    email,
    username,
    password: hashedPassword,
    staff
  });
  try {
    await user.save();
    ctx.status = 201;
    ctx.body = user;
  } catch (err) {
    ctx.status = 400;
    ctx.body = { message: err.message };
  }
});
const secret = "my_secret_key";
router.post("/Login", async (ctx) => {
  const { email, password } = ctx.request.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      ctx.status = 401;
      ctx.body = { message: "Authentication failed" };
      return;
    }
    const isPasswordCorrect = await import_bcrypt.default.compare(password, user.password);
    if (!isPasswordCorrect) {
      ctx.status = 401;
      ctx.body = { message: "Authentication failed" };
      return;
    }
    const token = import_jsonwebtoken.default.sign({ sub: user.id }, secret);
    ctx.body = {
      token,
      user: {
        email: user.email,
        username: user.username,
        _id: user._id,
        staff: user.staff
      }
    };
  } catch (err) {
    ctx.status = 500;
    ctx.body = { message: err.message };
  }
});
const port = process.env.PORT || 3e3;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
const catListSchema = new import_mongoose.default.Schema({
  cat_name: String,
  age: Number,
  breed: String,
  gender: String,
  location: String,
  describe: String,
  image: String
});
const CatList = import_mongoose.default.model("CatList", catListSchema);
router.get("/catList", async (ctx) => {
  try {
    const { location, gender, breed } = ctx.query;
    let query = CatList.find();
    if (location) {
      query = query.where("location").equals(location);
    }
    if (gender) {
      query = query.where("gender").equals(gender);
    }
    if (breed) {
      query = query.where("breed").equals(breed);
    }
    const catList = await query.limit(5).exec();
    ctx.body = catList;
  } catch (err) {
    ctx.status = 500;
    ctx.body = { message: err.message };
  }
});
router.post("/AddCat", async (ctx) => {
  const { cat_name, age, breed, gender, location, describe, image } = ctx.request.body;
  const cat = new CatList({
    cat_name,
    age,
    breed,
    gender,
    location,
    describe,
    image
  });
  try {
    await cat.save();
    ctx.status = 201;
    ctx.body = cat;
  } catch (err) {
    ctx.status = 400;
    ctx.body = { message: err.message };
  }
});
router.put("/updateCat/:id", async (ctx) => {
  const { id } = ctx.params;
  const { cat_name, age, breed, gender, location, describe, image } = ctx.request.body;
  try {
    const cat = await CatList.findByIdAndUpdate(id, {
      cat_name,
      age,
      breed,
      gender,
      location,
      describe,
      image
    }, { new: true });
    if (!cat) {
      ctx.status = 404;
      ctx.body = { message: "Cat not found" };
      return;
    }
    ctx.body = cat;
  } catch (err) {
    ctx.status = 400;
    ctx.body = { message: err.message };
  }
});
router.delete("/delCat/:id", async (ctx) => {
  const { id } = ctx.params;
  try {
    const cat = await CatList.findByIdAndDelete(id);
    if (!cat) {
      ctx.status = 404;
      ctx.body = { message: "Cat not found" };
      return;
    }
    ctx.body = cat;
  } catch (err) {
    ctx.status = 400;
    ctx.body = { message: err.message };
  }
});
const messageSchema = new import_mongoose.default.Schema({
  user_id: String,
  content: String,
  read: Boolean
});
const Message = import_mongoose.default.model("Message", messageSchema);
router.post("/addMessages", async (ctx) => {
  const { user_id, content, read } = ctx.request.body;
  const message = new Message({
    user_id,
    content,
    read
  });
  try {
    await message.save();
    ctx.status = 201;
    ctx.body = message;
  } catch (err) {
    ctx.status = 400;
    ctx.body = { message: err.message };
  }
});
router.get("/messages", async (ctx) => {
  try {
    const messages = await Message.find().limit(10);
    ctx.body = messages;
  } catch (err) {
    ctx.status = 500;
    ctx.body = { message: err.message };
  }
});
router.put("/updateMessages/:id", async (ctx) => {
  const { id } = ctx.params;
  const { user_id, content, read } = ctx.request.body;
  try {
    const message = await Message.findByIdAndUpdate(id, {
      user_id,
      content,
      read
    });
    if (!message) {
      ctx.status = 404;
      ctx.body = { message: "Message not found" };
    } else {
      ctx.body = message;
    }
  } catch (err) {
    ctx.status = 500;
    ctx.body = { message: err.message };
  }
});
router.delete("/delMessages/:id", async (ctx) => {
  const { id } = ctx.params;
  try {
    const message = await Message.findByIdAndDelete(id);
    if (!message) {
      ctx.status = 404;
      ctx.body = { message: "Message not found" };
    } else {
      ctx.body = { message: "Message deleted successfully" };
    }
  } catch (err) {
    ctx.status = 500;
    ctx.body = { message: err.message };
  }
});
const staffCodeSchema = new import_mongoose.default.Schema({
  staff_id: String
});
const StaffCode = import_mongoose.default.model("StaffCode", staffCodeSchema);
router.get("/staffCode/:id", async (ctx) => {
  const { id } = ctx.params;
  try {
    const staffCode = await StaffCode.findById(id);
    if (!staffCode) {
      ctx.status = 404;
      ctx.body = { message: "StaffCode not found" };
    } else {
      ctx.body = staffCode;
    }
  } catch (err) {
    ctx.status = 500;
    ctx.body = { message: err.message };
  }
});
router.post("/addStaffCode", async (ctx) => {
  const { staff_id } = ctx.request.body;
  const staffCode = new StaffCode({
    staff_id
  });
  try {
    await staffCode.save();
    ctx.status = 201;
    ctx.body = staffCode;
  } catch (err) {
    ctx.status = 400;
    ctx.body = { message: err.message };
  }
});
const favouriteSchema = new import_mongoose.default.Schema({
  user_id: String,
  cat_id: String
});
const Favourite = import_mongoose.default.model("Favourite", favouriteSchema);
router.post("/addFavourites", async (ctx) => {
  const { user_id, cat_id } = ctx.request.body;
  const favourite = new Favourite({
    user_id,
    cat_id
  });
  try {
    await favourite.save();
    ctx.status = 201;
    ctx.body = favourite;
  } catch (err) {
    ctx.status = 400;
    ctx.body = { message: err.message };
  }
});
router.get("/favourites/:user_id", async (ctx) => {
  const { user_id } = ctx.params;
  try {
    const favourites = await Favourite.find({ user_id });
    ctx.body = favourites;
  } catch (err) {
    ctx.status = 500;
    ctx.body = { message: err.message };
  }
});
router.delete("/delFavourites/:user_id/:cat_id", async (ctx) => {
  const { user_id, cat_id } = ctx.params;
  try {
    const favourite = await Favourite.findOneAndDelete({ user_id, cat_id });
    if (!favourite) {
      ctx.status = 404;
      ctx.body = { message: "Favourite not found" };
    } else {
      ctx.body = { message: "Favourite deleted successfully" };
    }
  } catch (err) {
    ctx.status = 500;
    ctx.body = { message: err.message };
  }
});
//# sourceMappingURL=index.js.map

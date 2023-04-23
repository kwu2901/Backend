import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';

const app = new Koa();
const router = new Router();

app.use(bodyParser());
app.use(router.routes());

import mongoose from 'mongoose';

mongoose.connect('mongodb+srv://root:root@cluster.zciveax.mongodb.net/cat_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

/////////////////Users/////////////////
const userSchema = new mongoose.Schema({
  name: String,
  pw: String,
  staff: Boolean,
});

const User = mongoose.model('User', userSchema);

router.post('/addUser', async (ctx) => {
  const { name, pw, staff } = ctx.request.body;

  const user = new User({
    name,
    pw,
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

import jwt from 'jsonwebtoken';

const secret = 'my_secret_key';

router.post('/login', async (ctx) => {
  const { name, pw } = ctx.request.body;

  const user = await User.findOne({ name, pw });

  if (!user) {
    ctx.status = 401;
    ctx.body = { message: 'Authentication failed' };
    return;
  }

  const token = jwt.sign({ sub: user.id }, secret);

  ctx.body = { token };
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

/////////////////catList/////////////////
const catListSchema = new mongoose.Schema({
  cat_name: String,
  age: Number,
  gender: String,
  location: String,
  describe: String,
  image: String,
});

const CatList = mongoose.model('CatList', catListSchema);

router.get('/catList', async (ctx) => {
  try {
    const catList = await CatList.find().limit(50); // Fetch first 5 cats
    ctx.body = catList;
  } catch (err) {
    ctx.status = 500;
    ctx.body = { message: err.message };
  }
});

router.post('/AddCat', async (ctx) => {
  const { cat_name, age, gender, location, describe, image } = ctx.request.body;

  const cat = new CatList({
    cat_name,
    age,
    gender,
    location,
    describe,
    image,
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

router.put('/updateCat/:id', async (ctx) => {
  const { id } = ctx.params;
  const { cat_name, age, gender, location, describe, image } = ctx.request.body;

  try {
    const cat = await CatList.findByIdAndUpdate(id, {
      cat_name,
      age,
      gender,
      location,
      describe,
      image,
    }, { new: true });

    if (!cat) {
      ctx.status = 404;
      ctx.body = { message: 'Cat not found' };
      return;
    }

    ctx.body = cat;
  } catch (err) {
    ctx.status = 400;
    ctx.body = { message: err.message };
  }
});

router.delete('/delCat/:id', async (ctx) => {
  const { id } = ctx.params;

  try {
    const cat = await CatList.findByIdAndDelete(id);

    if (!cat) {
      ctx.status = 404;
      ctx.body = { message: 'Cat not found' };
      return;
    }

    ctx.body = cat;
  } catch (err) {
    ctx.status = 400;
    ctx.body = { message: err.message };
  }
});

/////////////////messageList/////////////////
const messageSchema = new mongoose.Schema({
  user_id: String,
  content: String,
  read: Boolean,
});

const Message = mongoose.model('Message', messageSchema);

router.post('/addMessages', async (ctx) => {
  const { user_id, content, read } = ctx.request.body;

  const message = new Message({
    user_id,
    content,
    read,
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

router.get('/messages', async (ctx) => {
  try {
    const messages = await Message.find().limit(10);
    ctx.body = messages;
  } catch (err) {
    ctx.status = 500;
    ctx.body = { message: err.message };
  }
});

router.put('/updateMessages/:id', async (ctx) => {
  const { id } = ctx.params;
  const { user_id, content, read } = ctx.request.body;

  try {
    const message = await Message.findByIdAndUpdate(id, {
      user_id,
      content,
      read,
    });

    if (!message) {
      ctx.status = 404;
      ctx.body = { message: 'Message not found' };
    } else {
      ctx.body = message;
    }
  } catch (err) {
    ctx.status = 500;
    ctx.body = { message: err.message };
  }
});

router.delete('/delMessages/:id', async (ctx) => {
  const { id } = ctx.params;

  try {
    const message = await Message.findByIdAndDelete(id);

    if (!message) {
      ctx.status = 404;
      ctx.body = { message: 'Message not found' };
    } else {
      ctx.body = { message: 'Message deleted successfully' };
    }
  } catch (err) {
    ctx.status = 500;
    ctx.body = { message: err.message };
  }
});

/////////////////staffCode/////////////////
const staffCodeSchema = new mongoose.Schema({
  staff_id: String,
});

const StaffCode = mongoose.model('StaffCode', staffCodeSchema);

router.get('/staffCode/:id', async (ctx) => {
  const { id } = ctx.params;

  try {
    const staffCode = await StaffCode.findById(id);

    if (!staffCode) {
      ctx.status = 404;
      ctx.body = { message: 'StaffCode not found' };
    } else {
      ctx.body = staffCode;
    }
  } catch (err) {
    ctx.status = 500;
    ctx.body = { message: err.message };
  }
});

router.post('/AddStaffCode', async (ctx) => {
  const { staff_id } = ctx.request.body;

  const staffCode = new StaffCode({
    staff_id,
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

/////////////////favourites/////////////////
const favouriteSchema = new mongoose.Schema({
  user_id: String,
  cat_id: String,
});

const Favourite = mongoose.model('Favourite', favouriteSchema);

router.post('/addFavourites', async (ctx) => {
  const { user_id, cat_id } = ctx.request.body;

  const favourite = new Favourite({
    user_id,
    cat_id,
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

router.get('/favourites/:user_id', async (ctx) => {
  const { user_id } = ctx.params;

  try {
    const favourites = await Favourite.find({ user_id });

    ctx.body = favourites;
  } catch (err) {
    ctx.status = 500;
    ctx.body = { message: err.message };
  }
});

router.delete('/delFavourites/:user_id/:cat_id', async (ctx) => {
  const { user_id, cat_id } = ctx.params;

  try {
    const favourite = await Favourite.findOneAndDelete({ user_id, cat_id });

    if (!favourite) {
      ctx.status = 404;
      ctx.body = { message: 'Favourite not found' };
    } else {
      ctx.body = { message: 'Favourite deleted successfully' };
    }
  } catch (err) {
    ctx.status = 500;
    ctx.body = { message: err.message };
  }
});

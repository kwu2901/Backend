import Koa from 'koa';
import cors from '@koa/cors';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const app = new Koa();
const router = new Router();

// enable CORS for all routes
app.use(cors());

app.use(bodyParser());
app.use(router.routes());

const mongo = process.env['mongo']
mongoose.connect(mongo, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Verify token middleware
const verifyToken = async (ctx: Koa.Context, next: Koa.Next) => {
  // Get the token from the Authorization header
  const authHeader = ctx.request.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // If the token is missing, return an error
    ctx.status = 401;
    ctx.body = { message: 'Authentication failed' };
    return;
  }

  try {
    // Verify the JWT token
    const decodedToken = jwt.verify(token, secret);
    // Attach the decoded token to the context for later use
    ctx.state.user = decodedToken;
    // Call the next middleware function
    await next();
  } catch (err) {
    // If the token is invalid, return an error
    ctx.status = 401;
    ctx.body = { message: 'Authentication failed' };
  }
};

/////////////////Users/////////////////
const userSchema = new mongoose.Schema({
  email: String,
  username: String,
  password: String,
  staff: Boolean,
});

const User = mongoose.model('User', userSchema);

router.post('/addUser', async (ctx) => {
  const { email, username, password, staff } = ctx.request.body;
  const saltRounds = 10;

  // Hash the password before saving to the database
  const hashedPassword = await bcrypt.hash(password, saltRounds);

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

const secret = 'my_secret_key';

router.post('/Login', async (ctx) => {
  const { email, password } = ctx.request.body;

  try {
    // Find the user with the provided email
    const user = await User.findOne({ email });

    if (!user) {
      // If the user does not exist, return an error
      ctx.status = 401;
      ctx.body = { message: 'Authentication failed' };
      return;
    }

    // Compare the password with the hashed password in the database
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      // If the password is incorrect, return an error
      ctx.status = 401;
      ctx.body = { message: 'Authentication failed' };
      return;
    }
    // Generate a JWT token for the user
    const token = jwt.sign({ sub: user.id }, secret);

    // Return the user and token in the response
    ctx.body = {
      token,
      user: {
        email: user.email,
        username: user.username,
        _id: user._id,
        staff: user.staff,
      },
    };
  } catch (err) {
    ctx.status = 500;
    ctx.body = { message: err.message };
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

/////////////////catList/////////////////
const catListSchema = new mongoose.Schema({
  cat_name: String,
  age: Number,
  breed: String,
  gender: String,
  location: String,
  describe: String,
  image: String,
});

const CatList = mongoose.model('CatList', catListSchema);

router.get('/catList', async (ctx) => {
  try {
    const { location, gender, breed } = ctx.query;

    let query = CatList.find();

    // Apply filters based on query parameters
    if (location) {
      query = query.where('location').equals(location);
    }
    if (gender) {
      query = query.where('gender').equals(gender);
    }
    if (breed) {
      query = query.where('breed').equals(breed);
    }

    const catList = await query.limit(5).exec(); // Fetch first 5 cats matching the filters
    ctx.body = catList;
  } catch (err) {
    ctx.status = 500;
    ctx.body = { message: err.message };
  }
});

router.post('/AddCat', async (ctx) => {
  const { cat_name, age, breed, gender, location, describe, image } = ctx.request.body;

  const cat = new CatList({
    cat_name,
    age,
    breed,
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
  const { cat_name, age, breed, gender, location, describe, image } = ctx.request.body;

  try {
    const cat = await CatList.findByIdAndUpdate(id, {
      cat_name,
      age,
      breed,
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

router.post('/addStaffCode', async (ctx) => {
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

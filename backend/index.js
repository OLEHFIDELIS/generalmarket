const express = require("express");
const app = express();
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
require("dotenv").config();
const port = process.env.PORT || 4000;
const jwt = require("jsonwebtoken");

const Product = require("./schema/product");
const User = require("./schema/user");

const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(cors());
app.use("/images", express.static("uploads/images"));
app.use(express.urlencoded({ extended: true }));

// ✅ Connect to MongoDB
mongoose
  .connect(
    `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASWORD}@cluster0.1fb4jph.mongodb.net/e-commerce`
  )
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));

// ✅ Root route
app.get("/", (req, res) => {
  res.send("Server running successfully 🚀");
});

// ✅ Multer Storage Configuration

// helper to sanitize filenames
function safeFilename(originalName) {
  const ext = path.extname(originalName).toLowerCase();         // keep extension
  const name = path.basename(originalName, ext)
    .replace(/\s+/g, "_")              // spaces -> _
    .replace(/[^\w-_]/g, "")           // remove non-alphanum except - and _
    .slice(0, 120);                    // limit length
  return `${Date.now()}-${name}${ext}`;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "uploads/images");
    // ensure folder exists
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, safeFilename(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error("Only images allowed"));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// ✅ Upload Multiple Images Endpoint
app.post("/upload", upload.array("images", 12), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: "No files uploaded" });
  }

  const imageUrls = req.files.map(
    (file) => `http://localhost:${PORT}/images/${file.filename}`
  );


    res.json({ success: true, urls: imageUrls});
})
// ✅ Create Product Endpoint
app.post("/addproduct", async (req, res) => {
  try {
    const products = await Product.find({});
    const newId =
      products.length > 0 ? products[products.length - 1].id + 1 : 1;

    const {
      category,
      title,
      description,
      price,
      transaction,
      condition,
      region,
      city,
      address,
      zip,
      phone,
      email,
      images,
    } = req.body;

    const product = new Product({
      id: newId,
      category,
      title,
      description,
      price,
      transaction,
      condition,
      region,
      city,
      address,
      zip,
      phone,
      email,
      images, // Already URLs from frontend
      createdAt: new Date(),
      available: true,
    });
    await product.save();

    res.json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (err) {
    console.error("❌ Error creating product:", err.message);
    res.status(500).json({ success: false });
  }
});


// Creating API For Delete
app.post("/removeproduct", async (req, res)=> {
    await Product.findOneAndDelete({id: req.body.id});
    console.log("Removed")
    res.json({
        success: true,
        name: req.body.name
    })
});

// Creating Api For Getting All Product
app.get("/allproduct", async(req, res)=> {
    let products = await Product.find({});
    console.log("all product fetched");
    res.send(products);
})

// Create User Api 
app.post("/signup", async(req, res)=> {
    let check = await User.findOne({email: req.body.email});
    if (check) {
        return res.status(400).json({success: false, errors: "email address already exist"})
    }
    let cart = {};
    for (let i = 0; i < 300; i++) {
        cart[i] = 0;
    }
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        cart: cart
    });

    await user.save();

    const data = {
        user: {
            id: user.id
        }
    }

    const token =  jwt.sign(data, "secret_ecom");
    res.json({success: true, token})
});

// User login Api
app.post("/login", async(req, res)=> {
    let user = await User.findOne({email: req.body.email});
    if (user) {
        const passConpere = req.body.password === user.password;
        if (passConpere) {
            const data = {
                user: {
                    id: user.id
                }
            }
            const token = jwt.sign(data, "secret_ecom");
            res.json({success: true, token});
        }else{
            res.json({success: false, error: "Password or Username is Incorrect "})
        }
    }else{
        res.json({success: false, error: "Wrong Email or Password"})
    }
});

// creating endpint point for newCollection data 
app.get("/newcollection", async(req,res)=> {
    let product = await Product.find({});
    let newcollection = product.slice(1).slice(-8);
    console.log("New Collection Fetched");
    res.send(newcollection);
});

// Creating Endpoint For Purpular_in_women Data
app.get("/popularinwomen", async(req, res)=>{
    let product = await Product.find({category:"women"});
    let popular_in_women = product.slice(0,4);
    console.log("Popular in Women Fetched");
    res.send(popular_in_women)
});

// Creating middleware to fetch user 
const fetchUser = async(req, res, next)=> {
    const token = req.header("auth-token");
    if (!token) {
        res.status(401).send({errors: "Please Authenticate using Valid Token "})
    }else{
        try {
            const data = jwt.verify(token, "secret_ecom");
            req.user = data.user;
            next();
        } catch (error) {
            res.status(401).send({errors: "please authenticate using a valid token"})
        }
    }
}

// Creating Endpoint for Cart Iterms 
app.post("/addtocart",fetchUser, async(req,res)=> {
    console.log("Added", req.body.itemId)
    let userData = await User.findOne({_id: req.user.id});
    userData.cart[req.body.itemId] += 1;
    await User.findOneAndUpdate({_id: req.user.id}, {cart: userData.cart});
    res.send("Added")
});

// Creating Endpoint To Remove cart item
app.post("/removefromcart",fetchUser, async(req,res)=> {
    console.log("Removed", req.body.itemId)
    let userData = await User.findOne({_id: req.user.id});
    if(userData.cart[req.body.itemId])
    userData.cart[req.body.itemId] -= 1;
    await User.findOneAndUpdate({_id: req.user.id}, {cart: userData.cart});
    res.send("Removed")
});

// Creating Endpoint To Get User Cart
app.get("/getcart", fetchUser, async (req, res) => {
    try {
        let userData = await User.findOne({ _id: req.user.id });
        res.json({ cartData: userData.cart });
    } catch (error) {
        console.error("Error fetching cart:", error.message);
        res.status(500).json({ error: "Server error fetching cart" });
    }
});

app.get("/related-products/:id", async (req, res) => {
  try {
    const productId = req.params.id;

    // 1) Get the current product
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const category = product.category;
    const price = product.price;

    // 2) Price range logic (±20%)
    const minPrice = price * 0.8;
    const maxPrice = price * 1.2;

    // 3) Fetch products matching category + price range
    let relatedProducts = await Product.find({
      _id: { $ne: productId },         // exclude current product
      category: category,              // same category
      price: { $gte: minPrice, $lte: maxPrice } // price range
    });

    // 4) Random shuffle
    relatedProducts = relatedProducts.sort(() => 0.5 - Math.random());

    // 5) Limit results (example: show only 6)
    relatedProducts = relatedProducts.slice(0, 6);

    res.json(relatedProducts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.listen(port, (error)=> {     
    if (!error) {
       console.log(`Connection sucesfuly on ${port}`)  
    }else{
        console.log("error: "+error)
    }
})

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
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
// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"), // folder to save files
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname) // unique name
});

// Only allow image files
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (mimetype && extname) cb(null, true);
  else cb(new Error("Only images are allowed"));
};

// Initialize multer
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max per file
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
    console.log("Request Body:", req.body);
  try {
    const products = await Product.find({});
    const newId = products.length > 0 ? products[products.length - 1].id + 1 : 1;

    const {
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
      category,
      images,
    } = req.body;
    const product = new Product({
      id: newId,
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
      category,
      images,// this will be an array of URLs from /upload
      createdAt: new Date(),
    });

    console.log(req.body);
    await product.save();

    res.json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (err) {
    console.error("❌ Error creating product:", err.message);
    res.status(500).json({ success: false, message: "Server Error" });
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

app.listen(port, (error)=> {     
    if (!error) {
       console.log(`Connection sucesfuly on ${port}`)  
    }else{
        console.log("error: "+error)
    }
})

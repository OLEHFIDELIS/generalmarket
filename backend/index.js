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

const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary");

const Product = require("./schema/product");
const User = require("./schema/user");



// Middleware
app.use(express.static(path.join(__dirname, "../frontend/build")));
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

// // ✅ Root route
// app.get("/", (req, res) => {
//   res.send("Server running successfully 🚀");
// });


// --------------------------------------------------
// 📌 MULTER & CLOUDINARY SETUP
// -----------------------------------------
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "generalmarket",
    allowed_formats: ["jpg", "jpeg", "png", "gif"],
    transformation: [{ width: 1000, height: 1000, crop: "limit" }]
  }
});

const upload = multer({ storage });


// -----------------------------------------
// 📌 UPLOAD IMAGES (CLOUDINARY)
// -----------------------------------------
app.post("/upload", upload.array("images", 12), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }

    // Cloudinary returns full URL in file.path
    const imageUrls = req.files.map((file) => file.path);

    return res.json({ success: true, urls: imageUrls });
  } catch (error) {
    console.error("Upload Error:", error);
    return res.status(500).json({ success: false, message: "Upload failed" });
  }
});


// -----------------------------------------
// 📌 CREATE PRODUCT
// -----------------------------------------
app.post("/addproduct", async (req, res) => {
  try {
    const products = await Product.find({});
    const newId = products.length > 0 ? products[products.length - 1].id + 1 : 1;

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
      images
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
      images, // Cloudinary URLs from frontend
      createdAt: new Date(),
      available: true
    });

    await product.save();

    res.json({
      success: true,
      message: "Product created successfully",
      product
    });
  } catch (err) {
    console.error("❌ Error creating product:", err.message);
    res.status(500).json({ success: false });
  }
});


// Creating API For Delete
app.post("/removeproduct", async (req, res) => {
    try {
    const { id } = req.body;

    // 1️⃣ Find product first
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // 2️⃣ Delete image from Cloudinary
    if (product.cloudinary_id) {
      await cloudinary.uploader.destroy(product.cloudinary_id);
      console.log("Cloudinary image deleted");
    }

    // 3️⃣ Delete product from DB
    await Product.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: "Product deleted successfully",
    });

  } catch (error) {
    console.error("REMOVE PRODUCT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
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
    res.send(newcollection);
});

// Creating Endpoint For Purpular_in_women Data
app.get("/popular", async(req, res)=>{
    let popularProducts = await Product.find({}).limit(4);
    res.send(popularProducts)
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

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const category = product.category.trim();
  const price = product.price;

  const minPrice = price * 0.8;
  const maxPrice = price * 1.2;

  // 🔥 Regex-based category match (case-insensitive, whitespace-safe)
  let relatedProducts = await Product.find({
    _id: { $ne: product._id },
    category: { $regex: `^${category}$`, $options: "i" },
    price: { $gte: minPrice, $lte: maxPrice }
  }).limit(6);

  // Fallback: category only
  if (relatedProducts.length === 0) {
    relatedProducts = await Product.find({
      _id: { $ne: product._id },
      category: { $regex: `^${category}$`, $options: "i" }
    }).limit(6);
  }

  // Final fallback
  if (relatedProducts.length === 0) {
    relatedProducts = await Product.find({
      _id: { $ne: product._id }
    }).limit(6);
  }

  res.json(relatedProducts);

} catch (error) {
  console.error("Related products error:", error);
  res.status(500).json({ message: "Server error" });
}
});

app.use((req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/build/index.html")
  );
});

app.listen(port, (error)=> {     
    if (!error) {
       console.log(`Connection sucesfuly on ${port}`)  
    }else{
        console.log("error: "+error)
    }
})

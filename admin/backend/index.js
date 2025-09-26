const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt  = require("jsonwebtoken");
const multer = require("multer");
require("dotenv").config();


const path =  require("path");
const cors = require("cors");
const { error } = require("console");
const Product  = require("./schema/product");
const User = require("./schema/user");

app.use(express.json());
app.use(cors());
app.use("/images", express.static("uploads/images"))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection With MongoDB
mongoose.connect(`mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASWORD}@cluster0.1fb4jph.mongodb.net/e-commerce`)
.then(() => {
  console.log("✅ MongoDB Connected");
}).catch((err) => {
  console.error("❌ MongoDB connection error:", err.message);
});
// mongoose.connect("mongodb+srv://olehfidelis:360940@cluster0.1fb4jph.mongodb.net/e-commerce");

app.get("/", (req, res)=>{
    res.send("Express App Is Running")
})


const storage = multer.diskStorage({
    destination: "./uploads/images",
    filename:(req, file, cb)=>{
        cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
});
const upload = multer({storage: storage});



// Creating Upload Endpoint For Images

app.post("/upload", upload.single("product"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: 0,
            message: "No file uploaded. Make sure the field name is 'product'."
        });
    }

    res.json({
        success: 1,
        img_url: `http://localhost:${port}/images/${req.file.filename}`
    });
});


// Api to Create product
app.post("/addproduct", async(req, res)=>{
    const products = await Product.find({});
    let id;
    if(products.length > 0){
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id+1
    }else{
        id = 1
    }
    const product = new Product({
        id: id,
        name: req.body.name,
        image: req.body.image,
        category: req.body.category,
        new_price: req.body.new_price,
        old_price: req.body.old_price
    });
    console.log(product);
    await product.save();
    console.log("Saved");
    res.json({
        success: true,
        name: req.body.name,

    })
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

const Product = require("../models/Product");

// GET /products/:id/related
exports.getRelatedProducts = async (req, res) => {
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
};
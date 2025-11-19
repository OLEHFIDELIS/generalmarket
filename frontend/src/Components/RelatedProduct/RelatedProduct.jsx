import React from "react";
import "./RelatedProduct.css";
import data_product from "../Assets/data";
import Item from "../Items/Item";

const RelatedProduct = () => {
  return (
    <div className="relatedproducts">
      <h1>Related Products</h1>
      <hr />
      <div className="relatedproducts-item">
        {data_product.map((item, i) => (
          <Item
            key={i}
            id={item.id}
            name={item.title}        // Correct if your data uses "title"
            image={item.images}      // Should be "image", not "images" unless Item accepts "images"
            new_price={item.price}   // Correct if API returns "price"
            old_price={item.old_price || null}
          />
        ))}
      </div>
    </div>
  );
};

export default RelatedProduct;
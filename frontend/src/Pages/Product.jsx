import React, { useContext } from "react";
import "./CSS/Product.css";
import { ShopContext } from "../Context/ShopContex";
import { useParams } from 'react-router-dom';
import Breadcrum from "../Components/Breadcrums/Breadcrum";
import ProductDisplay from "../Components/ProductDisplay/ProductDisplay";
import DescribtionBox from "../Components/DescribtionBox/DescribtionBox";
import RelatedProduct from "../Components/RelatedProduct/RelatedProduct";



const Product = ()=> {
    const {all_product} = useContext(ShopContext);
    const { productId } = useParams();
    
    // ⚠️ SAFE FIND (supports id + _id)
    const product = all_product.find(
    (p) => String(p._id) === productId || p.id === Number(productId)
    );

    if (!product){
        return null;
    }

    return(
        <div className="">
            <Breadcrum product={product}/>
            <ProductDisplay product={product}/>
            <RelatedProduct productId={product._id} />
        </div>
    )
}; 


export default Product;
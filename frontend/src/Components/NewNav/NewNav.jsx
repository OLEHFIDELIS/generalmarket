import React, {useContext, useRef, useState} from "react";
import "./NewNav.css"
import logo from "../Assets/gmarketlogo.png"
import cart_icon from "../Assets/cart_icon.png"
import {Link} from "react-router-dom"
import { ShopContext } from "../../Context/ShopContex"

const NewNav = ()=> {

    const {getTotalCartItems} = useContext(ShopContext);
    

    return(
        <div className="navbbar">
            <div className="navright">
                <a className="logo" href="/"><img src={logo} alt="logo" /></a>
                <div>Companies</div>
            </div>
            <div className="navleft">
                {localStorage.getItem("auth-token")?<div onClick={()=>{localStorage.removeItem("auth-token"); window.location.replace("/")
                }}>Logout</div>: <Link to='/login'><div>Login</div></Link>}
                <a href="/login">Register</a>
                <div>
                    <Link to='/cart'><img src={cart_icon} alt="" /></Link>
                    <div className="nav-cart-count">{getTotalCartItems()}</div>
                </div>
                <a href="">compass</a>
                <a className="publish" href="">Sell</a>
            </div>
        </div>
    )
}

export default NewNav
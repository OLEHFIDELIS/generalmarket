import './App.css';
import Navbar from './Components/Navbar/Navbar';
import {BrowserRouter,Routes,Route} from "react-router-dom"
import Shop from './Pages/Shop';
import ShopCategory from './Pages/ShopCategory';
import LoginSignup from './Pages/LoginSignup';
import Product from './Pages/Product';
import Cart from './Pages/Cart'
import Footer from './Components/Footer/Footer';
import men_banner from './Components/Assets/banner_mens.png'
import women_banner from './Components/Assets/banner_women.png'
import kid_banner from './Components/Assets/banner_kids.png'
import NewNav from './Components/NewNav/NewNav'
import { categories } from "./data/categories";


function App() {
  return (
    <div>
      <BrowserRouter>
      <NewNav/> 
      {/* <Navbar />   */}

      <Routes>
        <Route path="/" element={<Shop />} />
        {/* AUTO-GENERATE CATEGORY ROUTES */}
        {categories.map((cat, index) => (
          <Route
            key={index}
            path={`/category/${cat.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}`}
            element={<ShopCategory category={cat} />}
          />
        ))}

        {/* Product routes */}
        <Route path='/product'>
          <Route index element={<Product />} />
          <Route path=":productId" element={<Product />} />
        </Route>
        <Route path='/cart' element={<Cart />} />
        <Route path='/login' element={<LoginSignup />} />
      </Routes>
      <Footer/>
    </BrowserRouter>
    </div>
  );
}

export default App;

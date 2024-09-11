const brandModel = require('../../models/brandModel');
const { countDocuments } = require('../../models/brandModel');
const categoryModel = require('../../models/categoryModel');
const productModel = require('../../models/productModel');


const loadProduct = async (req, res) => {
    try {
        let search = "";
        if (req.query.search) {
            search = req.query.search;
        }
        const page = Number(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        const productData = await productModel.find({
            productName: {$regex: ".*" + search + ".*", $options: "i"}
        })
        .populate('category')
        .populate('brand')
        .skip(skip)
        .limit(limit);

        const totalProducts = await productModel.countDocuments({
            productName: {$regex: ".*" + search + ".*", $options: "i"},
        });

        const totalPages = Math.ceil(totalProducts / limit);

        res.render('products', {
            products: productData,
            currentPage: page,
            totalPages: totalPages,
            searchQuery: search
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({message: error.message});
    }
};
// Load add products
const loadAddProducts = async (req, res, next) => {
    try {
        const categoryData = await categoryModel.find({ status: "active" })
        const brandsData = await brandModel.find({ status: "active" })
        console.log(categoryData);
        res.render('addProducts', { categoryData ,brandsData});
    } catch (error) {
        next(error);
    }
};

const addProducts = async (req, res) => {
  try {
    const { productName, category, brands, quantity, gender, price, description } = req.body;

    if (!productName || !category || !brands || !price) {
      return res.status(400).json({ success: false, message: "Required fields are missing" });
    }

    const newProduct = new productModel({
      productName,
      price,
      category,
      brand: brands,
      stock: quantity,
      gender,
      productDec: description,
      image: []
    });


    if (req.files) {
      ['image1', 'image2', 'image3'].forEach((key) => {
        if (req.files[key]) {
          req.files[key].forEach(file => {
            newProduct.image.push(file.filename);
          });
        }
      });
    }

    await newProduct.save();
    res.redirect('/admin/products');
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to add product', error: error.message });
  }
};


  const listProducts = async (req, res, next) => {
    try {
        const id = req.query.id;
        await productModel.updateOne({ _id: id }, { $set: { status: "active" } });
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};

// Unlist Products
const unlistProducts = async (req, res, next) => {
    try {
        const id = req.query.id;
        await productModel.updateOne({ _id: id }, { $set: { status: "inactive" } });
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};

 

const loadEditProducts = async (req, res, next) => {
    try {
        const id = req.query.id;
        const categoryData = await categoryModel.find({ status: "active" })
        const brandsData = await brandModel.find({ status: "active" })
        const productData = await productModel.findOne({ _id: id }).populate('category').populate('brand');
        
        if (productData) {
            res.render('editProduct', { productData , categoryData,brandsData });
        } else {
            res.status(404).send('Product not found');
        }
         
    } catch (error) {
        next(error);
    }
};

const editProducts = async (req, res) => {
    try {
      const id = req.query.id;
      const { productName, category, brands, quantity, gender, price, description, existingImage1, existingImage2, existingImage3 } = req.body;
  
      if (!productName || !category || !brands || !price) {
        return res.status(400).json({ success: false, message: 'Required fields are missing' });
      }
  
      const product = await productModel.findOne({ _id: id });
  
      const images = [
        req.files['image1'] ? req.files['image1'][0].filename : existingImage1 || product.image[0],
        req.files['image2'] ? req.files['image2'][0].filename : existingImage2 || product.image[1],
        req.files['image3'] ? req.files['image3'][0].filename : existingImage3 || product.image[2]
      ];
  
      const updatedProduct = {
        productName,
        price,
        category,
        brand: brands,
        stock: quantity,
        gender,
        productDec: description,
        image: images
      };
  
      await productModel.updateOne({ _id: id }, { $set: updatedProduct });
      res.redirect('/admin/products');
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Failed to update product', error: error.message });
    }
  };
  



 
module.exports = {
    loadProduct,
    loadAddProducts,
    addProducts,
    listProducts,
    unlistProducts,
    loadEditProducts,
    editProducts,
}
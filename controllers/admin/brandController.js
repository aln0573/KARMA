const brandModel = require('../../models/brandModel');

//Load Brands

const loadBrands = async (req, res) => {
    try {
        let search = "";
        if (req.query.search) {
            search = req.query.search;
        }
        const page = Number(req.query.page) || 1;
        const skip = (page - 1) * 5;

        const brandsData = await brandModel.find({
            $or: [
                { brandsName: { $regex: ".*" + search + ".*", $options: "i" } }
            ]
        }).skip(skip).limit(5);

        const totalBrands = await brandModel.countDocuments({
            $or: [
                { brandsName: { $regex: ".*" + search + ".*", $options: "i" } }
            ]
        });
        const totalPages = Math.ceil(totalBrands / 5);
        res.render('brands', { brandsData: brandsData, currentPage: page, totalPages: totalPages, searchQuery: search });
    } catch (error) {
        console.log(error);
    }
};


const addBrands = async (req,res)=>{
    try {
        res.render('addBrands');
    } catch (error) {
        console.log(error);
    }
};

const addNewBrands = async (req, res) => {
    try {
        const { brandsName } = req.body;
        const formattedBrandName = brandsName.trim().toLowerCase();
        const existingBrands = await brandModel.findOne({
            brandsName: { $regex: new RegExp('^' + formattedBrandName + '$', 'i') }
        });

        if (existingBrands) {
            return res.status(400).json({ message: "Brand already exists" });
        }

        const newBrand = new brandModel({ brandsName, status: "active" });
        await newBrand.save();

        return res.status(200).json({ message: "Brand added successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error" });
    }
};


const updateBrands = async (req,res)=>{
    const { id, name } = req.body;

    try {
      const existingCategory = await brandModel.findOne({
        _id: { $ne: id },   
        brandsName: { $regex: new RegExp(`^${name}$`, 'i') }   
      });
  
      if (existingCategory) {
        return res.json({ exists: true });
      }
      await brandModel.findByIdAndUpdate(id,{brandsName: name},{new: true});
  
      res.json({ success: true });
    } catch (error) {
      console.error('Error checking brand name:', error);
      res.status(500).json({ exists: false, error: 'Server error' });
    }
};

const listBrands = async (req, res) => {
    try {
      await brandModel.findByIdAndUpdate(
        { _id: req.body.id },
        { $set: { status: "active" } }
      );
      res.redirect('/admin/brands');
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error updating brand status" });
    }
  };
  
  const unlistBrands = async (req, res) => {
    try {
      await brandModel.findByIdAndUpdate(
        { _id: req.body.id },
        { $set: { status: "inactive" } }
      );
      res.redirect('/admin/brands');
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error updating brand status" });
    }
  };
  

module.exports = {
    loadBrands,
    addBrands,
    addNewBrands,
    updateBrands,
    listBrands,
    unlistBrands,
     
}
const categoryModel = require('../../models/categoryModel');


//Load Category

const loadCategory = async (req, res) => {
    try {
        let search = "";
        if (req.query.search) {
            search = req.query.search;
        }

        const page = Number(req.query.page) || 1;
        const skip = (page - 1) * 5;

        const categoryData = await categoryModel.find({
            $or: [
                { categoryName: { $regex: ".*" + search + ".*", $options: "i" } }
            ],
        }).skip(skip).limit(5);

        const totalCategories = await categoryModel.countDocuments({
            $or: [
                { categoryName: { $regex: ".*" + search + ".*", $options: "i" } }
            ],
        });

        const totalPages = Math.ceil(totalCategories / 5);
        res.render('category', { categoryData: categoryData, currentPage: page, totalPages: totalPages, searchQuery: search });
    } catch (error) {
        res.send(error);
    }
};

const addCategory = async (req,res)=>{
    try {
        res.render('addCategory');
    } catch (error) {
        console.log(error)
    }
}

const addNewCategory = async (req, res) => {
    try {
        const { categoryName } = req.body;

        // Remove extra spaces and convert to lowercase for consistent comparison
        const formattedCategoryName = categoryName.trim().toLowerCase();

        // Check for existing category with the same formatted name
        const existingCategory = await categoryModel.findOne({
            categoryName: { $regex: new RegExp('^' + formattedCategoryName + '$', 'i') }
        });

        if (existingCategory) {
            return res.status(400).json({ message: "Category already exists" });
        }

        const newCategory = new categoryModel({ categoryName: formattedCategoryName, status: "active" });
        await newCategory.save();

        return res.status(200).json({ message: "Category added successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error" });
    }
};




const updateCategory = async (req,res)=>{
    const { id, name } = req.body;

    try {
      const existingCategory = await categoryModel.findOne({
        _id: { $ne: id },  // Exclude the current category being updated
        categoryName: { $regex: new RegExp(`^${name}$`, 'i') }  // Case-insensitive match
      });
  
      if (existingCategory) {
        return res.json({ exists: true });
      }
      await categoryModel.findByIdAndUpdate(id,{categoryName: name},{new: true});
  
      res.json({ success: true });
    } catch (error) {
      console.error('Error checking category name:', error);
      res.status(500).json({ exists: false, error: 'Server error' });
    }
};
 
const listCategory = async (req, res) => {
    try {
        await categoryModel.findByIdAndUpdate(
            { _id: req.body.id },
            { $set: { status: "active" } }
        );
        
        res.json({ success: true });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while updating the category status.' });
    }
};

// Unlist Category
const unlistCategory = async (req, res) => {
    try {
        await categoryModel.findByIdAndUpdate(
            { _id: req.body.id },
            { $set: { status: "inactive" } }
        );

        res.json({ success: true });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while updating the category status.' });
    }
};


module.exports = {
    loadCategory,
    addCategory,
    addNewCategory,
    updateCategory,
    listCategory,
    unlistCategory,
};

 
const express = require('express')
const cors = require('cors');
const app = express()
const { ObjectId } = require('mongodb');
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = 3000 || process.env.PORT


const multer = require('multer')
app.use(cors());
app.use(express.json());
app.use('/uploads/', express.static('uploads'))

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname)
  }
})
const upload = multer({ storage: storage })

const uri = "mongodb+srv://goodtoolsai:aitoolsgood@cluster0.jjqth1v.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const categoryCollection = client.db("goodtools").collection("category");
    const usersCollection = client.db("goodtools").collection("users");
    const subcategoryCollection = client.db("goodtools").collection("subcategory");
    const toolsCollection = client.db("goodtools").collection("tools");
    const newsCollection = client.db("goodtools").collection("news");
    const reviewsCollection = client.db("goodtools").collection("reviews");
    // Category Post

    app.post("/category", async (req, res) => {
      const item = req.body;
      const result = await categoryCollection.insertOne(item);
      res.send(result);
    });

    app.delete("/category/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await categoryCollection.deleteOne(query);
      res.send(result);
    });

    app.delete('/users/:id', async (req, res) => {
      const userId = req.params.id;

      try {
        if (!ObjectId.isValid(userId)) {
          return res.status(400).json({ error: 'Invalid user ID' });
        }

        const result = await usersCollection.deleteOne({ _id: ObjectId(userId) });

        if (result.deletedCount === 1) {
          return res.json({ message: 'User deleted successfully' });
        } else {
          return res.status(404).json({ error: 'User not found' });
        }
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.post("/users", async (req, res) => {
      const item = req.body;
      const result = await usersCollection.insertOne(item);
      res.send(result);
    });

    // SunCategory Post
    app.post("/subcategory", async (req, res) => {
      const item = req.body;
      const result = await subcategoryCollection.insertOne(item);
      res.send(result);
    });

    // Post a new Tool 
    app.post("/newtool", upload.single('image'), async (req, res) => {
      const subs = req.body.SubCategory.split(',');
      req.body.SubCategory = subs;
      let parentCategory = []
      if (subs) {
        Promise.all(subs.map(async (value, index) => {
          // Getting all the categories for the subcategories tagged for each new tool
          const result = await subcategoryCollection.find({ SubCategory: value }).toArray()
          if (result.length > 0 && !parentCategory.includes(result[0].category)) {
            parentCategory.push(result[0].category)
          }
        }))
          .then(async () => {
            const data = { ...req.body, image: req.file ? req.file.path.replace(/uploads\\/g, '') : '', parentCategories: parentCategory }
            const result = await toolsCollection.insertOne(data);
            res.send(result)
          })
      }

    });

    app.post("/newnews", upload.single('image'), async (req, res) => {
      console.log(req.body);
      const data = { ...req.body, image: req.file ? req.file.path.replace(/uploads\\/g, '') : '' }
      const result = await newsCollection.insertOne(data);
      res.send(result)

    });

    app.post("/getuser", async (req, res) => {
      const result = await usersCollection.findOne({ email: req.body.email, password: req.body.password });
      let user = null;
      if (result) {
        user = { name: result.userName, email: result.email, role: result.userType, stat: true }
      } else {
        user = { stat: false };
      }
      res.send(user)

    });

    app.post("/review", async (req, res) => {
      const data = req.body;
      console.log(data);
      const result = await reviewsCollection.insertOne(data);
      console.log(result);
      res.send(result)

    });

    // All gets starts from here

    app.get('/sublist', async (req, res) => {
      const result = await subcategoryCollection.aggregate([
        {
          $group: {
            _id: '$category',
            SubCategories: { $addToSet: "$SubCategory" }
          }
        }
      ]).toArray();
      res.send(result)
    })

    // Get all categories
    app.get('/category', async (req, res) => {
      const categories = await categoryCollection.find().toArray();
      let totalToolsCount = [];

      // Get the nuber of tool for all category
      totalToolsCount = await toolsCollection.aggregate([
        {
          $unwind: "$parentCategories" // Unwind the parentCategories array to create one document per category
        },
        {
          $group: {
            _id: "$parentCategories", // Group by category
            count: { $sum: 1 }   // Count the number of documents in each group
          }
        }
      ]).toArray()

      // Find the number of subcategories and tools for each category
      await Promise.all(categories.map(async (data) => {

        // Find the nuber of subcategories for each category
        const pipelineSub = [
          {
            $match: {
              category: data.Title
            }
          },
          {
            $count: "count"
          }
        ];
        const subCategoriesCount = await subcategoryCollection.aggregate(pipelineSub).toArray();

        let c = 0;
        if (subCategoriesCount.length > 0) {
          c = subCategoriesCount[0].count;
        }

        // Find the number of tools for each category
        const stat = totalToolsCount.find(category => category._id === data.Title);
        let ct = 0;
        if (stat) {
          ct = stat.count
        }

        // add the result and return the result
        return { ...data, subCount: c, toolsCount: ct };
      }))
        .then(data => {
          const results = [...data]
          res.send(results);
        })
    });


    app.get('/users', async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });


    app.get('/subcategory', async (req, res) => {
      const result = await subcategoryCollection.find().toArray();
      res.send(result);
    });

    app.get('/tools', async (req, res) => {
      const result = await toolsCollection.find().toArray();
      res.send(result);
    });

    app.get("/tools/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toolsCollection.findOne(query);
      res.send(result);
    });

    app.get("/review/:productId/:userEmail", async (req, res) => {
      const id = req.params.productId;
      const email = req.params.userEmail;
      const result = await reviewsCollection.findOne({productId : id, userEmail : email});
      if(result === null){
        res.send(true);
      } else {
        res.send(false)
      }
    });

    app.get("/reviews/:productId", async (req, res) => {
      const id = req.params.productId;
      const result = await reviewsCollection.find({productId: id}).toArray();
      console.log(result);
      res.send(result);
    });

    app.get('/news', async (req, res) => {
      const result = await newsCollection.find().toArray();
      res.send(result);
    });

    app.get("/news/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await newsCollection.findOne(query);
      res.send(result);
    });


    app.get("/subtools/:SubCategory", async (req, res) => {

      const SubCategory = req.params.SubCategory;
      const result = await subcategoryCollection.find({ Title: SubCategory }).toArray();
      res.send(result);
    });

    app.get("/counts", async (req, res) => {
      const totalCategories = await categoryCollection.countDocuments();
      const totalSubCategories = await subcategoryCollection.countDocuments();
      const totalTools = await toolsCollection.countDocuments();
      const totalNews = await newsCollection.countDocuments();
      const result = { totalCategories: totalCategories, totalSubCategories: totalSubCategories, totalTools: totalTools, totalNews: totalNews };
      res.send(result);
    });

    // All delets are here

    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    app.delete("/category/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await categoryCollection.deleteOne(query);
      res.send(result);
    });

    app.put("/category/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedCategory = req.body; // Assumes the request body contains updated category data
      try {
        const result = await categoryCollection.updateOne(query, { $set: updatedCategory });
        if (result.matchedCount > 0) {
          res.status(200).json({ message: "Category Updated Successfully" });
        } else {
          res.status(404).json({ message: "Category not found" });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
      }
    });
    app.put("/subcategory/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedCategory = req.body; // Assumes the request body contains updated category data
      try {
        const result = await subcategoryCollection.updateOne(query, { $set: updatedCategory });
        if (result.matchedCount > 0) {
          res.status(200).json({ message: "Category Updated Successfully" });
        } else {
          res.status(404).json({ message: "Category not found" });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
      }
    });
    app.put("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedUser = req.body; // Assumes the request body contains updated category data
      console.log(updatedUser);
      try {
        const result = await usersCollection.updateOne(query, { $set: updatedUser });
        if (result.matchedCount > 0) {
          res.status(200).json({ message: "Category Updated Successfully" });
        } else {
          res.status(404).json({ message: "Category not found" });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
      }
    });
    app.get('/news/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) }; // Use ObjectId to convert the id parameter
      const result = await newsCollection.findOne(query);
      res.send(result);
    });




















    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
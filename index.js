const express = require('express')
const cors = require('cors');
const fs = require('fs');
const dns = require('dns');
const path = require('path');
const say = require('say')
const app = express()
const { ObjectId } = require('mongodb');
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = 3000 || process.env.PORT


const multer = require("multer");
app.use(cors());
app.use(express.json());
app.use("/uploads/", express.static("uploads"));
app.use("/audioFiles/", express.static("audioFiles"));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString().replace(/:/g, '-') + '_' + file.originalname)
  }
})
const upload = multer({ storage: storage })

const uri =
  "mongodb+srv://goodtoolsai:aitoolsgood@cluster0.jjqth1v.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

function getVoices() {
  return new Promise((resolve) => {
    say.getInstalledVoices((err, voice) => {
      return resolve(voice)
    })
  })
}


const storeAudio = async (text, filename) => {
  const voicesList = await getVoices();
  if (voicesList) {
    return new Promise((resolve) => {
      const folderPath = path.join(__dirname, 'audioFiles');
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
      }
      const fileName = `${new Date().toISOString().replace(/:/g, '-') + '_' + filename}.wav`;
      const outputFile = path.join(folderPath, fileName);

      say.export(text.replace(/<\/?[^>]+(>|$)/g, ""), voicesList ? voicesList[0] : 'Microsoft David Desktop - English (United States)', 1, outputFile, function (err) {
        if (err) {
          console.error(err);
          // reject(err);
        }
        console.log(`Audio file saved as ${outputFile}`);
        resolve(fileName);
      });
    });
  }
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const categoryCollection = client.db("goodtools").collection("category");
    const usersCollection = client.db("goodtools").collection("users");
    const subcategoryCollection = client
      .db("goodtools")
      .collection("subcategory");
    const toolsCollection = client.db("goodtools").collection("tools");
    const newsCollection = client.db("goodtools").collection("news");
    const reviewsCollection = client.db("goodtools").collection("reviews");
    // Category Post

    app.post("/category", async (req, res) => {
      const item = req.body;
      req.body.Title = req.body.Title.trim()
      req.body.catName = req.body.catName.trim()
      const availability = await categoryCollection.findOne({ catName: req.body.catName });
      if (availability) {
        res.send({ stat: true })
      } else {
        const result = await categoryCollection.insertOne(item);
        res.send(result);
      }

    });



    //pagination
    app.get("/totalCategory", async (req, res) => {
      const result = await categoryCollection.estimatedDocumentCount();
      res.send({ totalCategory: result });
    });

    app.get("/totalSubCategory", async (req, res) => {
      const result = await subcategoryCollection.estimatedDocumentCount();
      res.send({ totalSubCategory: result });
    });
    app.get("/totalTools", async (req, res) => {
      const result = await toolsCollection.estimatedDocumentCount();
      res.send({ totalTools: result });
    });
    app.get("/totalNews", async (req, res) => {
      const result = await newsCollection.estimatedDocumentCount();
      res.send({ totalNews: result });
    });




    app.delete("/category/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await categoryCollection.deleteOne(query);
      res.send(result);
    });

    app.delete("/subcategory/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await subcategoryCollection.deleteOne(query);
      res.send(result);
    });
    app.delete("/tools/:id/:img", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toolsCollection.deleteOne(query);
      if (result.acknowledged && result.deletedCount > 0) {
        //The following code is to delete existing image from server
        fs.unlink('./uploads/' + req.params.img, (err) => {
          if (err) {
            console.error(err);
          } else {
            console.log(req.params.img + ' image deleted successfully');
          }
        })
      }
      res.send(result);
    });
    app.delete("/news/:id/:img", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await newsCollection.deleteOne(query);
      if (result.acknowledged && result.deletedCount > 0) {
        //The following code is to delete existing image from server
        fs.unlink('./uploads/' + req.params.img, (err) => {
          if (err) {
            console.error(err);
          } else {
            console.log(req.params.img + ' image deleted successfully');
          }
        })
      }
      res.send(result);
    });

    app.delete('/users/:id', async (req, res) => {
      const userId = req.params.id;

      try {
        if (!ObjectId.isValid(userId)) {
          return res.status(400).json({ error: "Invalid user ID" });
        }

        const result = await usersCollection.deleteOne({
          _id: new ObjectId(userId),
        });

        if (result.deletedCount === 1) {
          return res.json({ message: "User deleted successfully" });
        } else {
          return res.status(404).json({ error: "User not found" });
        }
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
      }
    });

    app.post("/users", async (req, res) => {
      const item = req.body;
      const result = await usersCollection.insertOne(item);
      res.send(result);
    });

    // SubCategory Post
    app.post("/subcategory", async (req, res) => {
      const item = req.body;
      req.body.SubCategory = req.body.SubCategory.trim()
      req.body.Title = req.body.Title.trim()
      console.log(req.body);
      const availability = await subcategoryCollection.findOne({ SubCategory: req.body.SubCategory, category: req.body.category });
      if (availability) {
        res.send({ stat: true })
      } else {
        const result = await subcategoryCollection.insertOne(item);
        res.send(result);
      }
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
            const descriptionPath = await storeAudio(req.body.description, `Tool_Description_${req.body.toolName}`)
            const usagesPath = await storeAudio(req.body.works, `Tool_Usages_${req.body.toolName}`)
            const data = { ...req.body, image: req.file ? req.file.path.replace(/^uploads[\\\/]/g, '') : '', parentCategories: parentCategory, descriptionPath: descriptionPath, usagesPath: usagesPath }
            console.log(data);
            const result = await toolsCollection.insertOne(data);
            res.send(result)


          })
      }

    });

    app.get("/relatedtools/:subcategory", async (req, res) => {
      const subcategoryString = req.params.subcategory;
      const subcategories = subcategoryString.split(',');
      const result = await toolsCollection.find({ SubCategory: { $in: subcategories } }).toArray();
      console.log(result);
      res.send(result)
    })

    app.post("/newnews", upload.single('image'), async (req, res) => {
      const newsBodyPath = await storeAudio(req.body.newsBody, `News_Description_${req.body.newsTitle.replace(/[\\/:*?"<>|]/g, '_')}`)
      const data = { ...req.body, image: req.file ? req.file.path.replace(/^uploads[\\\/]/g, '') : '', newsBodyPath: newsBodyPath }
      const result = await newsCollection.insertOne(data);
      res.send(result);
    });

    app.put("/editnews", upload.single('image'), async (req, res) => {
      const preNewsPath = req.body.newsBodyPath
      const { imageId, newsId, ...filteredData } = req.body
      const newsBodyPath = await storeAudio(req.body.newsBody, `News_Description_${req.body.newsTitle.replace(/[\\/:*?"<>|]/g, '_')}`)
      const data = { ...filteredData, image: req.file ? req.file.path.replace(/^uploads[\\\/]/g, '') : req.body.imageId, newsBodyPath: newsBodyPath }

      const id = req.body.newsId;
      const query = { _id: new ObjectId(id) };
      const updatedNews = data;
      try {
        const result = await newsCollection.updateOne(query, {
          $set: updatedNews,
        });
        if (result.matchedCount > 0) {
          //The following code is to delete existing image from server
          if (req.file) {
            fs.unlink('./uploads/' + req.body.imageId, (err) => {
              if (err) {
                console.error(err);
              } else {
                console.log(req.body.imageId + ' image deleted successfully');
              }
            });
          }

          //The following code is to delete existing image from server
          fs.unlink('./audioFiles/' + preNewsPath, (err) => {
            if (err) {
              console.error(err);
            } else {
              console.log(preNewsPath + ' audio file deleted successfully');
            }
          });

          console.log("news updated");
          res.send(result);
        } else {
          console.log("news not found");
          res.send("News not found");
        }
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ message: "Internal Server Error", error: error.message });
      }
    });

    app.put("/edittool", upload.single('image'), async (req, res) => {

      const subs = req.body.SubCategory.split(',');
      req.body.SubCategory = subs;
      let parentCategory = [];
      if (subs) {
        Promise.all(subs.map(async (value, index) => {
          // Getting all the categories for the subcategories tagged for each new tool
          const result = await subcategoryCollection.find({ SubCategory: value }).toArray()
          if (result.length > 0 && !parentCategory.includes(result[0].category)) {
            parentCategory.push(result[0].category)
          }
        }))
          .then(async () => {
            const { imageId, toolId, ...filteredData } = req.body
            const preDes = req.body.descriptionPath;
            const preWork = req.body.usagesPath;
            console.log(req.body);
            const descriptionPath = await storeAudio(req.body.description, `Tool_Description_${req.body.toolName}`)
            const usagesPath = await storeAudio(req.body.works, `Tool_Usages_${req.body.toolName}`)
            const data = { ...filteredData, parentCategories: parentCategory, image: req.file ? req.file.path.replace(/^uploads[\\\/]/g, '') : req.body.imageId, descriptionPath: descriptionPath, usagesPath: usagesPath }
            const id = req.body.toolId;
            const query = { _id: new ObjectId(id) };
            const updatedTool = data;

            try {
              const result = await toolsCollection.updateOne(query, { $set: updatedTool });
              if (result.matchedCount > 0) {

                //The following code is to delete existing image from server
                if (req.file) {
                  fs.unlink('./uploads/' + req.body.imageId, (err) => {
                    if (err) {
                      console.error(err);
                    } else {
                      console.log(req.body.imageId + ' image deleted successfully');
                    }
                  })
                }

                //The following code is to delete existing audio from server
                fs.unlink('./audioFiles/' + preDes, (err) => {
                  if (err) {
                    console.error(err);
                  } else {
                    console.log(preDes + ' audio file deleted successfully');
                  }
                })

                fs.unlink('./audioFiles/' + preWork, (err) => {
                  if (err) {
                    console.error(err);
                  } else {
                    console.log(preWork + ' audio file deleted successfully');
                  }
                })

                console.log('Tool updated');
                res.send(result)
              } else {
                console.log('Tool not found');
                res.send("Tool not found");
              }
            } catch (error) {
              console.error(error);
              res.status(500).json({ message: "Internal Server Error", error: error.message });
            }
          })
      } else {
        res
          .status(500)
          .json({ message: "Internal Server Error", error: error.message });
      }
    });

    app.post("/getuser", async (req, res) => {
      const result = await usersCollection.findOne({
        email: req.body.email,
        password: req.body.password,
      });
      let user = null;
      if (result) {
        user = {
          name: result.userName,
          email: result.email,
          role: result.userType,
          stat: true,
        };
      } else {
        user = { stat: false };
      }
      res.send(user);
    });

    app.post("/review", async (req, res) => {
      const data = req.body;
      const result = await reviewsCollection.insertOne(data);
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
    app.get("/category", async (req, res) => {
      // console.log(req.query);
      const page = parseInt(req.query.page) || 0;
      const limit = parseInt(req.query.limit) || 6;
      const skip = page * limit;
      const categories = await categoryCollection
        .find()
        .skip(skip)
        .limit(limit)
        .toArray();
      let totalToolsCount = [];

      // Get the nuber of tool for all category
      totalToolsCount = await toolsCollection
        .aggregate([
          {
            $unwind: "$parentCategories", // Unwind the parentCategories array to create one document per category
          },
          {
            $group: {
              _id: "$parentCategories", // Group by category
              count: { $sum: 1 }, // Count the number of documents in each group
            },
          },
        ])
        .toArray();

      // Find the number of subcategories and tools for each category
      await Promise.all(
        categories.map(async (data) => {
          // Find the nuber of subcategories for each category
          const pipelineSub = [
            {
              $match: {
                category: data.Title,
              },
            },
            {
              $count: "count",
            },
          ];
          const subCategoriesCount = await subcategoryCollection
            .aggregate(pipelineSub)
            .toArray();

          let c = 0;
          if (subCategoriesCount.length > 0) {
            c = subCategoriesCount[0].count;
          }

          // Find the number of tools for each category
          const stat = totalToolsCount.find(
            (category) => category._id === data.Title
          );
          let ct = 0;
          if (stat) {
            ct = stat.count;
          }

          // add the result and return the result
          return { ...data, subCount: c, toolsCount: ct };
        })
      ).then((data) => {
        const results = [...data];
        res.send(results);
      });
    });

    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.get('/allsubcategories', async (req, res) => {
      const subcategories = await subcategoryCollection.find().toArray();
      res.send(subcategories)
    })
    app.get('/subcategory', async (req, res) => {
      console.log(req.query)
      const page = parseInt(req.query.page) || 0;
      const limit = parseInt(req.query.limit) || 6;
      const skip = page * limit;
      const subcategories = await subcategoryCollection
        .find()
        .skip(skip)
        .limit(limit)
        .toArray();

      let totalToolsCount = [];

      // Get the nuber of tool for all subcategory
      totalToolsCount = await toolsCollection.aggregate([
        {
          $unwind: "$SubCategory" // Unwind the SubCategory array to create one document per category
        },
        {
          $group: {
            _id: "$SubCategory", // Group by subcategory
            count: { $sum: 1 }   // Count the number of documents in each group
          }
        }
      ]).toArray()

      await Promise.all(subcategories.map(async (data) => {

        // Find the number of tools for each category
        const stat = totalToolsCount.find(subcategory => subcategory._id === data.Title);
        let ct = 0;
        if (stat) {
          ct = stat.count
        }

        // add the result and return the result
        return { ...data, toolsCount: ct };
      }))
        .then(data => {
          const results = [...data]
          res.send(results);
        })
    });

    app.get("/tools", async (req, res) => {
      const page = parseInt(req.query.page) || 0;
      const limit = parseInt(req.query.limit) || 6;
      const skip = page * limit;
      const result = await toolsCollection
        .find()
        .skip(skip)
        .limit(limit)
        .toArray();
      res.send(result);
    });

    app.get("/tool", async (req, res) => {
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
      const result = await reviewsCollection.findOne({
        productId: id,
        userEmail: email,
      });
      if (result === null) {
        res.send(true);
      } else {
        res.send(false);
      }
    });

    app.get("/reviews/:productId", async (req, res) => {
      const id = req.params.productId;
      const result = await reviewsCollection.find({ productId: id }).toArray();

      res.send(result);
    });
    app.get("/news", async (req, res) => {

      const page = parseInt(req.query.page) || 0;
      const limit = parseInt(req.query.limit) || 6;
      const skip = page * limit;
      const result = await newsCollection
        .find()
        .skip(skip)
        .limit(limit)
        .toArray();
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
      const result = await subcategoryCollection
        .find({ Title: SubCategory })
        .toArray();
      res.send(result);
    });

    app.get("/counts", async (req, res) => {
      const totalCategories = await categoryCollection.countDocuments();
      const totalSubCategories = await subcategoryCollection.countDocuments();
      const totalTools = await toolsCollection.countDocuments();
      const totalNews = await newsCollection.countDocuments();
      const result = {
        totalCategories: totalCategories,
        totalSubCategories: totalSubCategories,
        totalTools: totalTools,
        totalNews: totalNews,
      };
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
        const result = await categoryCollection.updateOne(query, {
          $set: updatedCategory,
        });
        if (result.matchedCount > 0) {
          res.status(200).json({ message: "Category Updated Successfully" });
        } else {
          res.status(404).json({ message: "Category not found" });
        }
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ message: "Internal Server Error", error: error.message });
      }
    });
    app.put("/subcategory/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedCategory = req.body; // Assumes the request body contains updated category data
      try {
        const result = await subcategoryCollection.updateOne(query, {
          $set: updatedCategory,
        });
        if (result.matchedCount > 0) {
          res.status(200).json({ message: "Category Updated Successfully" });
        } else {
          res.status(404).json({ message: "Category not found" });
        }
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ message: "Internal Server Error", error: error.message });
      }
    });
    app.put("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedUser = req.body; // Assumes the request body contains updated category data
      try {
        const result = await usersCollection.updateOne(query, {
          $set: updatedUser,
        });
        if (result.matchedCount > 0) {
          res.status(200).json({ message: "Category Updated Successfully" });
        } else {
          res.status(404).json({ message: "Category not found" });
        }
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ message: "Internal Server Error", error: error.message });
      }
    });
    app.get("/news/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }; // Use ObjectId to convert the id parameter
      const result = await newsCollection.findOne(query);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!\n')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

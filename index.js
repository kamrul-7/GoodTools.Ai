const express = require('express')
const cors = require('cors');
const app = express()
const { ObjectId } = require('mongodb');
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = 3000


const multer  = require('multer')
app.use(cors());
app.use(express.json());
app.use('/uploads/', express.static('uploads'))

const storage = multer.diskStorage({
  destination : function(req, file, cb){
    cb(null, './uploads')
  },
  filename : function(req, file, cb){
    cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname)
  }
})
const upload = multer({ storage:storage })
console.log()

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

    // Category Post

    app.post("/category", async (req, res) => {
      const item = req.body;
      const result = await categoryCollection.insertOne(item);
      res.send(result);
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
      console.log(result);
      res.send(result);
    });

    app.post("/newtool", upload.single('image'), async (req, res) => {
      const subs = req.body.subCategory.split(',');
      req.body.subCategory = subs;
      const data = {...req.body, image: req.file ? req.file.path.replace(/uploads\\/g, '') : ''}
      const result = await toolsCollection.insertOne(data);
      console.log(result);
      res.send(result)
    });


    app.get('/image/:name', (req, res) =>{
      console.log('./uploads/'+req.params.name);
      res.send('uploads/'+req.params.name)
    })

    app.get('/category', async (req, res) => {
        const categories = await categoryCollection.find().toArray();
        results = [];
        Promise.all(categories.map(async (data) => {
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

          const pipelineTools = [
            {
              $match: {
                category: data.Title
              }
            },
            {
              $count: "count"
            }
          ];
          const toolsCount = await toolsCollection.aggregate(pipelineTools).toArray();

          let ct = 0;
          if (toolsCount.length > 0) {
            ct = toolsCount[0].count;
          }

          return { ...data, subCount: c, toolsCount: ct};
        }))
        .then(data =>{
          results = [...data]
          console.log(results);
          res.send(results);
        } )
    });


    app.get('/users', async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.get('/subcategory', async (req, res) => {
      const result = await subcategoryCollection.find().toArray();
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
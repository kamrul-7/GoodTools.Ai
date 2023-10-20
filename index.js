const express = require('express')
const cors = require('cors');
const app = express()
const { ObjectId } = require('mongodb');
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = 3000

app.use(cors());
app.use(express.json());


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
    
    const categoryCollection = client.db("goodtools").collection ("category");
    const usersCollection = client.db("goodtools").collection ("users");
    const subcategoryCollection = client.db("goodtools").collection ("subcategory");
    
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
      res.send(result);
    });
    

    
    app.get('/category', async (req, res) => {
      const result = await categoryCollection.find().toArray();
      res.send(result);
    });

    app.get('/users', async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

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

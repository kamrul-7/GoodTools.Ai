const express = require('express')
const cors = require('cors');
const app = express()
const { ObjectId } = require('mongodb');
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = 3000

app.use(cors());
app.use(express.json());

const uri = "mongodb+srv://goodtoolsai:aitoolsgood@cluster0.jjqth1v.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    

    const categoryCollection = client.db("goodtools").collection ("category");
    const usersCollection = client.db("goodtools").collection ("users");
    const subcategoryCollection = client.db("goodtools").collection ("subcategory");
    
    // Category Post

    const categoryCollection = client.db("goodtools").collection("category");
    const usersCollection = client.db("goodtools").collection("users");
    const subcategoryCollection = client.db("goodtools").collection("subcategory");


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


    // Update user endpoint
    app.put('/users/:id', async (req, res) => {
      const userId = req.params.id;
      const updateData = req.body;


    app.delete("/category/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await categoryCollection.deleteOne(query);
      res.send(result);
    });
    


















      
      try {
        if (!ObjectId.isValid(userId)) {
          return res.status(400).json({ error: 'Invalid user ID' });
        }

        const updateResult = await usersCollection.updateOne(
          { _id: ObjectId(userId) },
          { $set: updateData }
        );

        if (updateResult.modifiedCount === 1) {
          return res.json({ message: 'User updated successfully' });
        } else {
          return res.status(404).json({ error: 'User not found or no update made' });
        }
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Do not close the client connection here. It should be kept alive during the server's lifecycle.
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

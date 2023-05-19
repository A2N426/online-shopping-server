const express = require('express');
const cors = require('cors');
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
    res.send("From Toy Server");
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.a5mfktt.mongodb.net/?retryWrites=true&w=majority`;

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
        client.connect();

        const toysCollection = client.db("carDB").collection("cars")


        app.get("/allToys", async (req, res) => {
            const result = await toysCollection.find().toArray();
            res.send(result);
        })

        app.get("/allToys/:id", async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const query = { _id: new ObjectId(id) }
            const result = await toysCollection.findOne(query);
            res.send(result);
        })


        app.get("/myToys/:email", async (req, res) => {
            const result = await toysCollection.find({
                sellerEmail: req.params.email,
            }).toArray();
            res.send(result);
        })

        app.get("/allToysByCategory/:category", async (req, res) => {
            const result = await toysCollection.find({ category: req.params.category }).toArray();
            res.send(result);
        })


        app.post("/allToys", async (req, res) => {
            const body = req.body;
            const result = await toysCollection.insertOne(body);
            res.send(result);
        })

        app.patch("/allToys/:id", async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const updateInfo = req.body;
            const filter = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    price: updateInfo.price,
                    available_quantity: updateInfo.available_quantity,
                    description: updateInfo.description,
                }
            }
            const result = await toysCollection.updateOne(filter, updatedDoc)
            res.send(result);
        })


        app.delete("/allToys/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await toysCollection.deleteOne(query);
            res.send(result);
        })




        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.listen(port, () => {
    console.log(`toy server is running on port: ${port}`)
})
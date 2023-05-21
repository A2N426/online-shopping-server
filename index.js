const express = require('express');
const cors = require('cors');
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;

// middleware
// app.use(cors());
const corsConfig = {
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
    app.use(cors(corsConfig))
app.use(express.json());


app.get("/", (req, res) => {
    res.send("From Toy Server sS");
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

const verifyJWT = (req,res,next)=>{
    const authorization = req.headers.authorization;
    if(!authorization){
        return res.status(401).send({error:true,message:"unauthorized access"})
    }
    const token = authorization.split(" ")[1]
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(error,decoded)=>{
        if(error){
            return res.status(401).send({error:true,message:"unauthorized access"})
        }
        req.decoded = decoded;
        next()
    })
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        client.connect();

        const toysCollection = client.db("carDB").collection("cars")

        app.post("/token", (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "12h"})
            res.send({ token })
        })

        app.get("/myToys/:email",verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            if(decoded.email !== req.params.email){
                return res.status(403).send({error:1,message:"forbidden access"})
            }
           const result = await toysCollection.find({sellerEmail: req.params.email}).sort({price:1}).toArray();
           res.send(result);
        })


        app.get("/allToys", async (req, res) => {
            const page = parseInt(req.query.page) || 0;
            const limit = parseInt(req.query.limit) || 20;
            const skip = page * limit;
            const result = await toysCollection.find().skip(skip).limit(limit).toArray();
            res.send(result);
        })

        app.get("/allToys/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await toysCollection.findOne(query);
            res.send(result);
        })

        // search by name
        app.get("/getToyByText/:searchText", async (req, res) => {
            const searchText = req.params.searchText;
            const result = await toysCollection.find({
                $or: [
                    { name: { $regex: searchText, $options: "i" } }
                ]
            }).toArray()
            res.send(result)
        })
        

        app.get("/allToysByCategory/:category", async (req, res) => {
            const result = await toysCollection.find({category: req.params.category}).toArray();
            res.send(result);
        })

        app.get("/totalToys",async(req,res)=>{
            const result = await toysCollection.estimatedDocumentCount();
            res.send({totalToys:result});
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

        // sort by price
        app.get("/sortByAscending/:email", async (req, res) => {
            const result = await toysCollection.find({
                sellerEmail: req.params.email,
            }).sort({ price: -1 }).toArray();
            res.send(result)
        })

        app.get("/sortByDescending/:email", async (req, res) => {
            const result = await toysCollection.find({
                sellerEmail: req.params.email,
            }).sort({ price: 1 }).toArray()
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
    console.log(`Toy server is running on port: ${port}`)
})
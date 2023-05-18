const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
    res.send("From Toy Server");
})


app.listen(port, () => {
    console.log(`toy server is running on port: ${port}`)
})
const express = require("express");
const port = 3000;
const app = express();

app.listen(port, async ()=>{
    console.log("Listening on port "+port);
})

app.get("/", (req,res)=>{
    res.send("Hello world!")
});
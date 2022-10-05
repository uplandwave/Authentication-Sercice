const express = require("express");
const bodyParser = require("body-parser");
const {v4 : uuidv4} = require("uuid");
const port = 3000;
const app = express();
const {createClient} = require("redis")
const md5 = require("md5")

const redisClient= createClient(
    {
        Url:"redis://default@localhost:6379",
    }
    )
    
app.listen(port, async()=>{
    await redisClient.connect();
    console.log("Listening on port: ",port);
    })
    
    app.use(bodyParser.json());


app.get("/", (req,res)=>{
    res.send("Hello world!")
});

app.post("/user", (req,res)=>{
    const newUserRequestObject = req.body;
    console.log("New User: ", JSON.stringify(newUserRequestObject));
    redisClient.hSet("users",req.body.email,     JSON.stringify(newUserRequestObject));
    res.send("New User "+newUserRequestObject.email+" added")
});

app.post("/login", async(req,res)=>{
    const loginEmail = req.body.userName;
    console.log(JSON.stringify(req.body));
    console.log("loginEmail", loginEmail);
    const loginPassword = req.body.password;
    console.log("loginPassword", loginPassword);
    // res.send("Who are you");

    const userString = await redisClient.hGet("users",loginEmail);
    const userOpject = JSON.parse(userString)
    if(userString == " "|| userString == null){
        res.status(404);
        res.send("User not found")
    }
    else if (loginEmail == userOpject.userName && loginPassword == userOpject.pasword){
        const token = uuidv4();
        res.send(token);
    
    } else{
        res.status(401);//unothorized
        res.send("Invalid user or password");
    }

})


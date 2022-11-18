const express = require("express");
const bodyParser = require("body-parser");
const https =require("https");
const fs = require("fs")
const {v4 : uuidv4} = require("uuid");
const port = 443;
const app = express();
const {createClient} = require("redis")
const md5 = require("md5")

const redisClient= createClient(
    {
        url:"redis://default@34.68.63.203:6379",
    }
);

    app.use(bodyParser.json());

// https.createServer({
//     key: fs.readFile("server.key"),
//     cert: fs.readFileSync("server.cert"),
// })

// app.listen(port, async()=>{
    //     await redisClient.connect();
    //     console.log("Listening on port: ",port);
    //     })
    // /usr/src/app/
    https.createServer({
        key: fs.readFileSync('./SSL/server.key'),
        cert: fs.readFileSync('./SSL/server.cert'),
        ca: fs.readFileSync("./SSL/chain.pem"),
}, app).listen(port, async () => {
    console.log('Listening...')
    try{
        await redisClient.connect();
        console.log('Listening...')}
        catch(error){
            console.log
        }
    
});

app.get("/", (req,res)=>{
    res.send("Kaden pipes down dudes!")
});

app.post("/user", (req,res)=>{
    const newUserRequestObject = req.body;
    const loginPassword = req.body.password;
    const hash = md5(loginPassword)
    console.log(hash)
    newUserRequestObject.password = hash
    newUserRequestObject.verifyPassword = hash
    console.log("New User: ", JSON.stringify(newUserRequestObject));
    redisClient.hSet("users",req.body.email,JSON.stringify(newUserRequestObject));

    res.send("New User "+newUserRequestObject.password+" added")
});

app.post("/login", async(req,res)=>{
    const loginEmail = req.body.userName;
    console.log(JSON.stringify(req.body));
    console.log("loginEmail", loginEmail);
    const loginPassword = md5(req.body.password);
    console.log("loginPassword", loginPassword);

    const userString = await redisClient.hGet("users",loginEmail);
    const userObject = JSON.parse(userString)

    if(userString == " "|| userString == null){
        res.status(404);
        res.send("User not found")
    }
    else if (loginEmail == userObject.userName && loginPassword == userObject.password){
        const token = uuidv4();
        res.send(token);
    
    } else{
        res.status(401);//unothorized
        res.send("Invalid user or password");
    }

})

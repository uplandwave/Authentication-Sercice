const express = require("express");
const bodyParser = require("body-parser");
const https =require("https");
const fs = require("fs")
const {v4 : uuidv4} = require("uuid");
const port = 4043;
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
    
    https.createServer({
        key: fs.readFileSync('server.key'),
        cert: fs.readFileSync('server.cert'),
        ca: fs.readFileSync("chain.pem")
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
    res.send("Hello world!")
});

app.post("/user", (req,res)=>{
    const newUserRequestObject = req.body;
    const loginPassword = req.body.password;
    const hash = md5(loginPassword)
    console.log(hash)
    newUserRequestObject.password = hash
    newUserRequestObject.verifyPassword = hash
    console.log("New User: ", JSON.stringify(newUserRequestObject));
    redisClient.hSet("users",req.body.email,     JSON.stringify(newUserRequestObject));

    res.send("New User "+newUserRequestObject.email+" added")
});

app.post("/login", async(req,res)=>{
    const loginEmail = req.body.userName;
    console.log(JSON.stringify(req.body));
    console.log("loginEmail", loginEmail);
    const loginPassword = req.body.password;
    const hash = md5(loginPassword)
    console.log("loginPassword", loginPassword);

    const userString = await redisClient.hGet("users",loginEmail);
    const userOpject = JSON.parse(userString)
    if(userString == " "|| userString == null){
        res.status(404);
        res.send("User not found")
    }
    else if (loginEmail == userOpject.userName && hash == userOpject.pasword){
        const token = uuidv4();
        res.send(token);
    
    } else{
        res.status(401);//unothorized
        res.send("Invalid user or password");
    }

})


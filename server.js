const express = require('express');
const https = require('https');
const fs = require('fs');
const bodyParser = require('body-parser');
const {v4 : uuidv4} = require('uuid');
const port = 443;
const app = express();
const {createClient} = require('redis');
const md5 = require('md5');
const { json } = require('body-parser');
const maxNumberoffailedlogins = 3;

const redisClient = createClient(
{
      url:`redis://default:${process.env.REDIS_PASS}@redis-stedi-pixar:6379`,
}
);
app.use(bodyParser.json());
https.createServer({
    key: fs.readFileSync('/usr/src/app/SSL/server.key'),
    cert: fs.readFileSync('/usr/src/app/SSL/server.cert'),
    ca:fs.readFileSync('/usr/src/app/SSL/chain.pem')
}, app).listen(port, async ()=>{
    await redisClient.connect();//creating a TCP socket with Redis
    console.log("Listening on port: "+port);
})
app.get('/',(req,res)=>{
    res.send('Hello!');
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
var loginAttempts = {}
// app.get('/reset')
app.post('/login', async (req,res)=>{
    const loginEmail = req.body.userName;
    console.log(JSON.stringify(req.body));
    console.log('loginEmail',loginEmail);
    const loginPassword = md5(req.body.password);
    console.log('loginPasword',loginPassword);
    const userString=await redisClient.hGet('users',loginEmail);
    const userObject = JSON.parse(userString);
    if (loginAttempts[loginEmail] == null) {loginAttempts[loginEmail] = 0}
    // var userAttempts = userObject.userAttempts;
    if (loginAttempts[loginEmail] >= maxNumberoffailedlogins){
        return res.status(469).send("Stop trying it's not working.")
    }
    if(userString=='' || userString==null){
        res.status(404);
        res.send('User not found');
    }
    else if (loginEmail==userObject.userName && loginPassword==userObject.password){
        const token = uuidv4();
        res.send(token);
    } else{
        // userObject.userAttempts += 1
        loginAttempts[loginEmail] += 1
        redisClient.hSet("users",req.loginEmail,JSON.stringify(userObject));
        res.status(401);//unauthorized
        res.send(['Invalid user or password', loginAttempts]);
    }
});

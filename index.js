// const hero = require("./second");
// // console.log(hero);

// const os = require('os');
// console.log(os.freemem());
// console.log(os.type());
// console.log(os.platform());
// console.log(os.homedir());
// console.log(os.hostname());

// const http = require("http");
// const server = http.createServer((req, res)=>{
//     if(req.url === "/about"){
//         res.end("<h1>About Page</h1>")
//     }
//     else if(req.url === "/"){
//         res.end("<h1>Home Page</h1>")
//     }
//     else{
//         res.end("Page not found.")
//     }

// });

// server.listen(5000, () => {
//     console.log("Server is working");
// });

// var MongoClient = require('mongodb').MongoClient;
// var url = "mongodb://localhost:27017/";

// MongoClient.connect(url, function(err, db) {
//   if (err) throw err;
//   var dbo = db.db("mydb");
//   dbo.collection("customers").findOne({}, function(err, result) {
//     if (err) throw err;
//     console.log(result.name);
//     db.close();
//   });
// });



import express from "express";
import path from "path";
import mongoose, { mongo, now } from "mongoose"
// import { send } from "process";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const app = express();

// app.get("/get-products", (req, res) => {
//     res.json({
//         success: true, 
//         product: []
//     });
// })
mongoose.connect("mongodb://127.0.0.1:27017", {
    dbName: "Pocket"
}).then(() =>{
    console.log("Database Connected.")
}).catch((e)=>{
    console.log(e);
})

// Creating a Schema(Struture of databse)
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
});

const  User = mongoose.model("User", userSchema);


//Linking front end code(public folder) with the back end
app.use(express.static(path.join(path.resolve(), "public")));

// USING MIDDLEWARES
app.use(cookieParser());
//setting up view engine
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true}));


// creating a middleware to check if cookie exists or not
const isAuthenticated = async (req, res, next)=>{
    const {token} = req.cookies;
    if(token){
        const decodedData = jwt.verify(token, "vdchjvbsjbcvbdscvjhakappqi")
        req.user = await User.findById(decodedData._id)

        next();
    }
    else{
        res.redirect("login");
    }
}

app.get("/", isAuthenticated, (req, res) => {
    console.log(req.user);
   res.render("logout", {name: req.user.name});
});



// Actual routes


app.get("/register", (req, res)=>{
    res.render("register")
})
app.get("/login", (req,res)=>{
    res.render("login")
})


app.post("/login", async (req, res)=>{
    const {name, email, password}= req.body;
    console.log(req.body); 

    let user = await User.findOne({email});
    if (!user) return res.redirect("/register");
    
    // const isMatch= await user.password === password;  // Easy and less secure method
    const isMatch = await bcrypt.compare(password, user.password);


    if(!isMatch) return res.render("login", {email,message: "Wrong Password" })
    
   
    const token = jwt.sign({_id:user._id}, "vdchjvbsjbcvbdscvjhakappqi");
   
    res.cookie("token", token,{
        httpOnly: true, 
        expires: new Date(Date.now()+ 60*1000), });
    res.redirect("/"); 
})

app.post("/register", async (req, res)=>{
    const {name, email, password}= req.body;
    console.log(req.body); 

    let user = await User.findOne({email});
    if (user) {
        return res.redirect("/login")
    }

    const hashedPassword = bcrypt.hash(password, 10); // 10 is the level of encryption, the more the better
    
    user = await User.create({
       name,
       email,
       password: hashedPassword, 
    })

    const token = jwt.sign({_id: user._id}, "vdchjvbsjbcvbdscvjhakappqi");

    res.cookie("token", token,{
        httpOnly: true, 
        expires: new Date(Date.now()+ 60*1000), });
    res.redirect("/"); 
})






app.get("/logout", (req, res)=>{
    res.cookie("token", null, {
        httpOnly: true,
        expires: new Date(Date.now()), 
    });
    res.redirect("/");
});


    
app.listen(3000, ()=>{
    console.log("Server is running.")
})
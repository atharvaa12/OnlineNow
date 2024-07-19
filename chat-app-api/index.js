const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const mongoose = require("mongoose");
const cookieParser=require("cookie-parser");
const cors = require("cors");
const UserModel = require("./models/User");
const jwt = require("jsonwebtoken");
const app = express();

app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser())
mongoose.connect(process.env.MONGO_URL);
const jwtSecret = process.env.JWT_SECRET;
app.get("/test", (req, res) => {
  res.json("Hello World");
});
app.get('/profile',(req,res)=>{
    const token=req.cookies?.token;
    if(token){
        jwt.verify(token,jwtSecret,{},(err,decodedToken)=>{
            if(err) throw err;
            res.json(decodedToken);
        });
    }
    else{
        res.status(401).json({message:"no token"});
    }
});
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const createdUser = await UserModel.create({ username, password });

    console.log(createdUser);
    jwt.sign({userId:createdUser._id},jwtSecret,{},(err,token)=>{
        if(err) throw err;
        res.cookie('token',token,{sameSite:"none", secure:true}).status(200).json({id:createdUser._id,username});
    });
    
  } catch (err) {
    if(err) throw err;
   
  }
});
app.listen(4000, () => {
  console.log("Listening on port 4000");
});

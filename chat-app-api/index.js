const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const UserModel = require("./models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const app = express();
const salt = bcrypt.genSaltSync(10);
const ws = require("ws");
const MessageModel = require("./models/Message");
app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
mongoose.connect(process.env.MONGO_URL);
const jwtSecret = process.env.JWT_SECRET;
app.get("/test", (req, res) => {
  res.json("Hello World");
});
app.post('/logout',(req,res)=>{
  res.cookie('token','',{sameSite:'none',secure:true}).json('ok');
});
app.get("/messages/:userId", (req, res) => {
  const { userId } = req.params;
  const token = req.cookies?.token;
  if (token) {
    jwt.verify(token, jwtSecret, {}, async (err, decodedToken) => {
      if (err) throw err;
      try {
        const messages = await MessageModel.find({
          $or: [
            { sender: userId, receiver: decodedToken.userId },
            { sender: decodedToken.userId, receiver: userId },
          ],
        }).sort({ createdAt: 1 });
        res.json(messages);
      } catch (e) {
        res.status(500).json({ message: "error fetching messages" });
      }
    });
  } else {
    res.status(401).json({ message: "no token" });
  }
});
app.get("/profile", (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    jwt.verify(token, jwtSecret, {}, (err, decodedToken) => {
      if (err) throw err;
      res.json(decodedToken);
    });
  } else {
    res.status(401).json({ message: "no token" });
  }
});
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const createdUser = await UserModel.create({
      username,
      password: bcrypt.hashSync(password, salt),
    });

    console.log(createdUser);
    jwt.sign(
      { userId: createdUser._id, username },
      jwtSecret,
      {},
      (err, token) => {
        if (err) throw err;
        res
          .cookie("token", token, { sameSite: "none", secure: true })
          .status(200)
          .json({ id: createdUser._id, username });
      }
    );
  } catch (err) {
    if (err) throw err;
  }
});
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const foundUser = await UserModel.findOne({ username });
    if (foundUser) {
      const isPasswordCorrect = bcrypt.compareSync(
        password,
        foundUser.password
      );
      if (isPasswordCorrect) {
        jwt.sign(
          { userId: foundUser._id, username },
          jwtSecret,
          {},
          (err, token) => {
            if (err) throw err;
            res
              .cookie("token", token, { sameSite: "none", secure: true })
              .status(200)
              .json({ id: foundUser._id, username });
          }
        );
      } else {
        res.status(401).json({ message: "incorrect password" });
      }
    } else {
      res.status(401).json({ message: "no user found" });
    }
  } catch (e) {
    console.log(e);
  }
});

const server = app.listen(4000, () => {
  console.log("Listening on port 4000");
});
const wss = new ws.WebSocketServer({ server });
wss.on("connection", (connection, req) => {
  const cookies = req.headers.cookie;
  if (cookies) {
    let tokenCookieArray = cookies.split(";");
    const trimmedCookieArray = tokenCookieArray.map((c) => c.trim());

    console.log(trimmedCookieArray);
    const tokenCookieString = trimmedCookieArray.find((c) =>
      c.startsWith("token")
    );

    console.log(tokenCookieString);
    if (tokenCookieString != undefined) {
      const token = tokenCookieString.split("=")[1];
      jwt.verify(token, jwtSecret, {}, (err, decodedToken) => {
        if (err) {
            console.log(err);
        }else{
        const { userId, username } = decodedToken;
        connection.userId = userId;
        connection.username = username;
        }
      });
    }
  }
  [...wss.clients].forEach((client) => {
    if (client.readyState === ws.OPEN && client.userId) {
      const onlineClients = [...wss.clients]
        .filter(c => c.readyState === ws.OPEN && c.userId)
        .map(c => ({
          userId: c.userId,
          username: c.username
        }));
      
      client.send(JSON.stringify({ online: onlineClients }));
    }
  });
  
  connection.on('close',()=>{
    [...wss.clients].forEach((client) => {
      if (client.readyState === ws.OPEN && client.userId) {
        const onlineClients = [...wss.clients]
          .filter(c => c.readyState === ws.OPEN && c.userId)
          .map(c => ({
            userId: c.userId,
            username: c.username
          }));
        
        client.send(JSON.stringify({ online: onlineClients }));
      }
    });
    
  });
  connection.on("message", async (message) => {
    console.log(JSON.parse(message));
    const parsedMessageJson = JSON.parse(message);
    const messageString = parsedMessageJson.message;
    const senderId = parsedMessageJson.sender;
    const receiverId = parsedMessageJson.receiver;

    const messageDoc = await MessageModel.create({
      sender: senderId,
      receiver: receiverId,
      message: messageString,
    });
    const receivers = [...wss.clients].filter((c) => c.userId === receiverId);

    const messageToSend = JSON.stringify({ message: messageString, senderId });
    if (receivers.length > 0) {
      receivers.forEach((r) => r.send(messageToSend));
    }
  });
});





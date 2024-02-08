// import required libraries and packages
const cors = require('cors');
const bcrypt = require('bcrypt');
const express = require('express');
const app = express();
app.use(cors());
app.use(express.json({ extended: false }));

// to generate random ID's
const { v4: uuidv4 } = require('uuid');

// start up Mongodb: brew services start mongodb-community@7.0
// connect to Mongodb: mongosh
const mongoose = require('mongoose');
// connect to MongoDB
mongoose.connect('mongodb://localhost:27017/todo', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
const connection = mongoose.connection;
connection.once('open', () => {
    console.log('MongoDB database connection established successfully');
});

// create Mongoose models

const TodoSchema = new mongoose.Schema({
    message: String,
    finished: Boolean,
    date: String,
    subtasks: Array,
    id: String,
    user_id: String
});
const Todo = mongoose.model('Todo', TodoSchema);

const UserSchema = new mongoose.Schema({
    username: String,
    password_hash: String,
    user_id: String
});
const User = mongoose.model('User', UserSchema);

// variables to keep track of which list is selected and user
let listMain;
let userMain;
let user_idMain;


// send list to client
app.get("/todos", async (req, res) => {
    listMain = await Todo.find({ user_id: user_idMain }).exec();
    res.status(200).json(listMain.slice().sort((a, b) => a.date - b.date));
});

// send user to client
app.get("/user", (req, res) => {
    res.status(200).json({ username: userMain, user_id: user_idMain });
});

// post list info to client
app.post("/todos", async (req, res) => {
    // if adding todo to list
    if (req.body.type == "addTodo") {
        const newTodo = new Todo({
            message: req.body.message,
            date: req.body.date,
            finished: false,
            subtasks: [],
            id: uuidv4(),
            user_id: user_idMain
        });
        // add to list
        await newTodo.save();
    }
    // if removing todo from list
    else if (req.body.type == "removeTodo") {
        // remove the todo item
        await Todo.deleteOne({ id: req.body.id });
    }
    // if changing todo to finished
    else if (req.body.type == "finishedTodo") {
        let item = await Todo.findOne({ id: req.body.id });
        // change finished to true
        item.finished = true;
        await item.save();
    }
    // if editing todo
    else if (req.body.type == "editTodo") {
        let item = await Todo.findOne({ id: req.body.id });
        // change properties
        item.message = req.body.message;
        item.date = req.body.date;
        item.finished = req.body.finished;
        await item.save();
    }
    // if adding subtask
    else if (req.body.type == "subtask") {
        let item = await Todo.findOne({ id: req.body.id });
        // add subtask to subtask list
        item.subtasks.push(req.body.subtask);
        await item.save();
    }
    listMain = await Todo.find({ user_id: user_idMain }).exec();
    res.status(200).json(listMain.slice().sort((a, b) => a.date - b.date));
});

// post for user information
app.post("/user", async (req, res) => {
    // if login/create user
    if (req.body.type === 'LCUser') {
        const u = await User.findOne({ username: req.body.username });
        // if username is in the database
        if (u) {
            // if password is correct
            if (await bcrypt.compare(req.body.password, u.password_hash)) {
                userMain = u.username;
                user_idMain = u.user_id;
                res.status(200).json({ username: userMain, user_id: user_idMain });
                // if password is incorrect    
            } else {
                res.status(200).json(null);
            }
            // if username not in the database
        } else {
            id = uuidv4();
            const newUser = new User({
                username: req.body.username,
                password_hash: await bcrypt.hash(req.body.password, 10),
                user_id: uuidv4()
            });
            // add user to database
            await newUser.save();
            userMain = req.body.username;
            user_idMain = id;
            res.status(200).json({ username: userMain, user_id: user_idMain });
        }
        // if logging out
    } else if (req.body.type === 'logout') {
        listMain = [];
        userMain = null;
        user_idMain = null;
        listMain = await Todo.find({ user_id: user_idMain }).exec();
        res.status(200).json(listMain.slice().sort((a, b) => a.date - b.date));
    }
});



const PORT = 5001
app.listen(PORT, () => {
    console.log('Server running on port: ' + PORT);
});
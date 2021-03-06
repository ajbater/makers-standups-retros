import path from 'path';
import { Server } from 'http';
import Express from 'express'
import React from 'react';
import { renderToString } from 'react-dom/server';
import HomePage from './components/HomePage';
import RetroPage from './components/RetroPage';
import StandupPage from './components/StandupPage';
import socketIo from 'socket.io';
import mongoose from 'mongoose'
import MongoItem from './models/mongoItem'

var url = "mongodb://localhost:/standups"
mongoose.connect(url);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error: '));
db.once('open', function() {
  console.log('We\'re connected!');
});

const app = new Express();
const server = new Server(app);
const io = socketIo(server);

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(Express.static(path.join(__dirname, 'static')));
app.use('/standups', Express.static(path.join(__dirname, 'static')));
app.use('/retros', Express.static(path.join(__dirname, 'static')));

app.get('/', (req, res) => {
  let markup = renderToString(<HomePage/>)
  res.render('template', {markup});
});

app.get('/standups/:id', (req, res) => {
  let markup = renderToString(<StandupPage/>)
  res.render('template', {markup})
})

app.get('/retros/:id', (req,res) => {
  let markup = renderToString(<RetroPage/>)
  res.render('template', {markup})
})

app.post('/items', (req, res) => {
  let mongoItem = new MongoItem ();
  mongoItem.text = req.body.text;
  mongoItem.listId = req.body.listId
  mongoItem.itemId = req.body.itemId
  mongoItem.clicks = req.body.clicks
  mongoItem.color = req.body.userColor
  mongoItem.font = req.body.userFont
  mongoItem.userId = req.body.userId
  mongoItem.save(function(err) {
  if (err) {
    console.log("Error:", err);
    res.send(err);
  }
  });
  res.json(mongoItem)
})

app.get('/items', (req, res) => {
  MongoItem.find({}, function(err,info) {
    if (err) {
      console.log("Error:", err);
      res.send(err);
    }
    res.json(info)
  });
})

io.on('connection', function(socket){
  socket.nickname = 'Unknown';
  console.log( socket.nickname + ' connected');
  socket.on('disconnect', function(){
    console.log( socket.nickname + ' disconnected');
    if(socket.nickname !== "Unknown" && io.nsps['/'].adapter.rooms[socket.nickname]){
      let clientsRoom = io.nsps['/'].adapter.rooms[socket.nickname].sockets;
      let numClients = (typeof clientsRoom !== 'undefined') ? Object.keys(clientsRoom).length : 0;
      io.to(socket.nickname).emit('leave', { socket: socket.id,
        users: numClients});
    }
  });
  socket.on('comment event', function(data) {
    socket.broadcast.emit('update list', data);
  });
  socket.on('counter event', function(data) {
    socket.broadcast.emit('update counter', data);
  });
  socket.on('room', function(data) {

    socket.nickname = data.boardId
    socket.join(data.boardId);
    let clientsRoom = io.nsps['/'].adapter.rooms[data.boardId].sockets;
    let numClients = (typeof clientsRoom !== 'undefined') ? Object.keys(clientsRoom).length : 0;
    io.to(data.boardId).emit('entered', {users: numClients,
                                        name: data.name,
                                        socketId: data.socketId,
                                        color: data.color,
                                        font: data.font});
  });
  socket.on('name', function(data) {

    io.to(data.room).emit('update names', { socket: socket.id,
    name: data.name })
  });

  socket.on('new user', function(data) {

    io.to(data.room).emit('update users', {userNames: data.userNames })
  });

  socket.on('new chat', function(data) {
    console.log(data);
    io.emit('update chat', data)
  });
});


const port = process.env.PORT || 3000;
const env = process.env.NODE_ENV || 'production';
server.listen(port, err => {
  if (err) {
    return console.error(err);
  }
  console.info(`Server running on http://localhost:${port} [${env}]`);
})

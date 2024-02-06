var express = require('express');
const Keycloak = require('keycloak-connect');
const session = require('express-session');

var app = express();
app.set('view engine', 'ejs');

let memoryStore = new session.MemoryStore();
let keycloak = new Keycloak({ store: memoryStore }, 'keycloak.json');

app.use(session({
    secret: 'Secret',
    resave: false,
    saveUninitialized: true,
    store: memoryStore
  }));

app.use(keycloak.middleware());
app.use('/views/img', express.static("/Users/shaniceehioghiren/Documents/poc-keycloak/views/img"));



app.get("/", function(req, res){
    res.render("home");
});

app.get("/bye", keycloak.protect(), function(req, res){
  res.render("bye"); 
});

app.get('/protected/resource', keycloak.protect(), function(req, res){
    res.send("Protected content");
  });

app.listen(port=3000, function(){
    console.log("server is running on port " + port);
});



app.use(keycloak.middleware({
  logout: '/logout',
  admin: '/',
  protected: '/protected/resource'
}));
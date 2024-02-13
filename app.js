var express = require("express");
const Keycloak = require("keycloak-connect");
const session = require("express-session");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

var app = express();
app.set("view engine", "ejs");
app.use(cookieParser());

const keycloakPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwkKTgEE7R5nK3gWyBjEWsxchwmtJAdYYu37rtZs0cSzRy+hB/xc0q0hd/AS1BZ7HMOR3+6/XGkEbVB7B5D5u9xFEIV6Hile
UsY0vqAebFxOOitSl8qXs6ec7jOYKEpN8AO0Z1lVDhzfvxck7iRkHVYik86sbtj8AY5UH9bP7dGt5UNyyleLcTn13SkmocQh9MzCFebZBh+w4PNttoIoSbFftc9QY/shVVxsXeA1Xo4p2EHMpzHci+uXykAboS3VZuM7DJiGfJl68QGmibI2BlSe5n4dAebOzlUckWrKfnv2nEu03Uw90k9y/91kUzupWMVWxcC1m4EG4uls9YV6powIDAQAB
-----END PUBLIC KEY-----`;

const validateToken = (req, res, next) => {
  const token = req.session.token;

  if (!token) {
    return res.status(403).send("A token is required for authenticication");
  }

  try {
    const decoded = jwt.verify(token, keycloakPublicKey, {
      algorithms: ["RS256"],
    });
    console.log("Token is valid", decoded);
    next();
  } catch (err) {
    return res.status(401).send("Invalid token");
  }
};
let memoryStore = new session.MemoryStore();
let keycloak = new Keycloak({ store: memoryStore }, "keycloak.json");

app.use(
  session({
    secret: "Secret",
    resave: false,
    saveUninitialized: true,
    store: memoryStore,
  })
);

app.use(keycloak.middleware());
app.use(
  "/views/img",
  express.static("/Users/shaniceehioghiren/Documents/poc-keycloak/views/img")
);

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/bye", keycloak.protect(), async function (req, res) {
  try {
    const grant = await keycloak.getGrant(req, res);
    const token = grant.access_token.token;
    console.log(`Found token: ${JSON.stringify(token)}`);
    req.session.token = token;

    const userProfile = await keycloak.grantManager.userInfo(token);
    console.log("Found user profile", userProfile);

    res.render("bye", { userProfile: userProfile });
  } catch (err) {
    console.error("Error fetching user profile or token", err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/protected/resource", keycloak.protect(), function (req, res) {
  res.send("Protected content");
});

app.get("/ressource", validateToken, (req, res) => {
  res.render("ressource");
});

app.listen((port = 3000), function () {
  console.log("server is running on port " + port);
});

app.use(
  keycloak.middleware({
    logout: "/logout",
    admin: "/",
    protected: "/protected/resource",
  })
);

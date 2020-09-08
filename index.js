const express = require("express")
const session = require("express-session")
const bodyparser = require("body-parser")
const cookieparser = require("cookie-parser")
const path = require("path")
const hbs = require("hbs")
const mongoose = require("mongoose")
const dogPost = require("./models/dogposts.js").dogPost
const Requests = require("./models/requests.js").Requests
const Users = require("./models/users.js").Users

const app = express()

//connecting to mongodb 
mongoose.connect("mongodb://127.0.0.1:27017/doggymate-db",{
    useNewUrlParser: true
})

app.use(session({
    secret: "very secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000*60*60*24*7 //7 days
    }
}))

app.use(cookieparser())
app.use(express.static(path.join(__dirname, '/public')));

const urlencoder = bodyparser.urlencoded({
    extended: false
})

hbs.registerPartials(__dirname + '/views/partials');

app.set("view engine", "hbs")

let users = []

//start of index
app.get("/", function(req, res){
    let data = {}
    
    if(req.session.username){
        data.username = req.session.username
    }

    dogPost.find({}).sort({favecount: -1}).limit(5).then((doc)=>{
        data.dogpost = doc

        res.render("index.hbs", data)
    })
})

app.get("/home", (req,res)=>{
    res.redirect("/")
})
//end of index

//start of browse
app.get("/browse", (req,res)=>{
    let data = {}
    req.session.redirectTo = "/browse"

    if(req.session.username){
        data.username = req.session.username
    }

    dogPost.find({}).sort({date: -1}).then((doc)=>{
        data.dogpost = doc
        data.bynew = true
        res.render("browse.hbs", data)
    })

})

app.get("/search", function(req, res){
    let data = {}
    
    if(req.session.username){
        data.username = req.session.username
    }
    /* for search
    or([
            {username: req.query.q},
            {dogname: req.query.q}, 
            {breed: req.query.q}, 
            {location: req.query.q}, 
            {gender: req.query.q},
            {dogdesc: req.query.q}])        
    */
    if(req.query.q == ""){
        if(req.query.sortby == "bynew"){
            dogPost.find({}).sort({date: -1}).then((doc)=>{
                    data.dogpost = doc 
                    data.bynew = true
                    res.render("browse.hbs", data)
            })
        }else if(req.query.sortby == "byfavorite"){
            dogPost.find({}).sort({favecount: -1, date: -1}).then((doc)=>{
                    data.dogpost = doc 
                    data.byfavorite = true   
                    res.render("browse.hbs", data)
            })
        }else if(req.query.sortby == "bybreed"){
            dogPost.find({}).sort({breed: 1, date: -1}).then((doc)=>{
                    data.dogpost = doc 
                    data.bybreed = true   
                    res.render("browse.hbs", data)
            })
        }
    }else{
        if(req.query.sortby == "bynew"){
            dogPost.find({}).sort({date: -1}).or([
                {username: req.query.q},
                {dogname: req.query.q}, 
                {breed: req.query.q}, 
                {location: req.query.q}, 
                {gender: req.query.q},
                {dogdesc: req.query.q}]).then((doc)=>{
                    data.dogpost = doc 
                    data.bynew = true
                    res.render("browse.hbs", data)
            })
        }else if(req.query.sortby == "byfavorite"){
            dogPost.find({}).sort({favecount: -1}).or([
                {username: req.query.q},
                {dogname: req.query.q}, 
                {breed: req.query.q}, 
                {location: req.query.q}, 
                {gender: req.query.q},
                {dogdesc: req.query.q}]).then((doc)=>{
                    data.dogpost = doc 
                    data.byfavorite = true   
                    res.render("browse.hbs", data)
            })
        }else if(req.query.sortby == "bybreed"){
            dogPost.find({}).sort({breed: 1}).or([
                {username: req.query.q},
                {dogname: req.query.q}, 
                {breed: req.query.q}, 
                {location: req.query.q}, 
                {gender: req.query.q},
                {dogdesc: req.query.q}]).then((doc)=>{
                    data.dogpost = doc 
                    data.bybreed = true   
                    res.render("browse.hbs", data)
            })
        }
    }
    /*else if(req.query.sortby == "bylocation"){
        dogPost.find({}).sort({location: 1}).then((doc)=>{
                data.dogpost = doc   
                data.bylocation = true 
                res.render("browse.hbs", data)
        })
    }*/
})
//end of browse

// start for creating a post 
app.get("/postedit", (req,res)=>{
    if(req.session.username){
        //if user signed in
        res.render("postedit.hbs", {
            username: req.session.username
        })
    }else{
        //if user not signed in

        // change this to error message or smth 
        res.render("postedit.hbs", {
            error: "This content is only available for members. Please log in first."
        })
    }
})

app.get("/postcreate", (req,res)=>{
    if(req.session.username){
        //if user signed in
        res.render("postcreate.hbs", {
            username: req.session.username
        })
    }else{
        //if user not signed in
        // change this to error message or smth 
        res.render("login.hbs", {
            error: "This content is only available for members. Please log in first."
        })
    }
})

app.post("/createpost", urlencoder, (req,res)=>{
    let username = req.session.username
    let dogname = req.body.dogname
    let breed = req.body.breed
    let dogage = req.body.dogage
    let dogender = req.body.dogender
    let location = req.body.location
    let dogdesc = req.body.dogdesc
    let favecount = 0
    let err = {}

    if(dogname==""||breed==""||dogage==""||location==""||dogender=="blank"){ 
        err.e = true 
        if(dogname ==  ""){
            err.error_dogname = "Enter name"
        }
        if(breed == ""){
            err.error_breed = "Enter breed"
        }
        if(dogage == ""){
            err.error_dogage = "Enter age"
        }
        if(location == ""){
            err.error_location = "Enter location"
        }
        if(dogender == "blank"){
            err.error_dogender = "Enter gender"
        }
        res.render("postcreate.hbs", err)
    }else{

        let date = new Date();
        let dogpost = new dogPost({
                username: username, 
                dogname: dogname, 
                breed: breed, 
                location: location, 
                dogage: dogage, 
                gender: dogender, 
                dogdesc: dogdesc,
                favecount: favecount, 
                date: date
            })
   
        dogpost.save().then((doc)=>{
            console.log("Successfully added: " + doc)
        }, (err)=>{
            console.log("Error in adding: " + doc)
        })

        res.redirect("/browse") 
    }
})

app.get("/cancel", (req,res)=>{
    res.redirect("/browse")
})
// end for creating a post 

// start for seeing a specific post 
app.get("/post:_id", function(req,res){
    let data = {}

    if(req.session.username){
        data.username = req.session.username
        dogPost.find({'username': req.session.username}).then((doc)=>{
            data.dogpostreq = doc
        })
    }

    dogPost.find({'_id': req.params._id}).then((doc)=>{
        data.dogpost = doc

        res.render("post.hbs", data)
    })
})

app.get('/prevpage', function(req,res){
    var redirectTo = req.session.redirectTo || '/';
    delete req.session.redirectTo;
    res.redirect(redirectTo);
})

app.post("/sendrequest", urlencoder, (req,res)=>{
    let username = req.session.username
    let dogownername = req.body.dogownername
    let dog_id = req.body.dog_id
    let venue = req.body.venue
    let date = req.body.date
    let time = req.body.time

    let request = new Requests({
        username: username,  
        dogownername: dogownername,
        dog_id: dog_id, 
        venue: venue, 
        date: date,
        time: time,
        approval: "pending"
    })

    request.save().then((request)=>{
        console.log("Successfully added: " + request)
    }, (err)=>{
        console.log("Error in adding: " + request)
    })

    res.redirect("/browse")
})
//end for seeing a specific post


app.get("/requests-sent", (req,res)=>{
    let data = {}
    req.session.redirectTo = "/requests-sent"

    if(req.session.username){
        data.username = req.session.username

        Requests.aggregate([
            {$match: {username: req.session.username}},
            {$set: {dog_id: {$toObjectId: "$dog_id"}}},
            {$lookup:
                {
                  from: "dogposts",
                  localField: 'dog_id',
                  foreignField: '_id',
                  as: "dogpost"
                }
           }
         ]).then((doc)=>{
            data.sentrequests = doc
            data.sentrequestsbox = true
            res.render("requests.hbs", data)
        })
    }else{
        res.render("login.hbs", {
            error: "This content is only available for members. Please log in first."
        })
    }
})

app.get("/requests-received", (req,res)=>{
    let data = {}
    req.session.redirectTo = "/requests-received"

    if(req.session.username){
        data.username = req.session.username

        Requests.aggregate([
            {$match: {dogownername: req.session.username}},
            {$set: {dog_id: {$toObjectId: "$dog_id"}}},
            {$lookup:
                {
                  from: "dogposts",
                  localField: 'dog_id',
                  foreignField: '_id',
                  as: "dogpost"
                }
           }
         ]).then((doc)=>{
            data.receivedrequests = doc
            data.receivedrequestsbox = true
            res.render("requests.hbs", data)
        })
    }else{
        res.render("login.hbs", {
            error: "This content is only available for members. Please log in first."
        })
    }
})

app.get("/login", (req,res)=>{
    res.render("login.hbs")
})

app.post("/signin", urlencoder, (req,res)=>{
    let username=req.body.username
    let password=req.body.password

    if(username==""||password==""){ 
        res.render("login.hbs", {
            error: "Enter username and password"
        })
    }else{
        Users.find({'username': username, 'password': password}).then((doc)=>{
            if(doc.length == 0){
                res.render("login.hbs",{
                    error:"Username and password do not match"
                })
            }else{
                req.session.username = req.body.username
                res.redirect("/")
            }
        })
    }
})

app.get("/register", (req,res)=>{
    res.render("register.hbs")
})
app.post("/signup", urlencoder, (req,res)=>{
    let firstname = req.body.firstname
    let lastname = req.body.lastname
    let email = req.body.email
    let username = req.body.username
    let password = req.body.password
    let description = req.body.description

    if(firstname=="" || lastname=="" || email=="" || username=="" || password==""){
        res.render("register.hbs",{
            error: "Incomplete Input"
        })
    }else{
        Users.find({'username': req.body.username}).then((doc)=>{
            if(doc.length != 0){
                res.render("register.hbs",{
                    error: "Username already exists. Input a different username."
                })
            }else{
                req.session.username = req.body.username

                let user = new Users({
                    firstname:firstname,
                    lastname:lastname,
                    email:email,
                    username:username,
                    password:password,
                    description:description
                })

                user.save().then((doc)=>{
                    console.log("Successfully added: " + doc)
                }, (err)=>{
                    console.log("Error in adding: " + doc)
                })
        
                res.redirect("/")
            }
        })
    }
})

app.get("/profile-:username", (req,res)=>{
    let data = {}

    if(req.session.username){
        data.username = req.session.username
    }
    
    Users.aggregate([
        {$match: {'username': req.params.username}},
        {$lookup:
            {
              from: "dogposts",
              localField: 'username',
              foreignField: 'username',
              as: "dogpost"
            }
       }
     ]).then((doc)=>{
        data.user = doc
        res.render("profile.hbs", data)
    })
    
})

app.get("/logout", (req,res)=>{
    req.session.destroy()
    res.redirect("/")
})

app.listen(3000, function(){
    console.log("Now listening to port 3000")
})
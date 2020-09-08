const mongoose = require("mongoose")

let dogPost = mongoose.model("dogpost",{
    username: String, 
    dogname: String, 
    breed: String, 
    location: String, 
    dogage: Number, 
    gender: String, 
    dogdesc: String,
    favecount: Number,
    date: Date
})

module.exports = {
    dogPost
}
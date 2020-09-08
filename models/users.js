const mongoose = require("mongoose")

let Users = mongoose.model("users",{
    username: String, 
    password: String,
    firstname: String,
    lastname: String,
    email: String,
    description: String
})

module.exports = {
    Users
}
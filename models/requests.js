const mongoose = require("mongoose")

let Requests = mongoose.model("request",{
    username: String, 
    dogownername: String,
    dog_id: String, 
    venue: String, 
    date: Date,
    time: String,
    approval: String
})

module.exports = {
    Requests
}
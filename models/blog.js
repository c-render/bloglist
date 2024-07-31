require('dotenv').config()
const mongoose = require('mongoose')

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: 5
  },
  author: {
    type: String,
    required: true,
    minlength: 3
  },
  url: {
    type:String,
    required: true
  },
  likes: Number,
})

blogSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

if (process.env.NODE_ENV !== 'test') {
  module.exports = mongoose.model('Blog', blogSchema)
} else {
  module.exports = mongoose.model('TestBlog', blogSchema)
}
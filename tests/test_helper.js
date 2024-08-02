const Blog = require('../models/blog')
const User = require('../models/user')

// for login
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)

const initialBlogs = [
    { title: 'New blog', author: 'John Doe', url: 'http://example.com', likes: 0 },
    { title: 'Another blog', author: 'Jane Doe', url: 'http://example.com', likes: 0 }
  ]

const nonExistingId = async () => {
  const blog = new Note({ title: 'willremovethissoon' })
  await blog.save()
  await blog.deleteOne()

  return blog._id.toString()
}

const blogsInDb = async () => {
  const blogs = await Blog.find({})
  return blogs.map(blog => blog.toJSON())
}

const usersInDb = async () => {
  const users = await User.find({})
  return users.map(user => user.toJSON())
}

const initialUserToken = async () => {
  const usersAtStart = await usersInDb()
  const user = usersAtStart[0]

  response = await api
    .post('/api/login')
    .send({
      username: user.username,
      password: 'sekret'
    })
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const token = response.body.token.toString()
  return token
}

module.exports = {
  initialBlogs, 
  initialUserToken,
  nonExistingId, 
  blogsInDb,
  usersInDb
}
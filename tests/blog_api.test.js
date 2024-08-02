const { test, after, beforeEach } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const helper = require('./test_helper')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)

const Blog = require('../models/blog')

const User = require('../models/user')
const bcrypt = require('bcrypt')

beforeEach(async () => {
  // Create a user to be able to test
  //await User.deleteMany({})
  //console.log('users cleared')
  //const passwordHash = await bcrypt.hash('sekret', 10)
  //const user = new User({ username: 'root', name: 'Superuser', passwordHash })
  //const savedUser = await user.save()
  //console.log('root user created')

  await Blog.deleteMany({})

  // *** forEach method fails, because tests start during single forEach ***
  //helper.initialBlogs.forEach(async (blog) => {
  //  let blogObject = new Blog(blog)
  //  await blogObject.save()
  //  console.log('saved')
  //})
  

  // *** Promise.all method (order not defined) ***
  //const blogObjects = helper.initialBlogs
  //  .map(blog => new Blog(blog))
  //const promiseArray = blogObjects.map(blog => blog.save())
  //await Promise.all(promiseArray)

  // *** for...of method (order defined) ***
  for (let blog of helper.initialBlogs) {
    //blog = {...blog, user: savedUser.id}
    let blogObject = new Blog(blog)
    await blogObject.save()
  }
  
})

test('blogs are returned as json', async () => {
  const token = await helper.initialUserToken()
  await api
    .get('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('all blogs are returned', async () => {
  const token = await helper.initialUserToken()
  const response = await api
    .get('/api/blogs')
    .set('Authorization', `Bearer ${token}`)

  assert.strictEqual(response.body.length, helper.initialBlogs.length)
})

test('the first blog is a new blog', async () => {
  const token = await helper.initialUserToken()
  const response = await api
    .get('/api/blogs')
    .set('Authorization', `Bearer ${token}`)

  const titles = response.body.map(e => e.title)

  assert(titles.includes('New blog'))
})

test('a valid blog can be added ', async () => {

  const token = await helper.initialUserToken()

  const newBlog = { title: 'Yet another blog', author: 'Willy Doe', url: 'http://example.com', likes: 0}

  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await helper.blogsInDb()
  assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1)

  const titles = blogsAtEnd.map(r => r.title)
  assert(titles.includes('Yet another blog'))
})

test('blog without content is not added', async () => {

  const token = await helper.initialUserToken()

  const newBlog = {
    likes: 0,
    // user: user.id
  }

  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)
    .expect(400)

  const blogsAtEnd = await helper.blogsInDb()

  assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
})

test('a specific blog can be viewed', async () => {
  const blogsAtStart = await helper.blogsInDb()

  const blogToView = blogsAtStart[0]

  const token = await helper.initialUserToken()

  const resultBlog = await api
    .get(`/api/blogs/${blogToView.id}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  assert.deepStrictEqual(resultBlog.body, blogToView)
})

test('a blog can be deleted', async () => {
  const blogsAtStart = await helper.blogsInDb()
  const blogToDelete = blogsAtStart[0]
  
  const token = await helper.initialUserToken()

  await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(204)

  const blogsAtEnd = await helper.blogsInDb()

  const titles = blogsAtEnd.map(r => r.title)
  assert(!titles.includes(blogToDelete.title))

  assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1)
})

test('likes for a blog can be incremented', async () => {
  const blogsAtStart = await helper.blogsInDb()
  const blogToChange = blogsAtStart[0]

  const updatedBlog = { ...blogToChange, likes: blogToChange.likes + 1 }
  
  const token = await helper.initialUserToken()

  await api
    .put(`/api/blogs/${blogToChange.id}`)
    .set('Authorization', `Bearer ${token}`)
    .send(updatedBlog)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await helper.blogsInDb()

  assert.strictEqual(blogsAtStart[0].likes + 1, blogsAtEnd[0].likes)
})

after(async () => {
  await mongoose.connection.close()
})
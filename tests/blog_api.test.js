const { test, after, beforeEach } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const helper = require('./test_helper')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)

const Blog = require('../models/blog')

const initialBlogs = [
  { title: 'New blog', author: 'John Doe', url: 'http://example.com', likes: 0 },
  { title: 'Another blog', author: 'Jane Doe', url: 'http://example.com', likes: 0 }
]

beforeEach(async () => {
  await Blog.deleteMany({})
  //console.log('cleared')

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
    let blogObject = new Blog(blog)
    await blogObject.save()
    //console.log('saved')
  }
  
  //console.log('done')
})

test('notes are returned as json', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('all blogs are returned', async () => {
  const response = await api.get('/api/blogs')

  assert.strictEqual(response.body.length, helper.initialBlogs.length)
})

test('the first blog is a new blog', async () => {
  const response = await api.get('/api/blogs')
  //console.log(response.body)
  const titles = response.body.map(e => e.title)
  //console.log(titles)
  //console.log(titles.includes('New blog'))
  //assert.strictEqual(titles.includes('New blog'), true)
  assert(titles.includes('New blog'))
})

test('a valid blog can be added ', async () => {
  const newBlog = { title: 'Yet another blog', author: 'Willy Doe', url: 'http://example.com', likes: 0 }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await helper.blogsInDb()
  assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1)

 
  const titles = blogsAtEnd.map(r => r.title)
  assert(titles.includes('Yet another blog'))
})

test('blog without content is not added', async () => {
  const newBlog = {
    likes: 0
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(400)

  const blogsAtEnd = await helper.blogsInDb()

  assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
})

test('a specific blog can be viewed', async () => {
  const blogsAtStart = await helper.blogsInDb()

  const blogToView = blogsAtStart[0]
  //console.log(blogToView)

  const resultBlog = await api
    .get(`/api/blogs/${blogToView.id}`)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  assert.deepStrictEqual(resultBlog.body, blogToView)
})

test('a blog can be deleted', async () => {
  const blogsAtStart = await helper.blogsInDb()
  const blogToDelete = blogsAtStart[0]

  await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .expect(204)

  const blogsAtEnd = await helper.blogsInDb()

  const titles = blogsAtEnd.map(r => r.title)
  assert(!titles.includes(blogToDelete.title))

  assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1)
})

after(async () => {
  await mongoose.connection.close()
})
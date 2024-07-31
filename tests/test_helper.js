const Blog = require('../models/blog')

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

module.exports = {
  initialBlogs, nonExistingId, blogsInDb
}
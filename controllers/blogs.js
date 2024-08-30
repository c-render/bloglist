const jwt = require('jsonwebtoken')
const blogsRouter = require('express').Router()

const Blog = require('../models/blog')
const User = require('../models/user')

const getTokenFrom = request => {
    //console.log('getTokenFrom request:', request)
    const authorization = request.get('authorization')
    console.log('getTokenFrom authorization:', authorization)
    if (authorization && authorization.startsWith('Bearer ')) {
        console.log('getTokenFrom returning:', authorization.replace('Bearer ',''))
        return authorization.replace('Bearer ','')
    }
    return null
}

blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog
        .find({})
        .populate('user', { username: 1, name: 1 })
    response.json(blogs)
})

blogsRouter.post('/', async (request, response) => {
    console.log('blogsRouter.post / called with request:', request)
    const body = request.body
    const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)
    console.log('decodedToken:', decodedToken)
    if (!decodedToken.id) {
        return response.status(401).json({ error: 'token invalid' })
    }
    const user = await User.findById(decodedToken.id)

    const blog = new Blog({
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes || 0,
        user: user._id
    })

    //const blogWithUser = blog.populate('user', { username: 1, name: 1 })
    //const savedBlog = await blogWithUser.save()
    const savedBlog = await (await blog.save()).populate('user', { username: 1, name: 1 })

    user.blogs = user.blogs.concat(savedBlog._id)
    const savedUser = await user.save()
    
    response.status(201).json(savedBlog)
})

blogsRouter.get('/:id', async (request, response) => {
    const blog = await Blog.findById(request.params.id)
    if (blog) {
        response.json(blog)
    } else {
        response.status(404).end()
    }
})

blogsRouter.delete('/:id', async (request, response) => {
    await Blog.findByIdAndDelete(request.params.id)
    response.status(204).end()
})

blogsRouter.put('/:id', async (request, response) => {
    const body = request.body

    const blog = {
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes || 0
    }

    const updatedBlog = await ( await Blog.findByIdAndUpdate(request.params.id, blog, { new: true }) ).populate('user', { username: 1, name: 1 })
    response.json(updatedBlog)
})

module.exports = blogsRouter
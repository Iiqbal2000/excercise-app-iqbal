require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')

// DB
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
  })
  .then(() => console.log('Database connected'))
  .catch((error) => console.error(error))

const userLogSchema = mongoose.Schema({
  description: { type: String, required: [true, 'Path `description` is required'] },
  duration: { type: Number, required: [true, 'Path `duration` is required'] },
  date: { type:Date, default: Date.now }
})

const userSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true },
  logs: [userLogSchema]
})

const UserTracker = mongoose.model('UserTracker', userSchema)

// MIDDLEWARE
app.use(cors())
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})

// ROUTE

/*
  GET /api/users
  kembalikan array dari semua user
  {"_id":"5ec3c38cc530e526ad533782","username":"5WfZFvsBK","__v":0}
*/
app.get('/api/users', async (req, res) => {
  // this should be faster to use lean() than without it
  const getAllUsers = await UserTracker.find({}, {_id: 1, username: 1}).lean()
  res.json(getAllUsers)
})

/*
  POST /api/users
  kembalikan {"username":"1pacol","_id":"60e2776c86c0d4057607e62e"}
  jika username sudah dipakai:
    status code 400
    text Username already taken
  
*/
app.post('/api/users', async (req, res) => {
  const { username } = req.body

  try {
    const newUser = new UserTracker({ username })
    const saveNewUser = await newUser.save()
    return res.json({ username, _id: saveNewUser._id })

  } catch(err) {
    return res.status(404).send('Username already taken')
  }

})

/*
POST /api/users/:_id/exercises
 return {"_id":"60e2828886c0d4057607e633","username":"1pacolss","date":"Mon Jul 05 2021","duration":1,"description":"sss"}

*/
app.post('/api/users/:id/exercises', async (req, res) => {
  // console.log(req.params.id)
  const { id } = req.params
  // const { ':_id': _id, description, duration, date } = req.body
  const { description, duration, date } = req.body

  try {
    const addExercise = await UserTracker.findOne({ _id: id })
    if(addExercise == null) {
      throw new mongoose.Error.CastError()
    }
    
    const durationInt = parseInt(duration)
    await addExercise.logs.push({ description, duration: durationInt, date: date == '' ? Date.now() : date })
    const addExerciseSave = await addExercise.save()
    const arr = addExerciseSave.logs[addExerciseSave.logs.length - 1]
    return res.json({
      _id: id,
      username: addExerciseSave.username,
      date: new Date(arr.date).toDateString(),
      duration: arr.duration,
      description: arr.description
    })


  } catch(err) {
    if(err instanceof mongoose.Error.ValidationError) {
      let keyObjErrField = Object.keys(err.errors)[0]
      return res.status(400).send(err.errors[keyObjErrField].message)
    } else if(err instanceof mongoose.Error.CastError) {
      return res.status(500).send(`Cast to ObjectId failed for value "${id}" at path "_id" for model "Users"`)
    }
    console.log(err)
  }
})

/*
GET /api/users/:_id/logs
{"_id":"5ec4d098d25eac01aaf8ac76","username":"fcc_test_15899567602","count":2,"log":[{"description":"Tennis","duration":15,"date":"Mon Dec 14 2020"},{"description":"test","duration":60,"date":"Mon Jan 01 1990"}]}

Cast to ObjectId failed for value "5ec4d098d25eac01aaf8ac761" at path "_id" for model "Users"

*/
app.get('/api/users/:id/logs', async (req, res) => {
  const { id } = req.params
  const { from, to, limit } = req.query
  try {

    const getUser = await UserTracker.findOne({ _id: id }).lean()
    let arrLogs = getUser.logs
    if(from) {
      const fromDate = new Date(from)
      arrLogs = arrLogs.filter(arr => new Date(arr.date) >= fromDate)
    }

    if(to) {
      const toDate = new Date(to)
      arrLogs = arrLogs.filter(arr => new Date(arr.date) <= toDate)
    }

    if(limit) {
      arrLogs = arrLogs.slice(0, parseInt(limit))
    }
    
    if(!getUser) {
      throw Error()
    }

    return res.json({
      _id: getUser._id,
      username: getUser.username,
      count: getUser.logs.length,
      log: arrLogs
    })

  } catch(err) {
    return res.status(500).send(`Cast to ObjectId failed for value "${id}" at path "_id" for model "Users"`)
  }

})

module.exports = app
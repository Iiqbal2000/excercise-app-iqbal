require('dotenv').config()
const mongoose = require('mongoose')
  
// tells mongoose to use ES6 implementation of promises
mongoose.Promise = global.Promise;
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
})
  
mongoose.connection
  .once('open', () => console.log('Connected!'))
  .on('error', (error) => {
    console.warn('Error : ', error);
  })
    
  // runs before each test
before((done) => {
  mongoose.connection.collections.usertrackers.drop(() => {
    done()
  })
})
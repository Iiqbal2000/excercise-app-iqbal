const app = require('../app')
const request = require('supertest')
const chai = require('chai')
const assert = chai.assert
const expect = chai.expect

let userObj = {};

it('It should return JSON response containing _id, username properties', async () => {
  const res = await request(app)
    .post('/api/users')
    .type('form')
    .send({ username: `user mocha ${Date.now()}` })
  
  if(res.ok) {
    userObj._id = res.body._id
    userObj.username = res.body.username
    assert.exists(res.body._id)
    assert.exists(res.body.username)

  } else {
    throw new Error(`${res.status} ${res.statusText}`);
  }

}).timeout(10000)

it('It should return array of object from all users', async () => {
  const res = await request(app)
    .get('/api/users')
  
  if(res.ok) {
    assert.isArray(res.body);
    assert.isString(res.body[0].username);
    assert.isString(res.body[0]._id);
  } else {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  
}).timeout(10000)

it('It should return response body equal request body', async () => {

  let reqObj = {
    ...userObj,
    description: 'test',
    duration: 60,
    date: 'Mon Jan 01 1990'
  }

  const res = await request(app)
  .post(`/api/users/${reqObj._id}/exercises`)
  .type('form')
  .send({
    description: reqObj.description,
    duration: reqObj.duration,
    date: reqObj.date
  })

  if(res.ok) {
    assert.deepEqual(res.body, reqObj)
  } else {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  
}).timeout(10000)


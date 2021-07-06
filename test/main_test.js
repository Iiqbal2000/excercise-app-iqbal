const app = require('../app')
const request = require('supertest')
const chai = require('chai')
const assert = chai.assert
const expect = chai.expect

let userObj = {};

it('should return JSON response containing _id, username properties', async () => {
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

it('should return array of object from all users', async () => {
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

it('should return response body equal request body', async () => {

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

it('should return the user response object with a log array of all exercises', async () => {
  const logRes = await request(app)
    .get(`/api/users/${userObj._id}/logs`)

  if(logRes.ok) {
    assert.isArray(logRes.body.log)
  } else {
    throw new Error(`${logRes.status} ${logRes.statusText}`)
  }

}).timeout(10000)

it('should return a response with a log array from "from" and "to" queries ', async () => {
  let exerciseObj1 = {
    ...userObj,
    description: 'test',
    duration: 60,
    date: 'Mon Jan 02 1990'
  }

  let exerciseObj2 = {
    ...userObj,
    description: 'test',
    duration: 60,
    date: 'Mon Jan 03 1990'
  }

  try {

    const req1 = await request(app)
      .post(`/api/users/${userObj._id}/exercises`)
      .type('form')
      .send({
        description: exerciseObj1.description,
        duration: exerciseObj1.duration,
        date: exerciseObj1.date
      })

    const req2 = await request(app)
      .post(`/api/users/${userObj._id}/exercises`)
      .type('form')
      .send({
        description: exerciseObj2.description,
        duration: exerciseObj2.duration,
        date: exerciseObj2.date
      })

    const reqWithQueries = await request(app)
      .get(`/api/users/${userObj._id}/logs?from=1990-01-01&to=1990-01-03`)

    assert.strictEqual(3, reqWithQueries.body.count)
    assert.isArray(reqWithQueries.body.log)
    assert.equal(3, reqWithQueries.body.log.length)

  } catch(err) {
    console.error(err)
  }


}).timeout(10000)

it('should return a response with array log property which limit its element', async () => {
  const reqLimitQuery = await request(app)
    .get(`/api/users/${userObj._id}/logs?limit=1`)

  if(reqLimitQuery.ok) {
    assert.equal(1, reqLimitQuery.body.log.length)
  } else {
    throw new Error(`${reqLimitQuery.status} ${reqLimitQuery.statusText}`)
  }
  
}).timeout(10000)
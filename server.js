const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const createError = require('http-errors')
const Flatbush = require('flatbush')
const feuilles = require('./feuilles.json')

/* Index */

const index = new Flatbush(feuilles.length)

for (const {bbox} of feuilles) {
  index.add(bbox[0], bbox[1], bbox[2], bbox[3])
}

index.finish()

/* API */

const app = express()

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
}

app.use(cors({origin: true}))

app.get('/feuilles', (req, res) => {
  if (!req.query.bbox) {
    throw createError(400, 'bbox is required')
  }

  const bbox = req.query.bbox.split(',').map(n => Number.parseFloat(n))

  if (bbox.length !== 4 || bbox.some(n => Number.isNaN(n))) {
    throw createError(400, 'bbox is malformed')
  }

  const results = index.search(...bbox).map(i => feuilles[i])
  res.send(results.map(({id}) => ({id})))
})

const port = process.env.PORT || 5000

app.listen(port, () => {
  console.log('Start listening on port ' + port)
})

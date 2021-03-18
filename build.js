#!/usr/bin/env node
const {join} = require('path')
const {Transform} = require('stream')
const {createGunzip} = require('zlib')
const got = require('got')
const getStream = require('get-stream')
const {parse} = require('geojson-stream')
const getBbox = require('@turf/bbox').default
const {outputJson} = require('fs-extra')

function round(number, precision) {
  return Number.parseFloat(number.toFixed(precision))
}

async function main() {
  let count = 0

  const bboxes = await getStream.array(
    got.stream('https://cadastre.data.gouv.fr/data/etalab-cadastre/latest/geojson/france/cadastre-france-feuilles.json.gz', {responseType: 'buffer'})
      .pipe(createGunzip())
      .pipe(parse())
      .pipe(new Transform({
        objectMode: true,
        async transform(feature, enc, cb) {
          const id = feature.properties.id
          const bbox = getBbox(feature).map(n => round(n, 5))

          count++
          if (count % 1000 === 0) {
            console.log(count)
          }

          cb(null, {id, bbox})
        }
      }))
  )

  await outputJson(join(__dirname, 'feuilles.json'), bboxes)

  console.log('Terminé !')
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})

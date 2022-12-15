const Arrzone1 = require('./utils/ArrZone1.json')
const Arrzone2 = require('./utils/ArrZone2.json')
const Arrzone3 = require('./utils/ArrZone3.json')
const Arrzone4 = require('./utils/ArrZone4.json')
const Arrzone5 = require('./utils/ArrZone5.json')
const Arrzone6 = require('./utils/ArrZone6.json')
const Arrzone7 = require('./utils/ArrZone7.json')
const Arrzone8 = require('./utils/ArrZone8.json')
const Arrzone9 = require('./utils/ArrZone9.json')
const Arrzone10 = require('./utils/ArrZone10.json')
const Arrzone11 = require('./utils/ArrZone11.json')
const Arrzone11no2 = require('./utils/ArrZone11no2.json')
const Arrzone12 = require('./utils/ArrZone12.json')
const Arrzone12no2 = require('./utils/ArrZone12no2.json')
const Arrzone13 = require('./utils/ArrZone13.json')
const Arrzone14 = require('./utils/ArrZone14.json')
const Arrzone15 = require('./utils/ArrZone15.json')
const Arrzone16 = require('./utils/ArrZone16.json')
const Arrzone17 = require('./utils/ArrZone17.json')
const Arrzone17no2 = require('./utils/ArrZone17no2.json')

//const urlRequestZone = "https://quickpack-back-al2vij23ta-uc.a.run.app/getZoneRequest"


//app.route("/getZoneRequest", methods=["GET"])

module.exports = {


  getZoneRequest(cpOrigin, cpDestino) {
    let origin = 0
    let destiny = 0
    let cpOrigin2 = Number(cpOrigin)
    let cpDestino2 = Number(cpDestino)


    let i = 0;
    const zone1 = Arrzone1.arrzone1
    const zone2 = Arrzone2.arrzone2
    const zone3 = Arrzone3.arrzone3
    const zone4 = Arrzone4.arrzone4
    const zone5 = Arrzone5.arrzone5
    const zone6 = Arrzone6.arrzone6
    const zone7 = Arrzone7.arrzone7
    const zone8 = Arrzone8.arrzone8
    const zone9 = Arrzone9.arrzone9
    const zone10 = Arrzone10.arrzone10
    const zone11 = Arrzone11.arrzone11
    const zone11no2 = Arrzone11no2.arrzone11no2
    const zone12 = Arrzone12.arrzone12
    const zone12no2 = Arrzone12no2.arrzone12no2
    const zone13 = Arrzone13.arrzone13
    const zone14 = Arrzone14.arrzone14
    const zone15 = Arrzone15.arrzone15
    const zone16 = Arrzone16.arrzone16
    const zone17 = Arrzone17.arrzone17
    const zone17no2 = Arrzone17no2.arrzone17no2

    const OrigininZone = [
      { zoneValue: zone1, zonaOrigen: 1 },
      { zoneValue: zone2, zonaOrigen: 2 },
      { zoneValue: zone3, zonaOrigen: 3 },
      { zoneValue: zone4, zonaOrigen: 4 },
      { zoneValue: zone5, zonaOrigen: 5 },
      { zoneValue: zone6, zonaOrigen: 6 },
      { zoneValue: zone7, zonaOrigen: 7 },
      { zoneValue: zone8, zonaOrigen: 8 },
      { zoneValue: zone9, zonaOrigen: 9 },
      { zoneValue: zone10, zonaOrigen: 10 },
      { zoneValue: zone11, zonaOrigen: 11 },
      { zoneValue: zone11no2, zonaOrigen: 11 },
      { zoneValue: zone12, zonaOrigen: 12 },
      { zoneValue: zone12no2, zonaOrigen: 12 },
      { zoneValue: zone13, zonaOrigen: 13 },
      { zoneValue: zone14, zonaOrigen: 14 },
      { zoneValue: zone15, zonaOrigen: 15 },
      { zoneValue: zone16, zonaOrigen: 16 },
      { zoneValue: zone17, zonaOrigen: 17 },
      { zoneValue: zone17no2, zonaOrigen: 17 },

    ]

    const DestinyinZone = [
      { zoneValue: zone1, zonaDestino: 1 },
      { zoneValue: zone2, zonaDestino: 2 },
      { zoneValue: zone3, zonaDestino: 3 },
      { zoneValue: zone4, zonaDestino: 4 },
      { zoneValue: zone5, zonaDestino: 5 },
      { zoneValue: zone6, zonaDestino: 6 },
      { zoneValue: zone7, zonaDestino: 7 },
      { zoneValue: zone8, zonaDestino: 8 },
      { zoneValue: zone9, zonaDestino: 9 },
      { zoneValue: zone10, zonaDestino: 10 },
      { zoneValue: zone11, zonaDestino: 11 },
      { zoneValue: zone11no2, zonaDestino: 11 },
      { zoneValue: zone12, zonaDestino: 12 },
      { zoneValue: zone12no2, zonaDestino: 12 },
      { zoneValue: zone13, zonaDestino: 13 },
      { zoneValue: zone14, zonaDestino: 14 },
      { zoneValue: zone15, zonaDestino: 15 },
      { zoneValue: zone16, zonaDestino: 16 },
      { zoneValue: zone17, zonaDestino: 17 },
      { zoneValue: zone17no2, zonaDestino: 17 },

    ]

    const matrizDatos = [
      ["1", "2", "3", "3", "4", "5", "6", "6", "7", "3", "1", "2", "4", "2", "3", "5", "2"],
      ["2", "1", "5", "5", "6", "7", "7", "7", "8", "5", "3", "4", "6", "5", "5", "6", "4"],
      ["3", "5", "1", "3", "3", "5", "6", "4", "7", "4", "3", "3", "2", "4", "6", "7", "6"],
      ["3", "5", "3", "1", "3", "4", "5", "5", "7", "1", "3", "2", "4", "4", "6", "7", "5"],
      ["4", "6", "3", "3", "1", "4", "5", "3", "6", "4", "4", "3", "4", "6", "6", "7", "6"],
      ["5", "7", "5", "4", "4", "1", "3", "5", "5", "5", "6", "5", "6", "6", "7", "8", "6"],
      ["6", "7", "6", "5", "5", "3", "1", "5", "3", "6", "7", "6", "7", "7", "8", "8", "7"],
      ["6", "7", "4", "5", "3", "5", "5", "1", "5", "6", "6", "6", "5", "7", "7", "8", "7"],
      ["7", "8", "7", "7", "6", "5", "3", "5", "1", "7", "7", "7", "8", "8", "8", "8", "8"],
      ["3", "5", "4", "1", "4", "5", "6", "6", "7", "1", "4", "3", "5", "5", "6", "7", "5"],
      ["1", "3", "3", "3", "4", "6", "7", "6", "7", "4", "1", "2", "4", "3", "3", "6", "2"],
      ["2", "4", "3", "2", "3", "5", "6", "6", "7", "3", "2", "1", "4", "4", "5", "6", "5"],
      ["4", "6", "2", "4", "4", "6", "7", "5", "8", "5", "4", "4", "1", "5", "6", "7", "6"],
      ["2", "5", "4", "4", "6", "6", "7", "7", "8", "5", "3", "4", "5", "1", "3", "6", "2"],
      ["3", "5", "6", "6", "6", "7", "8", "7", "8", "6", "3", "5", "6", "3", "1", "2", "2"],
      ["5", "6", "7", "7", "7", "8", "8", "8", "8", "7", "6", "6", "7", "6", "2", "1", "3"],
      ["2", "4", "6", "5", "6", "6", "7", "7", "8", "5", "2", "5", "6", "2", "2", "3", "1"]
    ]

    OrigininZone.map((eachZoneOrigin) => (
      eachZoneOrigin.zoneValue.includes(cpOrigin2) ? origin = eachZoneOrigin.zonaOrigen : false
    ))
    DestinyinZone.map((eachZoneDestiny) => (
      eachZoneDestiny.zoneValue.includes(cpDestino2) ? destiny = eachZoneDestiny.zonaDestino : false
    ))
    if (destiny === 0) {

    } else if (origin === 0) {

    } else {
      console.log(cpOrigin2, cpDestino2)
      console.log('posicion de origen', origin, 'posicion de destino', destiny)
      let zonaRespuesta = "0"
      zonaRespuesta = matrizDatos[destiny - 1][origin - 1]
      return zonaRespuesta
    }
  }
}

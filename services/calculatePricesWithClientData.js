const { x64 } = require("crypto-js")

module.exports = {
    getPricesBasedOnSheet: (rateData, sheet, weight, zone, FFAerialTax, FFGroundTax, validServicesDHL) => {
        var arrWithNewPrices = []
        if (rateData.length < 1) { arrWithNewPrices }
        else {
            rateData.forEach(
                cadaServicio => {
                    const validServices = validServicesDHL
                    if (validServices.indexOf(cadaServicio['@type']) >= 0) {
                        let arrParseadaBD = sheet.data[cadaServicio['@type']]
                        let precioPorKG = 0
                        if (weight > 30) {
                            let excedentePeso = weight - 30;
                            if (arrParseadaBD[31] == undefined) {
                                return arrWithNewPrices
                            }
                            let auxStr = arrParseadaBD[31][zone].value
                            if (typeof auxStr === "string" && auxStr.includes(",")) {
                                auxStr = auxStr.replace(",", ".")
                            }
                            let auxInt = auxStr != '' ? Number.parseFloat(auxStr).toFixed(2) : 0
                            precioPorKG = !Number.isNaN(auxInt) ? auxInt : 0;
                            let valorDe30KG = arrParseadaBD[30][zone].value
                            let costoExcedente = precioPorKG * excedentePeso
                            let sumaValores = Number.parseFloat(valorDe30KG) + Number.parseFloat(costoExcedente)
                            precioPorKG = Number.parseFloat(sumaValores).toFixed(2);
                        } else {
                            precioPorKG = arrParseadaBD[weight][zone].value
                        }
                        if (precioPorKG.toString().includes(",")) {
                            precioPorKG = precioPorKG.replace(",", ".")
                        }
                        console.log("Servicio", cadaServicio['@type'])
                        console.log("precioPorKG", precioPorKG)
                        console.log("zona", zone)
                        console.log("peso", weight)
                        cadaServicio['Charges']['Charge'][0].ChargeAmount = Number(precioPorKG)
                        if (cadaServicio['Charges']['Charge'].length > 2) {
                            let valoresParaSumarFF = 0
                            cadaServicio['Charges']['Charge'].forEach(
                                cadaCargo => {
                                    if (cadaCargo.ChargeCode == "YY") {
                                        cadaCargo.ChargeAmount = Number(parseFloat(Number(cadaCargo.ChargeAmount) / 1.16).toFixed(2))
                                        valoresParaSumarFF += cadaCargo.ChargeAmount
                                    }
                                    if (cadaCargo.ChargeCode == "OO") {
                                        cadaCargo.ChargeAmount = Number(parseFloat(Number(cadaCargo.ChargeAmount) / 1.16).toFixed(2))
                                        valoresParaSumarFF += cadaCargo.ChargeAmount
                                    }
                                    if (cadaCargo.ChargeCode == "YB") {
                                        cadaCargo.ChargeAmount = Number(parseFloat(Number(cadaCargo.ChargeAmount) / 1.16).toFixed(2))
                                        valoresParaSumarFF += cadaCargo.ChargeAmount
                                    }
                                    if (cadaCargo.ChargeCode == "II") {
                                        cadaCargo.ChargeAmount = Number(parseFloat(Number(cadaCargo.ChargeAmount) / 1.16).toFixed(2))
                                    }
                                    if (cadaCargo.ChargeCode == "YE") {
                                        cadaCargo.ChargeAmount = Number(parseFloat(Number(cadaCargo.ChargeAmount) / 1.16).toFixed(2))
                                    }
                                    if (cadaCargo.ChargeCode == "FF") {
                                        valoresParaSumarFF += Number(parseFloat(Number(precioPorKG)).toFixed(2))
                                        console.log("valoresParaSumarFF", valoresParaSumarFF)
                                        let multiplicadorCombus = cadaServicio['@type'] === "G" ? FFGroundTax : FFAerialTax
                                        console.log("multiplicadorCombus", multiplicadorCombus)
                                        let porcPreDepured = Number.parseFloat(multiplicadorCombus).toFixed(2)
                                        console.log("porcPreDepured", porcPreDepured)

                                        let porcDepured = porcPreDepured / 100
                                        let resultMulti = valoresParaSumarFF * porcDepured

                                        cadaCargo.ChargeAmount = Number(parseFloat(resultMulti).toFixed(2))
                                        console.log("cadaCargo.ChargeAmount", cadaCargo.ChargeAmount)
                                        console.log("--------------------")

                                    }
                                })
                        } else {
                            let eleccionTipoFF = cadaServicio['@type'] === "G" ? FFGroundTax : FFAerialTax
                            let valorDividido = parseFloat(Number(precioPorKG) * eleccionTipoFF).toFixed(2)
                            cadaServicio['Charges']['Charge'][1].ChargeAmount = Number(parseFloat(valorDividido / 100).toFixed(2))
                        }
                        const subTotalCharge = { 'ChargeType': 'SubTotal', 'ChargeAmount': 0 }

                        cadaServicio['Charges']['Charge'].forEach(cadaSubCargo => {
                            //subTotalCharge.ChargeAmount = parseFloat(Number(cadaServicio['TotalNet'].Amount) + Number(cadaSubCargo['ChargeAmount'])).toFixed(2)
                            subTotalCharge.ChargeAmount += Number(cadaSubCargo['ChargeAmount']);
                        })

                        subTotalCharge.ChargeAmount = parseFloat(subTotalCharge.ChargeAmount).toFixed(2)
                        cadaServicio['Charges']['Charge'].push(subTotalCharge)
                        const ivaCharge = { 'ChargeType': 'IVA', 'ChargeAmount': 0 }
                        ivaCharge.ChargeAmount = parseFloat(subTotalCharge.ChargeAmount * 0.16).toFixed(2)
                        cadaServicio['Charges']['Charge'].push(ivaCharge)
                        cadaServicio['TotalNet'].Amount = parseFloat(Number(subTotalCharge.ChargeAmount) + Number(ivaCharge.ChargeAmount)).toFixed(2);
                        arrWithNewPrices.push(cadaServicio)
                    } else {
                        return "matriz de datos mal estructurada, consulte soporte"
                    }

                })
            return arrWithNewPrices

        }

    },
    getPricesEstafetaBasedOnSheet: (rateData, sheet, weight, zone, FFAerialTax, FFGroundTax, costoReexpedicion, calculoSeguro) => {
        var arrWithNewPrices = []
        rateData.forEach(eachService => {
            let newObj = {}
            let arrParseadaBD = sheet.data[eachService.DescripcionServicio]
            let precioPorKG = 0
            if (weight > 30) {
                let auxStr = arrParseadaBD[31][zone].value.toString()

                let excedentePeso = weight - 30;
                if (auxStr.includes(",")) {
                    auxStr = auxStr.replace(",", ".")
                }
                let auxInt = auxStr != '' ? Number.parseFloat(auxStr).toFixed(2) : 0
                precioPorKG = !Number.isNaN(auxInt) ? auxInt : 0;
                let valorDe30KG = arrParseadaBD[30][zone].value
                let costoExcedente = precioPorKG * excedentePeso
                let sumaValores = Number.parseFloat(valorDe30KG) + Number.parseFloat(costoExcedente)
                precioPorKG = Number.parseFloat(sumaValores).toFixed(2);
            } else {
                precioPorKG = arrParseadaBD[weight][zone].value
            }
            if (precioPorKG.toString().includes(",")) {
                precioPorKG = precioPorKG.replace(",", ".")
            }
            let seguro = Number(calculoSeguro)
            let reexpedicionSinIva = Number(costoReexpedicion) / 1.16
            let subtotal = Number(precioPorKG) + reexpedicionSinIva + Number(seguro)
            let IVA = parseFloat(Number(subtotal) * 0.16).toFixed(2)
            newObj = {
                "TarifaBase": Number(precioPorKG),
                "DescripcionServicio": eachService.DescripcionServicio,
                "Peso": weight,
                "CostoReexpedicion": parseFloat(reexpedicionSinIva).toFixed(2),
                "seguro": calculoSeguro,
                "Subtotal": parseFloat(subtotal).toFixed(2),
                "IVA": IVA,
                "CostoTotal": parseFloat(Number(subtotal) + Number(IVA)).toFixed(2)
            }
            arrWithNewPrices.push(newObj)
        })
        return arrWithNewPrices
    }
}
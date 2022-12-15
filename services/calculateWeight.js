module.exports = {
    getWeightForCalcs: (packages) => {
        var weightForCalcs = 0;
        var volumetricWeight = 0;
        var realWeight = 0;
        if (packages.length > 1) {
            packages.forEach(cadaPaquete => {
                realWeight = Number.parseInt(cadaPaquete['Weight']['Value'])
                var heighNumber = Number.parseInt(cadaPaquete.Dimensions['Height'])
                var widthNumber = Number.parseInt(cadaPaquete.Dimensions['Width'])
                var lengthNumber = Number.parseInt(cadaPaquete.Dimensions['Length'])
                volumetricWeight = (heighNumber * widthNumber * lengthNumber) / 5000
                if (volumetricWeight > realWeight) {
                    weightForCalcs = weightForCalcs + volumetricWeight
                } else {
                    weightForCalcs = weightForCalcs + realWeight
                }
            });
        } else {
            var objPckg = packages[0]
            var heighNumber = Number.parseInt(objPckg.Dimensions['Height'])
            var widthNumber = Number.parseInt(objPckg.Dimensions['Width'])
            var lengthNumber = Number.parseInt(objPckg.Dimensions['Length'])
            volumetricWeight = (heighNumber * widthNumber * lengthNumber) / 5000
            realWeight = packages[0]['Weight']['Value']
            if (volumetricWeight > realWeight) {
                weightForCalcs = volumetricWeight
            } else {
                weightForCalcs = realWeight
            }
        }
        var weightRounded = Math.round(weightForCalcs)
        if (weightForCalcs > weightRounded) {
            weightForCalcs = Number.parseInt(weightForCalcs + 1)
        } else {
            weightForCalcs = weightRounded
        }
        return weightForCalcs
    },
    getWeightForCalcsFromEstafetaPackage: (objWithDimensions) => {
        var heighNumber = Number.parseInt(objWithDimensions.alto)
        var widthNumber = Number.parseInt(objWithDimensions.ancho)
        var lengthNumber = Number.parseInt(objWithDimensions.largo)
        volumetricWeight = (heighNumber * widthNumber * lengthNumber) / 5000
        realWeight = objWithDimensions.peso
        if (volumetricWeight > realWeight) {
            weightForCalcs = volumetricWeight
        } else {
            weightForCalcs = realWeight
        }
        var weightRounded = Math.round(weightForCalcs)
        if (weightForCalcs > weightRounded) {
            weightForCalcs = Number.parseInt(weightForCalcs + 1)
        } else {
            weightForCalcs = weightRounded
        }
        return weightForCalcs
    }
}
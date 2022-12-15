
const firebaseAppConfig = {
    "type": "service_account",
    "project_id": "admin-central-de-envios",
    "private_key_id": "0cfb642d92840dc25da26e8435d017403944c868",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDbgUbXWIKcvVZv\n6wlpST7ZoLf9a3FPlYVusa3SELvD5w1TjRuu6J8mGYC8FNgjGQ4CiUIkHtsA/TQ5\ngEhEkXAxVY6VWB1MqIkqclqj+OorKy4IDhIzPKjfRtuiv7Nm3CuUn4RY1SwBWmFf\nJqh2MV2QRHgsLLZYJlLVVvgujcVkLH5Tdnt+9yH0ITinhwP0UTKK1bxBmMDUnuUq\n65Ujeqf5Q6SgxPRbhbkGyPfGl1VFyUrUZoEhDoakeTnHn/95ZKer6Qn59IlEjdJt\neuDWbAeA6JcAhE7OR2rqsXZZ/IMI5o/TeXJabhlvPlQltoezWsbQUTKn+m0tCT+Z\nK6XStpGlAgMBAAECggEAYoCJa0KvXioDG3ckQoiZeSzL1B++egG1np6CS6WxtPA/\nBTLp7Nw76ut/3ycVdO6d4Fp7AV2NVszJflJIW+jOKX1k3jTr9QYeg5tMfI/LebLH\nVdsGpNKAT63rCwYuuiZsMiZBTGHg/PxzfLEK4Ps3KvHm4Z/w9e7AtjbwaWe6YEBY\nH4v/6SJmh8uq5UgNfdFUK52z/UbDtOg/nzfjYPEtPNXgdOSZvm6ueM/rm68mNMWg\nWfJEzjQpdRNcEIbg3cseX0sSDdBS8rjrl8Ve346DpqVWq3H7bOlLmi5Hzoi44nfg\nJg8NA5aMMuGX9AmxfO2HWTMAwOwx0KsI7yRBAbaPswKBgQD6W8aYvQh+Mz3bGPUk\ndeZv+HosQ27a/729wr+jVePMJgN+idFLRSER6rfdOeCsuZXdLXdfffumhhNwrXRO\nO4ZPJkLDp72ss0HR6yKIHuCUh6xZ5fXqB9bTocS9W8UqEgpskjP7WKLK8kxUR5oA\nYJVEwy2WDu1ldnFAfFKOxauXewKBgQDgc4TEfp3DXN6ortn+QdsZKFTfPGiWxjVL\nA39prBbBPbQOwSLlK9IDxVoRI5XAV7Iej5HZlrRl3kfU4XFdjs4AVxWZnOAVG7yy\n2CxokZ13Simn4+GAq5In8q8nlCq9UH52HYPiq2U6kWumEJNTS2GQHJqwClaZlT0e\nb1YPy7+hXwKBgQCIVvZ+M2OupmUnLh5CLtrBW4XdGRQDu4YvEyGd56ZYhNMeVBtg\nbFMoGLTsixpptd+BRcNeg5NKCnYHxM4z1IK+E84EExNeO3i6wtxZWMdg28nmYy9a\ntc4uDki//nwO/ygiHDSmyoxNDUq4Ew4w6mgfvFLVB2gM+0WNoqarDcb2hQKBgEXD\nYhb5C+w3J3XisxsWORV+tbKVQiTrApGISsf7ly8FELwtR71Xe3V0l+QP3XHlUBWz\npi+tafDnwAfo8qWTx2/PoYUXf4bQEjy8eEEgUYNMZ9opOGQX79u+0LZKlWY2aLgp\nwF5py5MCtCTvrfsLyQ1T9riU3gnqmw6kqGlMeQmdAoGAdYJhVdYPOMcX4YRfYtNN\nqYQyeT28Dfi75ZCSdy4LUZBW+BH/qkMIJJLZKRzo0FVTWP3aiALigZfccoEFOX/I\n/nqORHjAmsaDQUdkCVnrZgs12s0cOvJ0oXHNHd0K/yrhJUqYA9xbPJHvuJHO96Jd\nO0/X/sXAGFbS2IRJIczezkU=\n-----END PRIVATE KEY-----\n",
    "client_email": "admin-central-de-envios@appspot.gserviceaccount.com",
    "client_id": "101777057736744970776",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/admin-central-de-envios%40appspot.gserviceaccount.com"
}
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const ArrPackagesDHL = require('../services/utils/ArrPackagesDHL.json');
const ArrPackagesEstafeta = require('../services/utils/ArrPackagesEstafeta.json');
initializeApp({
    credential: cert(firebaseAppConfig)
});

const db = getFirestore();

module.exports = {
    getDataSheetById: async (userId) => {
        const matrizdhl= ArrPackagesDHL[userId]
        if (matrizdhl == undefined) {
            return { error: "error", message: "User ID not found" }
        } else {
            return matrizdhl
        }

    },
    getDataEstafetaSheetById: async (userId) => {

        const matrizestafeta= ArrPackagesEstafeta[userId]
        if (matrizestafeta == undefined) {
            return { error: "error", message: "User ID not found" }
        } else {
            return matrizestafeta
        }

    },
    getFFTaxes: async () => {
        const docRef = db.collection('Valores').doc('CargosCombustible')
        const ffTaxes = await docRef.get()
        if (!ffTaxes.exists) {
            return { error: "error", message: "Values not found" }
        } else {
            return ffTaxes.data()
        }
    },
    getReferenceForPackagesById: async (userId) => {
        const docRef = db.collection('Cuenta').doc(userId)
        const userDoc = await docRef.get()
        if (!userDoc.exists) {
            return { error: "error", message: "User ID not found" }
        } else {
            return userDoc.data().referencia
        }
    },
    getValidServices: async (userId) => {
        let validServicesDHL = ["I", "O", "1", "G", "N"]
        const docRef = db.collection('Cuenta').doc(userId)
        const userDoc = await docRef.get()
        if (!userDoc.exists) {
            return { error: "error", message: "User ID not found" }
        } else {
            if (userDoc.data().hasOwnProperty('validServicesDHL')) {
                return userDoc.data().validServicesDHL
            } else {
                return validServicesDHL
            }
        }
    },
    addGeneratedLabel: async (userId, data) => {
        const docRef = db.collection("GuiasGeneradas")
        const updateStatus = await docRef.add({
            userId: userId,
            dataRequest: data.request,
            dataResponse: data.response,
            date: Date.now()
        })
        return updateStatus
    },
    addGeneratedLabelDHl: async (userId,data)=>{
        const docRef = db.collection("GuiasGeneradasDHL")
        const updateStatus = await docRef.add({
            userId: userId,
            dataRequest: data.request,
            dataResponse: data.response,
            date: Date.now()
        })
        return updateStatus    }
}
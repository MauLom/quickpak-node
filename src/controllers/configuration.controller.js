const FFTaxes = require('../models/FFTaxes');


exports.createFFTax = async (req, res) => {
    try {
        const {  paqueteria, tasaAerea, tasaTerrestre, } = req.body;
        const newTax = new FFTaxes({  paqueteria, tasaAerea, tasaTerrestre });
        const savedTax = await newTax.save(); 

        res.status(201).json(savedTax);
    } catch (error) {
        console.log("Error: ", error)
        res.status(500).json({ error: 'Error creating FFTax' });
    }
};

exports.getFFTax = async (req, res) => {
    try {
        const ffTaxes = await FFTaxes.find();
        res.json(ffTaxes);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching ffTaxes' });
    }
};

exports.deleteFFTax = async (req, res) => {
    try {
        const { ffTaxID } = req.params;
        await FFTaxes.findByIdAndDelete(ffTaxID);
        res.status(204).json({ message: 'ffTaxId deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting ffTaxId' });
    }
};

exports.updateFFTax = async (req, res) => {
    try {
        const { ffTaxID } = req.params;
        const {
            paqueteria,
            tasaAerea,
            tasaTerrestre,
        } = req.body;

        const ffTaxAsObjectId = ffTaxID.startsWith('ObjectId(') ? ffTaxID.slice(9, -1) : ffTaxID;

        const updatedItem = await FFTaxes.findByIdAndUpdate(
            ffTaxAsObjectId,
            {
                ...(paqueteria !== undefined && { paqueteria }),
                ...(tasaAerea !== undefined && { tasaAerea }),
                ...(tasaTerrestre !== undefined && { tasaTerrestre }),
            },
            { new: true }
        );

        if (!updatedItem) {
            return res.status(404).json({ error: 'FFTax  not found' });
        }
        res.json(updatedItem);
    } catch (error) {
        res.status(500).json({ error: 'Error updating FFTax' });
    }
}

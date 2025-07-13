const FFTaxes = require('../models/FFTaxes');


exports.createFFTax = async (req, res) => {
    try {
        const {  paqueteria, tasaAerea, tasaTerrestre, } = req.body;
        const newTax = new FFTaxes({  paqueteria, tasaAerea, tasaTerrestre });

        res.status(201).json(newTax);
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

        const updatedItem = await MenuItem.findByIdAndUpdate(
            ffTaxID,
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

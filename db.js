
const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/redirects';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const redirectSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    destination: { type: String, required: true },
    token: { type: String, required: true },
}, { timestamps: true });

const Redirect = mongoose.model('Redirect', redirectSchema);

// Add a new redirect
async function addRedirect(key, destination, token) {
    const newRedirect = new Redirect({ key, destination, token });
    await newRedirect.save();
}

// Get a redirect by key
async function getRedirect(key) {
    return await Redirect.findOne({ key }).lean();
}

// Get all redirects
async function getAllRedirects() {
    return await Redirect.find().lean();
}

// Update a redirect's destination by key
async function updateRedirect(key, newDestination) {
    return await Redirect.findOneAndUpdate(
        { key },
        { destination: newDestination },
        { new: true, lean: true }
    );
}

// Delete a redirect by key
async function deleteRedirect(key) {
    return await Redirect.findOneAndDelete({ key });
}

module.exports = {
    addRedirect,
    getRedirect,
    getAllRedirects,
    updateRedirect,
    deleteRedirect,
};

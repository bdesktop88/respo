const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/redirects';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Updated Schema with slug
const redirectSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true }, // ✅ New
    destination: { type: String, required: true },
    token: { type: String, required: true },
}, { timestamps: true });

const Redirect = mongoose.model('Redirect', redirectSchema);

// Add a new redirect (with slug)
async function addRedirect(key, slug, destination, token) {
    const newRedirect = new Redirect({ key, slug, destination, token });
    await newRedirect.save();
}

// Get redirect by key (JWT/token-based route)
async function getRedirect(key) {
    return await Redirect.findOne({ key }).lean();
}

// ✅ Get redirect by slug (marketing backlink route)
async function getRedirectBySlug(slug) {
    return await Redirect.findOne({ slug }).lean();
}

// Get all redirects
async function getAllRedirects() {
    return await Redirect.find().lean();
}

// Update destination by key
async function updateRedirect(key, newDestination) {
    return await Redirect.findOneAndUpdate(
        { key },
        { destination: newDestination },
        { new: true, lean: true }
    );
}

// Delete redirect by key
async function deleteRedirect(key) {
    return await Redirect.findOneAndDelete({ key });
}

module.exports = {
    addRedirect,
    getRedirect,
    getRedirectBySlug, // ✅ Exported
    getAllRedirects,
    updateRedirect,
    deleteRedirect,
};

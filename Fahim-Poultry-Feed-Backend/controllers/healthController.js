// @desc    Health check endpoint
// @route   GET /api/health
// @access  Public
const checkHealth = (req, res) => {
    // Simple response indicating the server is running
    res.status(200).json({ status: 'OK', service: 'Fahim Poultry Feed API' });
};

module.exports = { checkHealth };
const requireRole = (requiredRole) => (req, res, next) => {
    const userRole = req.user?.role || 'unauthenticated'; // Default to 'unauthenticated'

    // Hierarchy map: Admin > Operator > Viewer
    const roleHierarchy = {
        'admin': 3,
        'operator': 2,
        'viewer': 1,
        'unauthenticated': 0 
    };

    const requiredLevel = roleHierarchy[requiredRole] || 0;
    const userLevel = roleHierarchy[userRole] || 0;

    if (userLevel >= requiredLevel) {
        return next();
    }

    // Access denied if the user's level is below the required level
    const error = new Error(`Access Denied: Insufficient privileges. Required role: ${requiredRole.toUpperCase()}.`);
    error.statusCode = 403;
    return next(error);
};

module.exports = requireRole;
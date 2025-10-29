const admin = require('firebase-admin');

// --- 1. Load Credentials (must match how server.js does it) ---
let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } else {
    // Requires your serviceAccountKey.json file to exist locally
    serviceAccount = require('./serviceAccountKey.json');
  }
} catch (error) {
  console.error('Error loading credentials:', error.message);
  process.exit(1);
}
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
// --- End Load Credentials ---

const targetUid = 'F3O3f7wGfmZYMf2SYWZcuPSUb1m2';

async function setAdminRole() {
    try {
        await admin.auth().setCustomUserClaims(targetUid, { role: 'admin' });
        console.log(`Successfully set custom claims { role: 'admin' } for user: ${targetUid}`);
        
        // This forces the user to get a fresh token next time they log in or refresh the page.
        await admin.auth().revokeRefreshTokens(targetUid);
        console.log(`Successfully revoked refresh tokens for ${targetUid}.`);
        
    } catch (error) {
        console.error('Error setting custom claim:', error);
    }
}

setAdminRole().then(() => process.exit());
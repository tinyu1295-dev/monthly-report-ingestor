const admin = require("firebase-admin");
const { Firestore } = require("@google-cloud/firestore");
const path = require("path");

const serviceAccount = require(path.resolve(__dirname, "../../serviceAccountKey.json"));

const app = admin.apps.length
    ? admin.app()
    : admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
        storageBucket: "Your Firebase Storage Bucket Name", // e.g., "my-project.appspot.com"
    });

const db = new Firestore({
    projectId: serviceAccount.project_id,
    credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key,
    },
});

const bucket = admin.storage().bucket();

module.exports = { admin, app, db, bucket, serviceAccount };


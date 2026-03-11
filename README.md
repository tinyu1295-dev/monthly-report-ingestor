### Setup and Testing Instructions

1. **Add Firebase Private Key**  
   Place the Firebase private key file in the appropriate location for the project.

2. **Update Firebase Configuration**  
   Open `scripts/config/firebase.js` and update the `storageBucket` value with the correct bucket name.

3. **Run the Test Script**  
   Execute the following command to test the raw data processing using the sample file:

   ```bash
   node scripts/testProcessedRawData.js ./uploads/testing.xlsx
   ```

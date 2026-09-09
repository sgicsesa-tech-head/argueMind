// Script to disqualify all users for Round 2
// Run this once, then manually qualify specific users in Firebase Console

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyARpGWdML6bL11AEJoVMQLirhnInGJUbV0",
  authDomain: "arguemind-35575.firebaseapp.com",
  projectId: "arguemind-35575",
  storageBucket: "arguemind-35575.firebasestorage.app",
  messagingSenderId: "1011754069445",
  appId: "1:1011754069445:web:91325cdfbd8c302412efac"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function disqualifyAllUsers() {
  try {
    console.log('🔄 Fetching all users...');
    
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    let disqualifiedCount = 0;
    let adminCount = 0;
    
    console.log(`📊 Found ${usersSnapshot.size} total users\n`);
    
    // Update each user to disqualify them
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      // Skip admin users
      if (userData.isAdmin) {
        console.log(`⏭️  Skipping admin: ${userData.email || userData.teamName}`);
        adminCount++;
        continue;
      }
      
      // Update qualified status to false
      await updateDoc(doc(db, 'users', userDoc.id), {
        qualified: false
      });
      
      console.log(`✅ Disqualified: ${userData.teamName || userData.email}`);
      disqualifiedCount++;
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ DISQUALIFICATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`📊 Total users: ${usersSnapshot.size}`);
    console.log(`✅ Disqualified: ${disqualifiedCount}`);
    console.log(`⏭️  Admins skipped: ${adminCount}`);
    console.log('\n📝 Next steps:');
    console.log('   1. Go to Firebase Console: https://console.firebase.google.com');
    console.log('   2. Navigate to Firestore Database → users collection');
    console.log('   3. Find users you want to qualify');
    console.log('   4. Edit each user document and set qualified: true');
    console.log('   5. App will automatically detect the change via real-time listener');
    console.log('\n✅ All users now disqualified. Manually qualify specific users in Firebase!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error disqualifying users:', error);
    process.exit(1);
  }
}

// Run the script
console.log('🚀 ArgueMind - Disqualify All Users for Round 2');
console.log('='.repeat(60));
console.log('⚠️  This will set qualified: false for ALL non-admin users');
console.log('⚠️  You can then manually qualify specific users in Firebase Console');
console.log('='.repeat(60));
console.log('');

disqualifyAllUsers();

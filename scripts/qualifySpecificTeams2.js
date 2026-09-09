// Script to qualify specific teams by name or user ID
// Edit the arrays below with team names or user IDs you want to qualify

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

// ============================================
// EDIT THIS LIST: Teams to qualify for Round 2
// ============================================
const TEAMS_TO_QUALIFY = [
  'Team Alpha',
  'Team Beta',
  'Team Gamma',
  'Team Delta',
  'Team Epsilon',
  // Add more team names here...
];

// Or qualify by user IDs (if you know them)
const USER_IDS_TO_QUALIFY = [
  // 'abc123xyz',
  // 'def456uvw',
  // Add user IDs here...
];

// Or qualify top N users by score
const QUALIFY_TOP_N = 15; // Set to 0 to disable
const MIN_SCORE_THRESHOLD = 0; // Set minimum score (0 = no threshold)

// ============================================

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function qualifySpecificTeams() {
  try {
    console.log('🔄 Fetching all users...');
    
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const allUsers = [];
    
    usersSnapshot.forEach(docSnap => {
      allUsers.push({ id: docSnap.id, ...docSnap.data() });
    });
    
    console.log(`📊 Found ${allUsers.length} total users\n`);
    
    let qualifiedCount = 0;
    const qualifiedUsers = [];
    
    // Method 1: Qualify by team name
    if (TEAMS_TO_QUALIFY.length > 0) {
      console.log('📝 Qualifying by team name...');
      for (const teamName of TEAMS_TO_QUALIFY) {
        const user = allUsers.find(u => u.teamName === teamName && !u.isAdmin);
        if (user) {
          await updateDoc(doc(db, 'users', user.id), { qualified: true });
          console.log(`✅ Qualified: ${user.teamName} (Score: ${user.round1Score || 0})`);
          qualifiedCount++;
          qualifiedUsers.push(user);
        } else {
          console.log(`⚠️  Not found: ${teamName}`);
        }
      }
    }
    
    // Method 2: Qualify by user ID
    if (USER_IDS_TO_QUALIFY.length > 0) {
      console.log('\n📝 Qualifying by user ID...');
      for (const userId of USER_IDS_TO_QUALIFY) {
        const user = allUsers.find(u => u.id === userId);
        if (user && !user.isAdmin) {
          await updateDoc(doc(db, 'users', userId), { qualified: true });
          console.log(`✅ Qualified: ${user.teamName} (Score: ${user.round1Score || 0})`);
          qualifiedCount++;
          qualifiedUsers.push(user);
        } else {
          console.log(`⚠️  Not found: ${userId}`);
        }
      }
    }
    
    // Method 3: Qualify top N by score
    if (QUALIFY_TOP_N > 0) {
      console.log(`\n📝 Qualifying top ${QUALIFY_TOP_N} users by score...`);
      
      const nonAdminUsers = allUsers.filter(u => !u.isAdmin);
      nonAdminUsers.sort((a, b) => (b.round1Score || 0) - (a.round1Score || 0));
      
      const topUsers = nonAdminUsers.slice(0, QUALIFY_TOP_N);
      
      for (const user of topUsers) {
        // Check if already qualified (from previous methods)
        if (!qualifiedUsers.find(u => u.id === user.id)) {
          // Check score threshold
          if ((user.round1Score || 0) >= MIN_SCORE_THRESHOLD) {
            await updateDoc(doc(db, 'users', user.id), { qualified: true });
            console.log(`✅ Qualified: ${user.teamName} (Score: ${user.round1Score || 0})`);
            qualifiedCount++;
            qualifiedUsers.push(user);
          } else {
            console.log(`⏭️  Skipped (below threshold): ${user.teamName} (Score: ${user.round1Score || 0})`);
          }
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ QUALIFICATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`📊 Total users: ${allUsers.length}`);
    console.log(`✅ Newly qualified: ${qualifiedCount}`);
    console.log('\n📋 Qualified users:');
    qualifiedUsers
      .sort((a, b) => (b.round1Score || 0) - (a.round1Score || 0))
      .forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.teamName} - Score: ${user.round1Score || 0}`);
      });
    console.log('\n✅ Users qualified successfully!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error qualifying users:', error);
    process.exit(1);
  }
}

// Run the script
console.log('🚀 ArgueMind - Qualify Specific Teams for Round 2');
console.log('='.repeat(60));
console.log('⚙️  Configuration:');
console.log(`   • Qualify by team name: ${TEAMS_TO_QUALIFY.length} teams`);
console.log(`   • Qualify by user ID: ${USER_IDS_TO_QUALIFY.length} users`);
console.log(`   • Qualify top N by score: ${QUALIFY_TOP_N > 0 ? QUALIFY_TOP_N : 'Disabled'}`);
console.log(`   • Minimum score threshold: ${MIN_SCORE_THRESHOLD}`);
console.log('='.repeat(60));
console.log('');

qualifySpecificTeams();

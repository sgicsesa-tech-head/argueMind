# Manual Qualification Management Guide

## 🎯 Overview

The app now supports **manual qualification management**. You can:
- ✅ Disqualify all users at once
- ✅ Manually qualify specific users in Firebase Console
- ✅ Changes reflect in the app instantly via real-time listeners
- ✅ No auto-calculation overrides your manual changes

---

## 🚀 Step-by-Step Guide

### Step 1: Disqualify All Users

Run the disqualification script:

```powershell
cd "d:\Coding\App Development\CSESA APPS\argueMind"
node scripts/disqualifyAllUsers.js
```

**What this does:**
- Sets `qualified: false` for all non-admin users
- Leaves admin accounts unchanged
- Prints summary of changes

**Output:**
```
✅ DISQUALIFICATION COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Total users: 60
✅ Disqualified: 58
⏭️  Admins skipped: 2
```

---

### Step 2: Manually Qualify Users in Firebase Console

#### Option A: Firebase Console (Web Interface)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: **arguemind-35575**
3. Click **Firestore Database** in left menu
4. Click **users** collection
5. For each user you want to qualify:
   - Click on their user document
   - Find the `qualified` field
   - Change value from `false` to `true`
   - Click **Update**

**Example:**
```
users/
  ├── abc123/
  │   ├── teamName: "Team Alpha"
  │   ├── round1Score: 1650
  │   ├── qualified: false  ← Change to true
  │   └── ...
  └── def456/
      ├── teamName: "Team Beta"
      ├── round1Score: 1580
      ├── qualified: false  ← Change to true
      └── ...
```

#### Option B: Bulk Edit with Script (Advanced)

Create a list of team names to qualify and run a script:

```javascript
// qualifySpecificUsers.js
const teamsToQualify = [
  'Team Alpha',
  'Team Beta',
  'Team Gamma',
  // ... add more team names
];

// Script will automatically qualify these users
```

---

### Step 3: Verify Changes in App

Users will see changes **instantly** (real-time listener):

**Before:**
```
❌ Not Qualified for Round 2
```

**After:**
```
✅ Qualified for Round 2
[Join Round 2] button becomes active
```

**No app restart needed!** Changes sync automatically. 🎉

---

## 📊 Qualification Criteria (Your Choice)

Since you're managing manually, you can use any criteria:

### Option 1: Top 15 by Score
- Sort users by `round1Score` descending
- Qualify top 15 teams

### Option 2: Score Threshold
- Qualify all users with score ≥ 1500

### Option 3: Manual Selection
- Pick specific teams regardless of score
- Great for handling ties or special cases

### Option 4: Mixed Criteria
- Top 10 by score + 5 wildcard picks

---

## 🔧 Firebase Queries for Quick Selection

### Query: Top 15 Users by Score

In Firebase Console → Firestore → users:

1. Click **"+ Add filter"**
2. Field: `isAdmin`, Operator: `==`, Value: `false`
3. Click **"Add order"**
4. Field: `round1Score`, Direction: `Descending`
5. Top 15 results are your qualifiers

### Query: Users Above Score Threshold

1. Click **"+ Add filter"**
2. Field: `round1Score`, Operator: `>=`, Value: `1500`
3. All results qualify

---

## 🔄 How Real-Time Sync Works

### In DashboardScreen.js:
```javascript
// Real-time listener watches for qualification changes
useEffect(() => {
  const unsubscribe = FirebaseService.subscribeToUserProfile(
    user.uid,
    (profile) => {
      setUserProfile(profile);  // Updates instantly when qualified changes
    }
  );
  return () => unsubscribe();
}, [user]);
```

**When you change `qualified` in Firebase:**
1. Firebase sends update to app (~500ms latency)
2. Dashboard shows/hides "Qualified for Round 2" badge
3. "Join Round 2" button enables/disables
4. User sees change without refreshing app

---

## 🛡️ Protection Against Auto-Override

### What Changed in Code:

#### Before (Auto-Calculation):
```javascript
// StandingsScreen.js - OLD
const handleRefreshStandings = async () => {
  // This would OVERRIDE manual changes!
  await FirebaseService.updateQualificationsBasedOnRound1Scores();
};
```

#### After (Manual Control):
```javascript
// StandingsScreen.js - NEW
const handleRefreshStandings = async () => {
  // Only refreshes display, does NOT modify qualified field
  const result = await FirebaseService.getAllUsers();
  processStandings(result.users);
  console.log('✅ Qualifications preserved - admin controlled');
};
```

**Result:** "Refresh Scores" button now only updates the display, never modifies `qualified` status!

---

## 📝 Batch Qualification Script (Optional)

Create `scripts/qualifySpecificTeams.js`:

<function_calls>
<invoke name="create_file">
<parameter name="content">// Script to qualify specific teams by name or user ID
// Edit the array below with team names you want to qualify

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc, query, where } = require('firebase/firestore');

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
    
    usersSnapshot.forEach(doc => {
      allUsers.push({ id: doc.id, ...doc.data() });
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

# ⚡ Quick Reference: Manual Qualification

## 🚀 Commands

### Disqualify All Users
```powershell
node scripts/disqualifyAllUsers.js
```

### Qualify Specific Teams (Edit script first)
```powershell
node scripts/qualifySpecificTeams2.js
```

### Manual Qualification (Firebase Console)
1. Visit: https://console.firebase.google.com/project/arguemind-35575/firestore
2. Go to: `users` collection
3. Click user document
4. Change: `qualified: false` → `qualified: true`
5. Click: **Update**

---

## 📋 Typical Workflow

```powershell
# 1. Disqualify everyone
node scripts/disqualifyAllUsers.js

# 2. Qualify top 15 (edit script first to set QUALIFY_TOP_N = 15)
node scripts/qualifySpecificTeams2.js

# Done! Users see changes instantly in app
```

---

## ✅ What's Protected

- ✅ **"Refresh Scores"** button - No longer modifies `qualified` field
- ✅ **Manual changes** - Never overwritten by app
- ✅ **Real-time sync** - Changes appear in app instantly

---

## 🔧 Script Configuration

Edit `scripts/qualifySpecificTeams2.js`:

```javascript
// Option 1: Qualify by team name
const TEAMS_TO_QUALIFY = ['Team Alpha', 'Team Beta'];

// Option 2: Qualify top N by score
const QUALIFY_TOP_N = 15;

// Option 3: Qualify above score threshold
const MIN_SCORE_THRESHOLD = 1500;
```

---

## 📊 Firebase Console Quick Access

**Project:** https://console.firebase.google.com/project/arguemind-35575

**Users Collection:**  
Firestore → `users` → Click any user → Edit `qualified` field

---

## 🎯 Common Scenarios

### Scenario 1: Top 15 Teams
```javascript
const QUALIFY_TOP_N = 15;
const MIN_SCORE_THRESHOLD = 0;
```

### Scenario 2: Score Above 1500
```javascript
const QUALIFY_TOP_N = 0; // Disable
const MIN_SCORE_THRESHOLD = 1500;
```

### Scenario 3: Specific 5 Teams
```javascript
const TEAMS_TO_QUALIFY = [
  'Team Alpha',
  'Team Beta',
  'Team Gamma',
  'Team Delta',
  'Team Epsilon'
];
const QUALIFY_TOP_N = 0; // Disable
```

---

**Full Guide:** See `MANUAL_QUALIFICATION_GUIDE.md`

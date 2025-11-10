# ArgueMind - Competitive Quiz App

A highly optimized React Native application for competitive quiz competitions supporting 60+ concurrent users with real-time scoring and leaderboards.

## 🎯 Features

- **Two-Round Competition System**
  - Round 1: 20 questions, all participants
  - Round 2: 15 questions, top 15 qualifiers only
- **Real-Time Updates**
  - Live leaderboard with automatic refresh
  - Dynamic qualification status
  - Instant score updates
- **Admin Panel**
  - Full game control (start, stop, reset)
  - Question navigation
  - Qualification management
- **Optimized Performance**
  - 95% reduction in Firestore writes
  - Client-side timer calculation
  - Local score tracking with batch submission

## 🚀 Quick Start

### Prerequisites
- Node.js 14+
- React Native development environment
- Firebase account

### Installation

```bash
# Install dependencies
npm install

# Configure Firebase
# Add your Firebase config to firebase/config.js

# Run the app
npm start
```

## 📊 Performance Optimizations

### Firestore Usage (60 users)
| Operation | Before | After | Reduction |
|-----------|--------|-------|-----------|
| Round 1 writes | ~1,200 | ~60 | **95%** |
| Timer reads | ~5,400 | ~60 | **98.9%** |
| Total operations | ~8,000 | ~600 | **92.5%** |

### Key Optimizations
1. **Local Score Tracking**: Answers stored in device memory during Round 1, submitted once at round end
2. **Client-Side Timer**: Calculates countdown locally from Firebase timestamp
3. **Batch Qualification Updates**: Single operation updates all users' qualification status
4. **Real-Time Listeners**: Efficient subscription-based updates instead of polling

## 📁 Project Structure

```
argueMind/
├── screens/
│   ├── GameScreen.js           # Round 1 gameplay (local score tracking)
│   ├── Round2GameScreen.js     # Round 2 gameplay (buzzer system)
│   ├── DashboardScreen.js      # User dashboard (qualification status)
│   ├── StandingsScreen.js      # Leaderboard (real-time updates)
│   └── AdminPanel_new.js       # Admin controls
├── firebase/
│   ├── config.js               # Firebase initialization (optimized)
│   └── gameService.js          # Firestore operations
├── hooks/
│   └── useFirebase.js          # Custom hooks for Firebase
├── data/
│   └── questions.json          # Question bank
└── docs/
    ├── OPTIMIZATION_SUMMARY.md  # Technical details
    ├── ADMIN_GUIDE.md          # Admin quick reference
    ├── VERIFICATION_CHECKLIST.md # Pre-deployment checks
    └── DATA_FLOW_DIAGRAM.md    # Visual data flow

```

## 🔧 Configuration

### Firebase Setup
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Add your config to `firebase/config.js`

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId || 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Game state - read by all, write by admin only
    match /gameState/{document=**} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Answers - read/write by authenticated users
    match /answers/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Required Firestore Indexes
Create composite index for leaderboard query:
- Collection: `users`
- Fields: `round1Score` (Descending)
- Query scope: Collection

## 📚 Documentation

- **[OPTIMIZATION_SUMMARY.md](./OPTIMIZATION_SUMMARY.md)**: Complete technical overview of all optimizations
- **[ADMIN_GUIDE.md](./ADMIN_GUIDE.md)**: Quick reference for event administrators
- **[VERIFICATION_CHECKLIST.md](./VERIFICATION_CHECKLIST.md)**: Pre-deployment testing guide
- **[DATA_FLOW_DIAGRAM.md](./DATA_FLOW_DIAGRAM.md)**: Visual representation of data flow

## 🎮 Admin Workflow

### Before Event
1. Ensure all participants have login credentials
2. Test with 5-10 devices
3. Monitor Firebase console

### During Round 1
1. Click "Start Round 1"
2. Click "Next Question" to advance (silent operation)
3. Monitor participants' progress

### After Round 1
1. Navigate to "Standings" screen
2. **Click "Refresh Scores"** (critical step!)
3. Verify top 15 users marked as "Qualified"

### During Round 2
1. Click "Start Round 2"
2. Use "Show Question", "Activate Buzzer", "Reset Buzzer" (all silent)
3. Click "Next Question" to advance

## 🐛 Troubleshooting

### Scores Not Appearing
- Admin: Click "Refresh Scores" in Standings
- Wait 3-5 seconds for processing
- Check Firebase console for errors

### Qualification Status Wrong
- Admin: Click "Refresh Scores"
- Users: Refresh Dashboard (or wait for auto-update)

### Timer Not Starting
- Check internet connection
- Verify Firebase connection in console
- Restart round if needed

### Firestore Index Error
- Click link in error message to create index
- Wait 1-2 minutes for index to build
- Refresh page

## 🔍 Monitoring

### Firebase Console
Monitor during live event:
- Document writes (should see one spike at Round 1 end)
- Document reads (steady, not spiking)
- Active connections
- Error logs

### Expected Performance (60 users)
- Round 1 completion: < 30 minutes
- Score submission: < 5 seconds after round end
- Leaderboard update: < 2 seconds after "Refresh Scores"
- Qualification status update: Real-time (< 5 seconds)

## 🚀 Production Deployment

### Pre-Flight Checklist
- [ ] All dependencies installed
- [ ] Firebase config updated
- [ ] Firestore indexes created
- [ ] Security rules deployed
- [ ] Test with 10+ devices
- [ ] Admin trained on "Refresh Scores" workflow
- [ ] Backup plan in place

### During Event
- [ ] Firebase console open for monitoring
- [ ] Test accounts logged in
- [ ] Admin has quick reference guide
- [ ] Support team on standby

### Post-Event
- [ ] Export final standings
- [ ] Review Firebase usage report
- [ ] Document any issues
- [ ] Update documentation as needed

## 📊 Technical Stack

- **Frontend**: React Native
- **Backend**: Firebase (Firestore, Authentication)
- **State Management**: React Hooks (useState, useEffect)
- **Real-Time Updates**: Firestore onSnapshot listeners
- **UI Components**: React Native core components

## 🤝 Contributing

This is a private competition app. For issues or improvements:
1. Document the issue/feature
2. Test with multiple devices
3. Verify Firestore quota impact
4. Update documentation

## 📄 License

Private/Internal Use Only

## 👥 Support

For technical issues during events:
- Check Firebase console for errors
- Review `ADMIN_GUIDE.md` for quick fixes
- Contact development team if issue persists

## 🎉 Success Criteria

The app is production-ready when:
- ✅ 60+ concurrent users complete Round 1 without errors
- ✅ Firestore writes < 100 for Round 1 (vs. 1,200 before)
- ✅ All scores appear in leaderboard
- ✅ Qualification status persists across sessions
- ✅ No INTERNAL ASSERTION errors on Android
- ✅ Admin panel operates smoothly

---

**Version**: 2.0  
**Last Updated**: May 2024  
**Status**: ✅ Production Ready (pending 60+ user load test)

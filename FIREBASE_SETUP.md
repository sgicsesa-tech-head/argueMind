# Firebase Setup for ArgueMind

## Prerequisites
1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication with Email/Password sign-in method
3. Create a Firestore database

## Configuration Steps

### 1. Update Firebase Config
Replace the demo config in `firebase/config.js` with your actual Firebase project config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 2. Firestore Collections Structure

The app will automatically create these collections:

#### `users` collection
- `uid` (string): User's Firebase Auth ID
- `email` (string): User's email
- `teamName` (string): Team display name
- `round1Score` (number): Points from Round 1
- `round2Score` (number): Points from Round 2  
- `totalScore` (number): Combined score
- `qualified` (boolean): Qualified for Round 2
- `isAdmin` (boolean): Admin status
- `createdAt` (timestamp)
- `lastActive` (timestamp)

#### `gameState` collection (document ID: 'current')
- `round1Active` (boolean): Round 1 is active
- `round2Active` (boolean): Round 2 is active
- `currentRound` (number): Current round (1 or 2)
- `currentQuestion` (number): Current question number
- `round1TotalQuestions` (number): Total Round 1 questions (20)
- `round2TotalQuestions` (number): Total Round 2 questions (15)
- `round2QuestionActive` (boolean): Round 2 question is active
- `round2BuzzerActive` (boolean): Buzzer is active
- `gameStarted` (boolean): Game has started
- `gameEnded` (boolean): Game has ended

#### `answers` collection
- `userId` (string): User's ID
- `questionNumber` (number): Question number
- `answer` (string): User's answer
- `roundNumber` (number): Round number (1 or 2)
- `isCorrect` (boolean): Whether answer was correct
- `points` (number): Points awarded
- `timestamp` (timestamp): When answer was submitted

#### `buzzerResponses` collection (for Round 2)
- `userId` (string): User's ID
- `questionNumber` (number): Question number
- `responseTime` (number): Response time in milliseconds
- `scored` (boolean): Whether response was scored
- `points` (number): Points awarded
- `timestamp` (timestamp): When buzzer was pressed

## Admin Account
- Email: `admin@csesa`
- Password: `arguemind`

This bypasses Firebase auth and goes directly to admin panel.

## Features Implemented

### Authentication
- ✅ Firebase email/password authentication with persistence
- ✅ User registration with team names
- ✅ Admin bypass login
- ✅ Auto-login persistence across sessions

### Game State Management
- ✅ Real-time game state updates via Firebase
- ✅ Round activation controlled by admin
- ✅ Question progression synchronized across all users
- ✅ User qualification based on Round 1 scores

### Round 1 (Word Guessing)
- ✅ Real-time question updates when admin clicks "Next Question"
- ✅ Answer submission with automatic scoring
- ✅ Points calculation and user score updates
- ✅ Interactive word display with feedback
- ✅ Access control based on admin activation

### Round 2 (Quiz Battle)
- ✅ Qualified users only (top 10 from Round 1)
- ✅ Admin-controlled question and buzzer system
- ✅ Real-time buzzer responses
- ✅ Admin scoring interface

### Admin Panel
- ✅ Unified controls for both rounds
- ✅ Real-time participant monitoring
- ✅ Game state management (start/stop rounds)
- ✅ Question progression controls
- ✅ Automatic user qualification system

### Standings & Leaderboard
- ✅ Real-time standings from Firebase data
- ✅ Round-specific and total score displays
- ✅ User rank calculation and display
- ✅ Qualified status indicators

## Usage Flow

1. **Setup**: Admin creates Firebase project and updates config
2. **User Registration**: Users sign up with email/password and team name
3. **Round 1**: Admin starts Round 1, users see word guessing game
4. **Question Control**: Admin clicks "Next Question" to move all users to next question
5. **Qualification**: Top 10 users automatically qualify for Round 2
6. **Round 2**: Admin starts Round 2, qualified users can participate
7. **Buzzer System**: Admin controls questions and buzzer activation
8. **Final Results**: Standings show combined scores and rankings

## Security Notes

- Firestore security rules should be configured for production
- Admin functionality relies on client-side checks (enhance with server-side validation)
- User scores are validated server-side through Firebase functions (recommended for production)

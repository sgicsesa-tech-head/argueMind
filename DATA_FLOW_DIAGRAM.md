# ArgueMind Data Flow Diagram

## 🔄 Round 1 Optimized Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     ROUND 1 (20 Questions)                  │
└─────────────────────────────────────────────────────────────┘

USER DEVICE                          FIREBASE
┌──────────────┐                    ┌──────────────┐
│              │                    │              │
│  Question 1  │ ◄─────────────────│  gameState   │
│   Answer A   │    Read once       │              │
│   +180 pts   │                    └──────────────┘
│              │                           │
│ Stored in    │                           │
│ localAnswers │                           │
│    state     │                           │
└──────────────┘                           │
                                           │
┌──────────────┐                           │
│              │                           │
│  Question 2  │ ◄─────────────────────────┘
│   Answer B   │    Read once
│   +165 pts   │
│              │
│ Stored in    │
│ localAnswers │
│    state     │
└──────────────┘

       ⋮
   (18 more)
       ⋮

┌──────────────┐                    
│              │                    
│  Question 20 │                    
│   Answer T   │                    
│   +120 pts   │                    
│              │                    
│ Stored in    │                    
│ localAnswers │                    
│    state     │                    
└──────────────┘                    
       │                            
       │ Round 1 Ends               
       │                            
       ▼                            
┌──────────────┐                    ┌──────────────┐
│ Calculate    │                    │              │
│ Total Score  │                    │   Firebase   │
│   = 1650     │ ──────────────────►│   Firestore  │
│              │  SINGLE WRITE      │              │
│ submitFinal  │                    │  users/{uid} │
│ Round1Score()│                    │  round1Score │
└──────────────┘                    └──────────────┘

✅ Only 1 Firestore write per user (not 20!)
✅ Saves 95% of Firestore quota
```

---

## 📊 Qualification Status Flow

```
┌─────────────────────────────────────────────────────────────┐
│              AFTER ROUND 1 COMPLETES                        │
└─────────────────────────────────────────────────────────────┘

ADMIN PANEL                      FIREBASE                USER DASHBOARD
┌──────────────┐                ┌──────────────┐        ┌──────────────┐
│              │                │              │        │              │
│  Standings   │                │   Firestore  │        │  Dashboard   │
│   Screen     │                │              │        │              │
│              │                │  users/...   │        │              │
│ Click:       │                │  (60 docs)   │        │              │
│ "Refresh     │                │              │        │              │
│  Scores"     │                └──────────────┘        │              │
│              │                       ▲                 │              │
└──────────────┘                       │                 └──────────────┘
       │                               │                        ▲
       │                               │                        │
       ▼                               │                        │
┌──────────────┐                       │                        │
│ Query users  │                       │                        │
│ ORDER BY     │───────────────────────┘                        │
│ round1Score  │ Read all users                                 │
│ DESC         │                                                │
└──────────────┘                                                │
       │                                                        │
       ▼                                                        │
┌──────────────┐                ┌──────────────┐               │
│ Calculate    │                │              │               │
│ Top 15 users │                │   Firebase   │               │
│              │                │   Firestore  │               │
│ Set:         │───────────────►│              │───────────────┘
│ qualified:   │ Batch write    │  Update 60   │ Real-time
│ true/false   │ (1 operation)  │  user docs   │ listener
└──────────────┘                └──────────────┘ auto-updates

✅ Qualification status persists in database
✅ Real-time listener updates user's dashboard immediately
✅ No need for users to refresh manually
```

---

## ⏱️ Timer Optimization Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  CLIENT-SIDE TIMER                          │
└─────────────────────────────────────────────────────────────┘

BEFORE (Inefficient):                AFTER (Optimized):
┌──────────────┐                     ┌──────────────┐
│   Firebase   │                     │   Firebase   │
│              │                     │              │
│  timeLeft:   │                     │ timerStart   │
│     90       │◄────┐               │   Time:      │◄──────┐
│     89       │     │               │  timestamp   │       │
│     88       │     │               └──────────────┘       │
│     87       │     │                      │               │
│     ...      │     │                      │ Read ONCE     │
│              │     │                      ▼               │
│   (60 reads  │     │               ┌──────────────┐       │
│    per       │     │               │ Client-side  │       │
│   question!) │     │               │ calculation: │       │
└──────────────┘     │               │              │       │
       ▲             │               │ timeLeft =   │       │
       │             │               │  90 - (now - │       │
       │ Read every  │               │   start)/1000│       │
       │ second      │               │              │       │
       │             │               │ Updates      │       │
       └─────────────┘               │ locally      │       │
                                     │ every 100ms  │       │
                                     └──────────────┘       │
                                            │               │
                                            └───────────────┘
                                         Only 1 read
                                         per question!

❌ Before: 90 Firebase reads per question × 20 questions = 1,800 reads/user
✅ After: 1 Firebase read per question × 20 questions = 20 reads/user
💰 Savings: 98.9% reduction in timer-related reads
```

---

## 🎯 Complete User Journey

```
┌──────────────────────────────────────────────────────────────┐
│                    COMPLETE GAME FLOW                        │
└──────────────────────────────────────────────────────────────┘

1. LOGIN
   User → Firebase Auth → Success → Load profile
   Firestore: 1 read (user profile)

2. DASHBOARD
   User sees: Team name, current status
   Firestore: 0 writes, 1 read (user profile)
   Real-time listener: Auto-updates qualification badge

3. ROUND 1 START (Admin)
   Admin clicks "Start Round 1"
   Firebase writes: gameState.round1Active = true
   All users get notified via real-time listener

4. ROUND 1 GAMEPLAY (20 questions)
   For each question:
   - Admin: "Next Question" (no alert)
   - Firebase: Update currentQuestion field
   - Users: Answer locally (stored in state)
   - No per-question Firebase writes!
   
   Total per user: 0 writes, ~20 reads (questions)

5. ROUND 1 END
   Each user submits final score:
   - submitFinalRound1Score(uid, totalScore)
   - Single write per user: round1Score, totalScore
   
   Total for 60 users: 60 writes (vs. 1,200 before!)

6. QUALIFICATION CALCULATION
   Admin clicks "Refresh Scores" in Standings:
   - Query all users by round1Score
   - Calculate top 15
   - Batch update qualified field
   
   Total: 1 read query + 60 writes (1 per user)

7. USER DASHBOARD UPDATE
   Users see qualification badge automatically:
   - Real-time listener detects change
   - Dashboard updates without refresh
   
   Total: 0 additional operations (listener-based)

8. ROUND 2 START (Top 15 only)
   Admin clicks "Start Round 2"
   Only qualified users can participate
   15 questions with buzzer system

9. FINAL STANDINGS
   Real-time leaderboard shows final rankings
   Updates automatically as scores change

┌─────────────────────────────────────────────────────────────┐
│  TOTAL FIRESTORE OPERATIONS (60 users, full competition):  │
│                                                             │
│  Round 1: ~60 writes + ~200 reads                           │
│  Qualification: ~60 writes + 1 read                         │
│  Round 2: ~150 writes + ~300 reads (15 users only)          │
│                                                             │
│  TOTAL: ~270 writes + ~500 reads                            │
│                                                             │
│  BEFORE OPTIMIZATION: ~3,000+ writes + ~1,500+ reads        │
│  IMPROVEMENT: 90% reduction in writes, 67% reduction reads  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔥 Firestore Write Comparison

```
BEFORE OPTIMIZATION (Per User):
┌─────────────────────────────────────────────┐
│ Question 1 │ ████ Write (answer + score)    │
│ Question 2 │ ████ Write (answer + score)    │
│ Question 3 │ ████ Write (answer + score)    │
│    ...     │ ████ (17 more writes)          │
│ Question 20│ ████ Write (answer + score)    │
└─────────────────────────────────────────────┘
Total: 20 writes per user × 60 users = 1,200 writes

AFTER OPTIMIZATION (Per User):
┌─────────────────────────────────────────────┐
│ Question 1 │ ──── Stored locally            │
│ Question 2 │ ──── Stored locally            │
│ Question 3 │ ──── Stored locally            │
│    ...     │ ──── (17 more local)           │
│ Question 20│ ──── Stored locally            │
│ Round End  │ ████ SINGLE write (total score)│
└─────────────────────────────────────────────┘
Total: 1 write per user × 60 users = 60 writes

💰 SAVINGS: 1,140 writes (95% reduction!)
💵 COST SAVINGS: ~$0.12 per event (at $0.18 per 100K writes)
⚡ PERFORMANCE: Near-instant submissions (no network wait)
```

---

## 📱 Mobile Network Handling

```
USER WITH POOR CONNECTION:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│ ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐             │
│ │Question│  │Question│  │Question│  │Question│             │
│ │   1    │──│   2    │──│   3    │──│   4    │── ...       │
│ │ +180pt │  │ +165pt │  │ +150pt │  │ +135pt │             │
│ └────────┘  └────────┘  └────────┘  └────────┘             │
│      │           │           │           │                  │
│      └───────────┴───────────┴───────────┘                  │
│                  │                                           │
│         Stored in device memory                              │
│         (survives poor connection)                           │
│                  │                                           │
│                  ▼                                           │
│         ┌────────────────┐                                   │
│         │  Connection    │                                   │
│         │  lost briefly  │                                   │
│         └────────────────┘                                   │
│                  │                                           │
│                  ▼                                           │
│         ┌────────────────┐                                   │
│         │  Connection    │                                   │
│         │  restored      │                                   │
│         └────────────────┘                                   │
│                  │                                           │
│                  ▼                                           │
│         ┌────────────────┐       ┌──────────────┐           │
│         │  Round 1 ends  │       │   Firebase   │           │
│         │  Submit final  │──────►│   receives   │           │
│         │  score: 1650   │       │   score      │           │
│         └────────────────┘       └──────────────┘           │
│                                          │                   │
│                                          ▼                   │
│                                  ┌──────────────┐            │
│                                  │  Success!    │            │
│                                  │  Retry if    │            │
│                                  │  needed      │            │
│                                  └──────────────┘            │
└──────────────────────────────────────────────────────────────┘

✅ Answers stored locally during poor connection
✅ Single submission attempt when round ends
✅ Automatic retry if submission fails
✅ No data loss even with intermittent connectivity
```

---

**Legend:**
- ████ = Firestore write operation
- ──── = Local operation (no Firebase)
- ◄──► = Read operation
- ▲▼ = Data flow direction

**Key Insight:**  
By batching all 20 answers into a single submission at the end of Round 1, we've achieved a 95% reduction in Firestore writes while improving reliability and user experience!

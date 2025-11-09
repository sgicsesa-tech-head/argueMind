import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AdminPanel = ({ navigation }) => {
  const [selectedRound, setSelectedRound] = useState(1);
  
  // Round 1 State
  const [round1Question, setRound1Question] = useState(1);
  const [round1Active, setRound1Active] = useState(false);
  const [round1Participants, setRound1Participants] = useState([
    { id: 1, name: 'Player 1', status: 'waiting', points: 0, answered: false },
    { id: 2, name: 'Player 2', status: 'answering', points: 180, answered: false },
    { id: 3, name: 'Player 3', status: 'completed', points: 200, answered: true },
    { id: 4, name: 'Player 4', status: 'waiting', points: 0, answered: false },
    { id: 5, name: 'Player 5', status: 'waiting', points: 150, answered: true },
    { id: 6, name: 'Player 6', status: 'answering', points: 120, answered: false },
  ]);

  // Round 2 State
  const [round2Question, setRound2Question] = useState(1);
  const [round2QuestionActive, setRound2QuestionActive] = useState(false);
  const [buzzerActive, setBuzzerActive] = useState(false);
  const [buzzerRankings, setBuzzerRankings] = useState([]);
  const [qualifiedParticipants, setQualifiedParticipants] = useState([
    { id: 1, name: 'Player 1', round1Score: 1850, round2Score: 0, buzzed: false, buzzerTime: null, scored: false },
    { id: 2, name: 'Player 2', round1Score: 1780, round2Score: 20, buzzed: false, buzzerTime: null, scored: false },
    { id: 3, name: 'Player 3', round1Score: 1720, round2Score: 0, buzzed: false, buzzerTime: null, scored: false },
    { id: 4, name: 'Player 4', round1Score: 1680, round2Score: -10, buzzed: false, buzzerTime: null, scored: false },
    { id: 5, name: 'Player 5', round1Score: 1650, round2Score: 0, buzzed: false, buzzerTime: null, scored: false },
    { id: 6, name: 'Player 6', round1Score: 1620, round2Score: 20, buzzed: false, buzzerTime: null, scored: false },
    { id: 7, name: 'Player 7', round1Score: 1590, round2Score: 0, buzzed: false, buzzerTime: null, scored: false },
    { id: 8, name: 'Player 8', round1Score: 1560, round2Score: 0, buzzed: false, buzzerTime: null, scored: false },
    { id: 9, name: 'Player 9', round1Score: 1530, round2Score: 20, buzzed: false, buzzerTime: null, scored: false },
    { id: 10, name: 'Player 10', round1Score: 1500, round2Score: -10, buzzed: false, buzzerTime: null, scored: false },
  ]);

  // Round 1 Handlers
  const handleStartRound1 = () => {
    setRound1Active(true);
    Alert.alert('Round 1 Started', 'All participants can now see Question 1');
  };

  const handleRound1NextQuestion = () => {
    Alert.alert(
      'Next Question',
      `Move all participants to Question ${round1Question + 1}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: () => {
            setRound1Question(round1Question + 1);
            setRound1Participants(prev => prev.map(p => ({ ...p, answered: false, status: 'waiting' })));
          }
        }
      ]
    );
  };

  const handleEndRound1 = () => {
    Alert.alert(
      'End Round 1',
      'This will show Round 1 standings and qualify top 10 teams for Round 2',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Round 1', 
          onPress: () => {
            navigation.navigate('Standings', { round: 1, isAdmin: true });
          }
        }
      ]
    );
  };

  // Round 2 Handlers
  const handleStartRound2Question = () => {
    Alert.alert(
      'Start Question',
      `Ready to start Question ${round2Question}? Read the question verbally to participants.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Question', 
          onPress: () => {
            setRound2QuestionActive(true);
            Alert.alert('Question Started', 'Question is now active. Enable buzzer when ready.');
          }
        }
      ]
    );
  };

  const handleEnableBuzzer = () => {
    if (!round2QuestionActive) {
      Alert.alert('Error', 'Please start the question first');
      return;
    }
    
    setBuzzerActive(true);
    setQualifiedParticipants(prev => prev.map(p => ({ 
      ...p, 
      buzzed: false, 
      buzzerTime: null, 
      scored: false 
    })));
    setBuzzerRankings([]);
    
    Alert.alert('Buzzer Enabled!', 'Participants can now press their buzzers');
  };

  const handleScoreParticipant = (participantId, points) => {
    setQualifiedParticipants(prev => prev.map(p => 
      p.id === participantId 
        ? { ...p, round2Score: p.round2Score + points, scored: true }
        : p
    ));
    
    Alert.alert('Scored', `Participant scored ${points > 0 ? '+' : ''}${points} points`);
  };

  const handleRound2NextQuestion = () => {
    if (round2Question < 15) {
      Alert.alert(
        'Next Question',
        `Move to Question ${round2Question + 1}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Continue', 
            onPress: () => {
              setRound2Question(prev => prev + 1);
              setRound2QuestionActive(false);
              setBuzzerActive(false);
              setBuzzerRankings([]);
              setQualifiedParticipants(prev => prev.map(p => ({ 
                ...p, 
                buzzed: false, 
                buzzerTime: null, 
                scored: false 
              })));
            }
          }
        ]
      );
    } else {
      handleEndRound2();
    }
  };

  const handleEndRound2 = () => {
    Alert.alert(
      'End Round 2',
      'Show final tournament standings?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Show Final Results', 
          onPress: () => {
            navigation.navigate('FinalStandings', { 
              round: 2, 
              isAdmin: true,
              participants: qualifiedParticipants 
            });
          }
        }
      ]
    );
  };

  // Simulate participants buzzing (for testing)
  const simulateBuzzer = (participantId) => {
    if (!buzzerActive) return;
    
    const responseTime = Math.floor(Math.random() * 1000) + 100;
    const participant = qualifiedParticipants.find(p => p.id === participantId);
    
    setQualifiedParticipants(prev => prev.map(p => 
      p.id === participantId 
        ? { ...p, buzzed: true, buzzerTime: responseTime }
        : p
    ));
    
    setBuzzerRankings(prev => {
      const newRanking = { 
        id: participantId, 
        name: participant.name, 
        time: responseTime 
      };
      return [...prev, newRanking].sort((a, b) => a.time - b.time);
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return '#7f8c8d';
      case 'answering': return '#f39c12';
      case 'completed': return '#27ae60';
      case 'ready': return '#f39c12';
      case 'active': return '#27ae60';
      case 'buzzed': return '#3498db';
      default: return '#7f8c8d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'waiting': return '⏳';
      case 'answering': return '✏️';
      case 'completed': return '✅';
      case 'ready': return '🟡';
      case 'active': return '🟢';
      case 'buzzed': return '🔴';
      default: return '❓';
    }
  };

  const getBuzzerStatus = (participant) => {
    if (!round2QuestionActive) return 'waiting';
    if (!buzzerActive) return 'ready';
    if (participant.buzzed) return 'buzzed';
    return 'active';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Round Selector */}
        <View style={styles.roundSelector}>
          <TouchableOpacity 
            style={[styles.roundTab, selectedRound === 1 && styles.activeTab]}
            onPress={() => setSelectedRound(1)}
          >
            <Text style={[styles.tabText, selectedRound === 1 && styles.activeTabText]}>Round 1</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.roundTab, selectedRound === 2 && styles.activeTab]}
            onPress={() => setSelectedRound(2)}
          >
            <Text style={[styles.tabText, selectedRound === 2 && styles.activeTabText]}>Round 2</Text>
          </TouchableOpacity>
        </View>

        {selectedRound === 1 ? (
          <>
            {/* Round 1 Control */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Round 1 Control - Word Guessing</Text>
              
              <View style={styles.controlRow}>
                <Text style={styles.questionText}>
                  Current Question: {round1Question} / 20
                </Text>
                <Text style={[styles.roundStatus, { color: round1Active ? '#27ae60' : '#e74c3c' }]}>
                  {round1Active ? 'Active' : 'Inactive'}
                </Text>
              </View>

              <View style={styles.buttonRow}>
                {!round1Active ? (
                  <TouchableOpacity style={styles.startButton} onPress={handleStartRound1}>
                    <Text style={styles.buttonText}>Start Round 1</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity style={styles.nextButton} onPress={handleRound1NextQuestion}>
                      <Text style={styles.buttonText}>Next Question</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.endButton} onPress={handleEndRound1}>
                      <Text style={styles.buttonText}>End Round 1</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>

            {/* Round 1 Participants */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Round 1 Participants ({round1Participants.length})</Text>
              
              {round1Participants.map((participant) => (
                <View key={participant.id} style={styles.participantRow}>
                  <Text style={styles.participantIcon}>
                    {getStatusIcon(participant.status)}
                  </Text>
                  
                  <View style={styles.participantInfo}>
                    <Text style={styles.participantName}>{participant.name}</Text>
                    <Text style={[styles.participantStatus, { color: getStatusColor(participant.status) }]}>
                      {participant.status}
                    </Text>
                  </View>
                  
                  <Text style={styles.participantPoints}>
                    {participant.points} pts
                  </Text>
                </View>
              ))}
            </View>

            {/* Round 1 Stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Round 1 Stats</Text>
              
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {round1Participants.filter(p => p.answered).length}
                  </Text>
                  <Text style={styles.statLabel}>Answered</Text>
                </View>
                
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {round1Participants.filter(p => p.status === 'answering').length}
                  </Text>
                  <Text style={styles.statLabel}>Answering</Text>
                </View>
                
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {round1Participants.filter(p => p.status === 'waiting').length}
                  </Text>
                  <Text style={styles.statLabel}>Waiting</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Round 2 Control */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Round 2 Control - Buzzer Round</Text>
              
              <View style={styles.questionStatus}>
                <Text style={styles.questionText}>Question {round2Question} / 15</Text>
                <View style={styles.statusIndicators}>
                  <Text style={[styles.statusDot, { backgroundColor: round2QuestionActive ? '#27ae60' : '#e74c3c' }]}>
                    Question {round2QuestionActive ? 'Active' : 'Inactive'}
                  </Text>
                  <Text style={[styles.statusDot, { backgroundColor: buzzerActive ? '#f39c12' : '#95a5a6' }]}>
                    Buzzer {buzzerActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>

              <View style={styles.controlButtons}>
                <TouchableOpacity 
                  style={[styles.controlButton, styles.startButton]}
                  onPress={handleStartRound2Question}
                  disabled={round2QuestionActive}
                >
                  <Text style={styles.buttonText}>Start Question</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.controlButton, styles.buzzerButton]}
                  onPress={handleEnableBuzzer}
                  disabled={!round2QuestionActive || buzzerActive}
                >
                  <Text style={styles.buttonText}>Enable Buzzer</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={[styles.controlButton, styles.nextButton]}
                onPress={handleRound2NextQuestion}
              >
                <Text style={styles.buttonText}>
                  {round2Question < 15 ? 'Next Question' : 'End Round & Show Results'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Buzzer Rankings */}
            {buzzerRankings.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Buzzer Order - Score Participants</Text>
                {buzzerRankings.map((ranking, index) => (
                  <View key={ranking.id} style={styles.rankingItem}>
                    <Text style={styles.rankPosition}>{index + 1}.</Text>
                    <Text style={styles.rankName}>{ranking.name}</Text>
                    <Text style={styles.rankTime}>{ranking.time}ms</Text>
                    
                    <View style={styles.scoringButtons}>
                      <TouchableOpacity 
                        style={styles.scoreButtonSmall}
                        onPress={() => handleScoreParticipant(ranking.id, 20)}
                      >
                        <Text style={styles.scoreText}>+20</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.scoreButtonSmall, styles.neutralScore]}
                        onPress={() => handleScoreParticipant(ranking.id, 0)}
                      >
                        <Text style={styles.scoreText}>+0</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.scoreButtonSmall, styles.negativeScore]}
                        onPress={() => handleScoreParticipant(ranking.id, -10)}
                      >
                        <Text style={styles.scoreText}>-10</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Round 2 Qualified Participants */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Qualified Participants (Top 10)</Text>
              
              {qualifiedParticipants.map((participant) => {
                const status = getBuzzerStatus(participant);
                return (
                  <View key={participant.id} style={styles.participantRow}>
                    <Text style={styles.participantIcon}>
                      {getStatusIcon(status)}
                    </Text>
                    
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantName}>{participant.name}</Text>
                      <Text style={[styles.participantStatus, { color: getStatusColor(status) }]}>
                        {status} {participant.buzzerTime && `(${participant.buzzerTime}ms)`}
                      </Text>
                    </View>
                    
                    <View style={styles.scoreInfo}>
                      <Text style={styles.round1Score}>R1: {participant.round1Score}</Text>
                      <Text style={[
                        styles.round2Score,
                        { color: participant.round2Score >= 0 ? '#27ae60' : '#e74c3c' }
                      ]}>
                        R2: {participant.round2Score >= 0 ? '+' : ''}{participant.round2Score}
                      </Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.testBuzzer}
                      onPress={() => simulateBuzzer(participant.id)}
                      disabled={!buzzerActive || participant.buzzed}
                    >
                      <Text style={styles.testBuzzerText}>Test</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  backButton: {
    backgroundColor: '#7f8c8d',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  questionText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600',
  },
  roundStatus: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  startButton: {
    backgroundColor: '#27ae60',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 30,
    flex: 1,
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: 'center',
    marginRight: 10,
  },
  endButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  participantIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  participantStatus: {
    fontSize: 14,
    marginTop: 2,
  },
  participantPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3498db',
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 5,
  },
  roundSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 5,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  roundTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#3498db',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  activeTabText: {
    color: '#fff',
  },
  questionStatus: {
    marginBottom: 15,
  },
  statusIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statusDot: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  controlButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buzzerButton: {
    backgroundColor: '#f39c12',
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  rankPosition: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498db',
    width: 30,
  },
  rankName: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
  },
  rankTime: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: 'bold',
    marginRight: 10,
  },
  scoringButtons: {
    flexDirection: 'row',
  },
  scoreButtonSmall: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  neutralScore: {
    backgroundColor: '#7f8c8d',
  },
  negativeScore: {
    backgroundColor: '#e74c3c',
  },
  scoreText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scoreInfo: {
    alignItems: 'flex-end',
    marginRight: 10,
  },
  round1Score: {
    fontSize: 11,
    color: '#7f8c8d',
  },
  round2Score: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  testBuzzer: {
    backgroundColor: '#9b59b6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  testBuzzerText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default AdminPanel;

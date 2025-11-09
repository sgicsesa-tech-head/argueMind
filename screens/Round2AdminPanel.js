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

const Round2AdminPanel = ({ navigation }) => {
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [buzzerActive, setBuzzerActive] = useState(false);
  const [questionActive, setQuestionActive] = useState(false);
  const [buzzerRankings, setBuzzerRankings] = useState([]);
  const [participants, setParticipants] = useState([]);

  const handleStartQuestion = () => {
    Alert.alert(
      'Start Question',
      `Ready to start Question ${currentQuestion}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Question', 
          onPress: () => {
            setQuestionActive(true);
            Alert.alert('Question Started', 'Read the question verbally to participants');
          }
        }
      ]
    );
  };

  const handleEnableBuzzer = () => {
    if (!questionActive) {
      Alert.alert('Error', 'Please start the question first');
      return;
    }
    
    setBuzzerActive(true);
    // Reset buzzer states for all participants
    setParticipants(prev => prev.map(p => ({ 
      ...p, 
      buzzed: false, 
      buzzerTime: null, 
      scored: false 
    })));
    setBuzzerRankings([]);
    
    Alert.alert('Buzzer Enabled!', 'Participants can now press their buzzers');
  };

  const handleScoreParticipant = (participantId, points) => {
    setParticipants(prev => prev.map(p => 
      p.id === participantId 
        ? { ...p, round2Score: p.round2Score + points, scored: true }
        : p
    ));
    
    Alert.alert('Scored', `Participant scored ${points > 0 ? '+' : ''}${points} points`);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < 15) {
      Alert.alert(
        'Next Question',
        `Move to Question ${currentQuestion + 1}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Continue', 
            onPress: () => {
              setCurrentQuestion(prev => prev + 1);
              setQuestionActive(false);
              setBuzzerActive(false);
              setBuzzerRankings([]);
              // Reset participant states for new question
              setParticipants(prev => prev.map(p => ({ 
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
      handleEndRound();
    }
  };

  const handleEndRound = () => {
    Alert.alert(
      'End Round 2',
      'Show Round 2 standings?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Show Results', 
          onPress: () => {
            navigation.navigate('Standings', { 
              round: 2, 
              isAdmin: true
            });
          }
        }
      ]
    );
  };

  // Simulate participants buzzing (for testing)
  const simulateBuzzer = (participantId) => {
    if (!buzzerActive) return;
    
    const responseTime = Math.floor(Math.random() * 1000) + 100; // 100-1100ms
    const participant = participants.find(p => p.id === participantId);
    
    setParticipants(prev => prev.map(p => 
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

  const getBuzzerStatus = (participant) => {
    if (!questionActive) return 'waiting';
    if (!buzzerActive) return 'ready';
    if (participant.buzzed) return 'buzzed';
    return 'active';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return '#7f8c8d';
      case 'ready': return '#f39c12';
      case 'active': return '#27ae60';
      case 'buzzed': return '#3498db';
      default: return '#7f8c8d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'waiting': return '⏳';
      case 'ready': return '🟡';
      case 'active': return '🟢';
      case 'buzzed': return '🔴';
      default: return '❓';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Round 2 - Admin Panel</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Question Control */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Question Control</Text>
          
          <View style={styles.questionStatus}>
            <Text style={styles.questionText}>Question {currentQuestion} / 15</Text>
            <View style={styles.statusIndicators}>
              <Text style={[styles.statusDot, { backgroundColor: questionActive ? '#27ae60' : '#e74c3c' }]}>
                Question {questionActive ? 'Active' : 'Inactive'}
              </Text>
              <Text style={[styles.statusDot, { backgroundColor: buzzerActive ? '#f39c12' : '#95a5a6' }]}>
                Buzzer {buzzerActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          <View style={styles.controlButtons}>
            <TouchableOpacity 
              style={[styles.controlButton, styles.startButton]}
              onPress={handleStartQuestion}
              disabled={questionActive}
            >
              <Text style={styles.buttonText}>Start Question</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.controlButton, styles.buzzerButton]}
              onPress={handleEnableBuzzer}
              disabled={!questionActive || buzzerActive}
            >
              <Text style={styles.buttonText}>Enable Buzzer</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[styles.controlButton, styles.nextButton]}
            onPress={handleNextQuestion}
          >
            <Text style={styles.buttonText}>
              {currentQuestion < 15 ? 'Next Question' : 'End Round & Show Results'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Buzzer Rankings */}
        {buzzerRankings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Buzzer Order</Text>
            {buzzerRankings.map((ranking, index) => (
              <View key={ranking.id} style={styles.rankingItem}>
                <Text style={styles.rankPosition}>{index + 1}.</Text>
                <Text style={styles.rankName}>{ranking.name}</Text>
                <Text style={styles.rankTime}>{ranking.time}ms</Text>
                
                {/* Scoring Buttons */}
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

        {/* Participants Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Qualified Participants (10)</Text>
          
          {participants.map((participant) => {
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
                
                {/* Test Buzzer Button */}
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
    fontSize: 20,
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
    shadowOffset: { width: 0, height: 2 },
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
  questionStatus: {
    marginBottom: 15,
  },
  questionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  statusIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  startButton: {
    backgroundColor: '#27ae60',
  },
  buzzerButton: {
    backgroundColor: '#f39c12',
  },
  nextButton: {
    backgroundColor: '#3498db',
    marginHorizontal: 0,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
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
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  participantIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  participantStatus: {
    fontSize: 12,
    marginTop: 2,
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

export default Round2AdminPanel;

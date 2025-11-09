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
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [roundActive, setRoundActive] = useState(false);
  const [participants, setParticipants] = useState([
    { id: 1, name: 'Player 1', status: 'waiting', points: 0, answered: false },
    { id: 2, name: 'Player 2', status: 'answering', points: 180, answered: false },
    { id: 3, name: 'Player 3', status: 'completed', points: 200, answered: true },
    { id: 4, name: 'Player 4', status: 'waiting', points: 0, answered: false },
  ]);

  const handleStartRound = () => {
    setRoundActive(true);
    Alert.alert('Round Started', 'All participants can now see Question 1');
  };

  const handleNextQuestion = () => {
    Alert.alert(
      'Next Question',
      `Move all participants to Question ${currentQuestion + 1}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: () => {
            setCurrentQuestion(currentQuestion + 1);
            // Reset participant status for new question
            setParticipants(prev => prev.map(p => ({ ...p, answered: false, status: 'waiting' })));
          }
        }
      ]
    );
  };

  const handleEndRound = () => {
    Alert.alert(
      'End Round',
      'This will show final standings to all participants',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Round', 
          onPress: () => {
            navigation.navigate('Standings', { isAdmin: true });
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return '#7f8c8d';
      case 'answering': return '#f39c12';
      case 'completed': return '#27ae60';
      default: return '#7f8c8d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'waiting': return '⏳';
      case 'answering': return '✏️';
      case 'completed': return '✅';
      default: return '❓';
    }
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
        {/* Round Control */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Round Control</Text>
          
          <View style={styles.controlRow}>
            <Text style={styles.questionText}>
              Current Question: {currentQuestion} / 20
            </Text>
            <Text style={[styles.roundStatus, { color: roundActive ? '#27ae60' : '#e74c3c' }]}>
              {roundActive ? 'Active' : 'Inactive'}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            {!roundActive ? (
              <TouchableOpacity style={styles.startButton} onPress={handleStartRound}>
                <Text style={styles.buttonText}>Start Round</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={styles.nextButton} onPress={handleNextQuestion}>
                  <Text style={styles.buttonText}>Next Question</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.endButton} onPress={handleEndRound}>
                  <Text style={styles.buttonText}>End Round</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Participants Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Participants ({participants.length})</Text>
          
          {participants.map((participant) => (
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

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {participants.filter(p => p.answered).length}
              </Text>
              <Text style={styles.statLabel}>Answered</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {participants.filter(p => p.status === 'answering').length}
              </Text>
              <Text style={styles.statLabel}>Answering</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {participants.filter(p => p.status === 'waiting').length}
              </Text>
              <Text style={styles.statLabel}>Waiting</Text>
            </View>
          </View>
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
});

export default AdminPanel;

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;

  connect(): Socket {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        autoConnect: true,
      });
    }
    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinQuestion(questionId: string): void {
    if (this.socket) {
      this.socket.emit('join-question', questionId);
    }
  }

  leaveQuestion(questionId: string): void {
    if (this.socket) {
      this.socket.emit('leave-question', questionId);
    }
  }

  onNewAnswer(callback: (answer: any) => void): void {
    if (this.socket) {
      this.socket.on('new-answer', callback);
    }
  }

  onAnswerUpdated(callback: (answer: any) => void): void {
    if (this.socket) {
      this.socket.on('answer-updated', callback);
    }
  }

  onAnswerDeleted(callback: (data: { answerId: string }) => void): void {
    if (this.socket) {
      this.socket.on('answer-deleted', callback);
    }
  }

  onVoteUpdated(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('vote-updated', callback);
    }
  }

  onNewQuestion(callback: (question: any) => void): void {
    if (this.socket) {
      this.socket.on('new-question', callback);
    }
  }

  onQuestionDeleted(callback: (data: { questionId: string }) => void): void {
    if (this.socket) {
      this.socket.on('question-deleted', callback);
    }
  }

  // Notification events
  joinUserRoom(userId: string): void {
    if (this.socket) {
      this.socket.emit('join-user', userId);
    }
  }

  leaveUserRoom(userId: string): void {
    if (this.socket) {
      this.socket.emit('leave-user', userId);
    }
  }

  onNewNotification(callback: (notification: any) => void): void {
    if (this.socket) {
      this.socket.on('new-notification', callback);
    }
  }

  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

const socketService = new SocketService();

export default socketService;

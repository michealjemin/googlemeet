import { useState, useEffect } from 'react';
import { useSocket } from '@/context/socket';
import styles from './index.module.css'; // Import the CSS module

const Chat = ({ roomId, myId }) => {
  const socket = useSocket();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  // Handle sending messages
  const sendMessage = () => {
    if (message.trim()) {
      const timestamp = new Date().toLocaleTimeString();
      socket.emit('send-message', roomId, message, myId);
      setMessages((prev) => [...prev, { text: message, sender: myId, timestamp }]);
      setMessage('');
    }
  };

  // Handle receiving messages
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message, userId) => {
      const timestamp = new Date().toLocaleTimeString();
      setMessages((prev) => [...prev, { text: message, sender: userId, timestamp }]);
    };

    socket.on('receive-message', handleReceiveMessage);

    return () => {
      socket.off('receive-message', handleReceiveMessage);
    };
  }, [socket]);

  // Auto-scroll to the bottom when a new message is added
  useEffect(() => {
    const messagesContainer = document.querySelector(`.${styles.messages}`);
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [messages]);

  return (
    <div className={styles.chatContainer}>
      <div className={styles.messages}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`${styles.message} ${
              msg.sender === myId ? styles.myMessage : styles.otherMessage
            }`}
          >
            <span>{msg.text}</span>
            <div className={styles.timestamp}>{msg.timestamp}</div>
          </div>
        ))}
      </div>
      <div className={styles.chatInput}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Chat;
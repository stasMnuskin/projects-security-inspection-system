import io from 'socket.io-client';

export const initializeSocket = () => {
  const socket = io(process.env.REACT_APP_SOCKET_URL);
  
  socket.on('connect', () => {
    console.log('Connected to socket server');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from socket server');
  });

  return socket;
};
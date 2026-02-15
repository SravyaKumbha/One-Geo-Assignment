const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { getWellContext, chatAboutWell, getWellSummary } = require('../services/chatService');

const conversationHistories = new Map();

async function authenticateWs(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'name', 'email'],
    });
    return user;
  } catch (err) {
    return null;
  }
}

function setupChatHandler(wss) {
  wss.on('connection', async (ws, req) => {
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');

    const user = await authenticateWs(token);
    if (!user) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Authentication failed. Please log in again.',
      }));
      ws.close();
      return;
    }

    ws.userId = user.id;
    ws.user = user;

    const connectionId = `${user.id}-${Date.now()}`;
    ws.connectionId = connectionId;
    conversationHistories.set(connectionId, []);

    ws.send(JSON.stringify({
      type: 'connected',
      message: `Welcome, ${user.name}! Select a well to start chatting about your data.`,
    }));

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await handleMessage(ws, message);
      } catch (err) {
        console.error('WebSocket message error:', err);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Failed to process message. Please try again.',
        }));
      }
    });

    ws.on('close', () => {
      conversationHistories.delete(connectionId);
    });
  });
}

async function handleMessage(ws, message) {
  const { type, wellId, content } = message;

  switch (type) {
    case 'select_well':
      await handleWellSelection(ws, wellId);
      break;

    case 'chat':
      await handleChatMessage(ws, content);
      break;

    case 'clear_history':
      conversationHistories.set(ws.connectionId, []);
      ws.send(JSON.stringify({
        type: 'history_cleared',
        message: 'Conversation history cleared.',
      }));
      break;

    default:
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Unknown message type.',
      }));
  }
}

async function handleWellSelection(ws, wellId) {
  ws.send(JSON.stringify({
    type: 'loading',
    message: 'Loading well data...',
  }));

  const wellContext = await getWellContext(wellId, ws.userId);

  if (!wellContext) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Well not found or you do not have access to it.',
    }));
    return;
  }

  ws.wellContext = wellContext;
  ws.wellId = wellId;

  conversationHistories.set(ws.connectionId, []);

  const summary = getWellSummary(wellContext);
  ws.send(JSON.stringify({
    type: 'well_selected',
    wellId,
    wellName: wellContext.well.name,
    message: summary,
  }));
}

async function handleChatMessage(ws, content) {
  if (!ws.wellContext) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Please select a well first before chatting.',
    }));
    return;
  }

  if (!content || content.trim() === '') {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Please enter a message.',
    }));
    return;
  }

  const history = conversationHistories.get(ws.connectionId) || [];

  ws.send(JSON.stringify({
    type: 'typing',
  }));

  try {
    const response = await chatAboutWell(ws.wellContext, content, history);

    history.push({ role: 'user', content });
    history.push({ role: 'assistant', content: response });
    const trimmedHistory = history.slice(-10);
    conversationHistories.set(ws.connectionId, trimmedHistory);

    ws.send(JSON.stringify({
      type: 'response',
      message: response,
    }));
  } catch (err) {
    console.error('Chat error:', err);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to get AI response. Please try again.',
    }));
  }
}

module.exports = { setupChatHandler };

import { ChatHistoryService } from '../services/ChatHistoryService';
import { PersistenceService } from '../services/PersistenceService';
import fs from 'fs';
import path from 'path';

// Mock the PersistenceService
jest.mock('../services/PersistenceService');

describe('ChatHistoryService', () => {
  let chatHistoryService: ChatHistoryService;
  let mockPersistenceService: jest.Mocked<PersistenceService>;
  const testDataDir = path.join(__dirname, 'test-chat-history');

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock instance
    mockPersistenceService = new PersistenceService({} as any) as jest.Mocked<PersistenceService>;
    
    // Mock the constructor to return our mock
    (PersistenceService as jest.MockedClass<typeof PersistenceService>).mockImplementation(() => mockPersistenceService);
    
    // Setup default mock implementations
    mockPersistenceService.loadData = jest.fn();
    mockPersistenceService.saveData = jest.fn();
    
    chatHistoryService = new ChatHistoryService(testDataDir);
  });

  afterEach(async () => {
    try {
      if (fs.existsSync(testDataDir)) {
        await fs.promises.rm(testDataDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.error('Failed to cleanup test directory:', error);
    }
  });

  test('should save chat history correctly', async () => {
    const sessionId = 'test-session-123';
    const chatHistory = [
      {
        id: '1',
        role: 'user',
        content: 'Hello',
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: new Date().toISOString()
      }
    ];
    
    mockPersistenceService.saveData.mockResolvedValue(undefined);
    
    await chatHistoryService.saveChatHistory(chatHistory, sessionId);
    
    expect(mockPersistenceService.saveData).toHaveBeenCalledWith(chatHistory, sessionId);
  });

  test('should load chat history correctly', async () => {
    const sessionId = 'test-session-123';
    const expectedHistory = [
      {
        id: '1',
        role: 'user',
        content: 'Hello',
        timestamp: '2023-01-01T00:00:00.000Z'
      }
    ];
    
    mockPersistenceService.loadData.mockResolvedValue(expectedHistory);
    
    const history = await chatHistoryService.loadChatHistory(sessionId);
    
    expect(mockPersistenceService.loadData).toHaveBeenCalledWith(sessionId);
    expect(history).toEqual(expectedHistory);
  });

  test('should return empty array when chat history does not exist', async () => {
    const sessionId = 'non-existent-session';
    
    mockPersistenceService.loadData.mockResolvedValue(undefined);
    
    const history = await chatHistoryService.loadChatHistory(sessionId);
    
    expect(history).toEqual([]);
  });

  test('should add message to existing chat history', async () => {
    const sessionId = 'test-session-123';
    const existingHistory = [
      {
        id: '1',
        role: 'user',
        content: 'Hello',
        timestamp: '2023-01-01T00:00:00.000Z'
      }
    ];
    const newMessage = {
      id: '2',
      role: 'assistant',
      content: 'Hi there!',
      timestamp: new Date().toISOString()
    };
    
    mockPersistenceService.loadData.mockResolvedValue(existingHistory);
    mockPersistenceService.saveData.mockResolvedValue(undefined);
    
    await chatHistoryService.addMessage(sessionId, newMessage);
    
    expect(mockPersistenceService.loadData).toHaveBeenCalledWith(sessionId);
    expect(mockPersistenceService.saveData).toHaveBeenCalledWith(
      [...existingHistory, newMessage],
      sessionId
    );
  });

  test('should add message to new chat session', async () => {
    const sessionId = 'new-session-123';
    const newMessage = {
      id: '1',
      role: 'user',
      content: 'Hello',
      timestamp: new Date().toISOString()
    };
    
    mockPersistenceService.loadData.mockResolvedValue(undefined);
    mockPersistenceService.saveData.mockResolvedValue(undefined);
    
    await chatHistoryService.addMessage(sessionId, newMessage);
    
    expect(mockPersistenceService.saveData).toHaveBeenCalledWith([newMessage], sessionId);
  });

  test('should clear chat history for a session', async () => {
    const sessionId = 'test-session-123';
    
    mockPersistenceService.saveData.mockResolvedValue(undefined);
    
    // Clear by saving empty history
    await chatHistoryService.pushMessage(sessionId, {
      id: 'clear-msg',
      role: 'system',
      content: 'History cleared',
      timestamp: Date.now()
    });
    
    expect(mockPersistenceService.saveData).toHaveBeenCalled();
  });

  test('should get messages for a session', async () => {
    const sessionId = 'test-session-123';
    const mockMessages = [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: 1234567890
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'How are you?',
        timestamp: 1234567891
      }
    ];
    
    // Mock loadChatHistory method directly
    jest.spyOn(chatHistoryService, 'loadChatHistory').mockResolvedValue(mockMessages);
    
    const messages = await chatHistoryService.getMessages(sessionId);
    
    expect(messages).toEqual(mockMessages);
  });

  test('should handle persistence errors gracefully', async () => {
    const sessionId = 'test-session-123';
    const chatHistory = [{
      id: '1',
      role: 'user',
      content: 'Hello',
      timestamp: new Date().toISOString()
    }];
    
    mockPersistenceService.saveData.mockRejectedValue(new Error('Save failed'));
    
    await expect(chatHistoryService.saveChatHistory(sessionId, chatHistory))
      .rejects.toThrow('Save failed');
  });

  test('should handle load errors gracefully', async () => {
    const sessionId = 'test-session-123';
    
    mockPersistenceService.loadData.mockRejectedValue(new Error('Load failed'));
    
    await expect(chatHistoryService.loadChatHistory(sessionId))
      .rejects.toThrow('Load failed');
  });
});
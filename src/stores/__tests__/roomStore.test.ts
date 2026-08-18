import { act } from '@testing-library/react-native';
import { useRoomStore } from '../roomStore';

// Mock the UnifiedRoomService
jest.mock('../../services/unifiedRoomService', () => ({
  UnifiedRoomService: {
    getAllRooms: jest.fn(),
    createRoom: jest.fn(),
    joinRoom: jest.fn(),
  },
}));

// Mock the multiAuthStore
jest.mock('../multiAuthStore', () => ({
  useMultiAuthStore: {
    getState: jest.fn(() => ({
      activeBackend: 'spot',
    })),
  },
}));

describe('roomStore', () => {
  beforeEach(() => {
    // Reset store before each test
    act(() => {
      useRoomStore.setState({
        rooms: [],
        activeRoom: null,
        activeRoomRole: null,
        isLoading: false,
      });
    });
    jest.clearAllMocks();
  });

  it('should initialize with empty values', () => {
    const store = useRoomStore.getState();

    expect(store.rooms).toEqual([]);
    expect(store.activeRoom).toBeNull();
    expect(store.activeRoomRole).toBeNull();
    expect(store.isLoading).toBe(false);
  });

  it('should set active room with admin role', () => {
    const mockRoom = {
      id: 1,
      name: 'Test Company',
      can_manage: true,
      membership_role: 'admin' as const,
      backend: 'spot' as const,
    };

    act(() => {
      useRoomStore.getState().setActiveRoom(mockRoom);
    });

    const store = useRoomStore.getState();
    expect(store.activeRoom).toMatchObject({
      id: 1,
      name: 'Test Company',
      can_manage: true,
      membership_role: 'admin',
    });
    expect(store.activeRoomRole).toBe('admin');
  });

  it('should set active room with reporter role', () => {
    const mockRoom = {
      id: 2,
      name: 'Test Room',
      can_manage: false,
      membership_role: 'reporter' as const,
      backend: 'spot' as const,
    };

    act(() => {
      useRoomStore.getState().setActiveRoom(mockRoom);
    });

    const store = useRoomStore.getState();
    expect(store.activeRoom).toMatchObject({
      id: 2,
      name: 'Test Room',
      can_manage: false,
      membership_role: 'reporter',
    });
    expect(store.activeRoomRole).toBe('reporter');
  });

  it('should normalize room with user_role field', () => {
    const mockRoom = {
      id: 3,
      name: 'Legacy Room',
      can_manage: true,
      user_role: 'admin' as const,
      backend: 'spot' as const,
    };

    act(() => {
      useRoomStore.getState().setActiveRoom(mockRoom as any);
    });

    const store = useRoomStore.getState();
    expect(store.activeRoomRole).toBe('admin');
    expect(store.activeRoom?.can_manage).toBe(true);
  });

  it('should use role as fallback for can_manage when undefined', () => {
    const mockRoom = {
      id: 4,
      name: 'New Room',
      // can_manage not provided
      membership_role: 'admin' as const,
      backend: 'spot' as const,
    };

    act(() => {
      useRoomStore.getState().setActiveRoom(mockRoom as any);
    });

    const store = useRoomStore.getState();
    expect(store.activeRoomRole).toBe('admin');
    expect(store.activeRoom?.can_manage).toBe(true); // Should fallback to role === 'admin'
  });

  it('should clear active room', () => {
    // Set a room first
    act(() => {
      useRoomStore.getState().setActiveRoom({
        id: 1,
        name: 'Test',
        can_manage: false,
        membership_role: 'reporter',
        backend: 'spot',
      });
    });

    expect(useRoomStore.getState().activeRoom).not.toBeNull();

    // Clear it
    act(() => {
      useRoomStore.getState().clearActiveRoom();
    });

    const store = useRoomStore.getState();
    expect(store.activeRoom).toBeNull();
    expect(store.activeRoomRole).toBeNull();
  });
});

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AppNavbar from '../AppNavbar';
import { useMultiAuthStore } from '../../stores/multiAuthStore';
import { useRoomStore } from '../../stores/roomStore';

// Mock navigation
const mockNavigationGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockNavigationGoBack,
  }),
}));

// Mock stores
jest.mock('../../stores/multiAuthStore');
jest.mock('../../stores/roomStore');

describe('AppNavbar', () => {
  const mockLogout = jest.fn();
  const mockClearActiveRoom = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useMultiAuthStore as unknown as jest.Mock).mockReturnValue({
      activeBackend: 'spot',
      spot: { user: { name: 'John Doe' } },
      logoutFromBackend: mockLogout,
    });

    (useRoomStore as unknown as jest.Mock).mockReturnValue({
      activeRoom: null,
      clearActiveRoom: mockClearActiveRoom,
    });
  });

  it('should render navbar with title', () => {
    const { getByText } = render(<AppNavbar title="Test Title" />);

    expect(getByText('Test Title')).toBeTruthy();
  });

  it('should render user avatar with initials', () => {
    const { getByText } = render(<AppNavbar title="Dashboard" />);

    expect(getByText('JD')).toBeTruthy(); // John Doe -> JD
  });

  it('should show menu when avatar is pressed', () => {
    const { getByText, queryByText } = render(<AppNavbar title="Dashboard" />);

    // Initially menu is hidden
    expect(queryByText('Keluar')).toBeNull();

    // Press avatar
    fireEvent.press(getByText('JD'));

    // Menu should be visible
    expect(getByText('Keluar')).toBeTruthy();
  });

  it('should not show "Ganti Perusahaan" button when not in a room', () => {
    const { getByText, queryByText } = render(<AppNavbar title="Dashboard" />);

    // Open menu
    fireEvent.press(getByText('JD'));

    // "Ganti Perusahaan" should not be visible
    expect(queryByText(/Ganti Perusahaan/)).toBeNull();
    expect(getByText('Keluar')).toBeTruthy();
  });

  it('should show "Ganti Perusahaan" button when in a room', () => {
    (useRoomStore as unknown as jest.Mock).mockReturnValue({
      activeRoom: { id: 1, name: 'Test Room' },
      clearActiveRoom: mockClearActiveRoom,
    });

    const { getByText } = render(<AppNavbar title="Dashboard" />);

    // Open menu
    fireEvent.press(getByText('JD'));

    // Both buttons should be visible
    expect(getByText(/Ganti Perusahaan/)).toBeTruthy();
    expect(getByText('Keluar')).toBeTruthy();
  });

  it('should call clearActiveRoom and navigate back when "Ganti Perusahaan" is pressed', () => {
    (useRoomStore as unknown as jest.Mock).mockReturnValue({
      activeRoom: { id: 1, name: 'Test Room' },
      clearActiveRoom: mockClearActiveRoom,
    });

    const { getByText } = render(<AppNavbar title="Dashboard" />);

    // Open menu
    fireEvent.press(getByText('JD'));

    // Press "Ganti Perusahaan"
    fireEvent.press(getByText(/Ganti Perusahaan/));

    expect(mockClearActiveRoom).toHaveBeenCalled();
    expect(mockNavigationGoBack).toHaveBeenCalled();
  });

  it('should call logout when "Keluar" is pressed', async () => {
    const { getByText } = render(<AppNavbar title="Dashboard" />);

    // Open menu
    fireEvent.press(getByText('JD'));

    // Press "Keluar"
    fireEvent.press(getByText('Keluar'));

    expect(mockLogout).toHaveBeenCalledWith('spot');
  });
});

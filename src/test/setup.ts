import { vi } from 'vitest'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

vi.stubGlobal('localStorage', localStorageMock)

// Mock Date for consistent testing
const mockDate = new Date('2024-01-15T10:00:00.000Z')
vi.setSystemTime(mockDate)
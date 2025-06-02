import { renderHook, act } from '@testing-library/react-native';
import { useWorkoutSession } from '@/hooks/useWorkoutSession';
import { useWorkoutStore } from '@/store/workoutStore';
import { useTemplateStore } from '@/store/templateStore';

jest.mock('@/store/workoutStore');
jest.mock('@/store/templateStore');
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

describe('useWorkoutSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with correct state', () => {
    const mockCurrentWorkout = {
      id: '1',
      name: 'Test Workout',
      exercises: [],
      date: Date.now(),
      started_at: Date.now(),
      completed: false,
      user_id: 'test-user',
    };

    (useWorkoutStore as unknown as jest.Mock).mockReturnValue({
      currentWorkout: mockCurrentWorkout,
      currentWorkoutExercise: null,
      updateSet: jest.fn(),
      completeSet: jest.fn(),
      finishWorkout: jest.fn(),
    });

    (useTemplateStore as unknown as jest.Mock).mockReturnValue({
        getCurrentSession: jest.fn()
    })

    const { result } = renderHook(() => useWorkoutSession('1'));

    expect(result.current.currentIndex).toBe(0);
    expect(result.current.isTemplateMode).toBe(false);
    expect(result.current.sessionData).toEqual({});
  });

  it('should handle template mode correctly', () => {
    const mockCurrentSession = {
      id: 'template_1',
      name: 'Template Session',
      exercises: [
        {
          exercise_id: 'bench_press',
          sets: 3,
          reps: 8,
          rest_seconds: 90,
        },
      ],
    };

    (useTemplateStore as unknown as jest.Mock).mockReturnValue({
      getCurrentSession: () => mockCurrentSession,
      completeSession: jest.fn(),
    });

    const { result } = renderHook(() => useWorkoutSession('template_1'));

    expect(result.current.isTemplateMode).toBe(true);
    expect(result.current.sessionData).toHaveProperty('bench_press');
  });

  it('should handle exercise navigation', () => {
    const { result } = renderHook(() => useWorkoutSession('1'));

    act(() => {
      result.current.handleNextExercise();
    });

    expect(result.current.currentIndex).toBe(0);

    act(() => {
      result.current.handlePreviousExercise();
    });

    expect(result.current.currentIndex).toBe(0);
  });

  it('should handle set completion', () => {
    const mockUpdateSet = jest.fn();
    const mockCompleteSet = jest.fn();

    (useWorkoutStore as unknown as jest.Mock).mockReturnValue({
      currentWorkout: {
        exercises: [
          {
            id: '1',
            sets: [{ completed: false }],
          },
        ],
      },
      currentWorkoutExercise: {
        id: '1',
        name: 'Test Exercise',
        muscle_groups: [],
        category: 'strength',
        is_bodyweight: false,
        sets: 1
      },
      updateSet: mockUpdateSet,
      completeSet: mockCompleteSet,
    });

    const { result } = renderHook(() => useWorkoutSession('1'));

    act(() => {
      result.current.handleSetCompleted(0);
    });

    expect(mockCompleteSet).toHaveBeenCalledWith('1', 0);
  });
}); 
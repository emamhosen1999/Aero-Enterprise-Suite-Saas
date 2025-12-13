import React, { createContext, useContext, useReducer, useEffect } from 'react';

/**
 * Global Application State Management
 * Provides centralized state management for performance and UX
 */

// Action types
const actionTypes = {
    SET_LOADING: 'SET_LOADING',
    SET_ERROR: 'SET_ERROR',
    CLEAR_ERROR: 'CLEAR_ERROR',
    SET_USER_PREFERENCES: 'SET_USER_PREFERENCES',
    SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
    ADD_NOTIFICATION: 'ADD_NOTIFICATION',
    REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
    SET_THEME: 'SET_THEME',
    SET_NETWORK_STATUS: 'SET_NETWORK_STATUS',
    UPDATE_PERFORMANCE_METRICS: 'UPDATE_PERFORMANCE_METRICS'
};

// Initial state
const initialState = {
    loading: {
        global: false,
        components: {}
    },
    error: {
        global: null,
        components: {}
    },
    user: {
        preferences: {
            theme: 'light',
            language: 'en',
            timezone: 'UTC',
            sidebarCollapsed: false,
            notifications: {
                email: true,
                browser: true,
                sound: false
            }
        }
    },
    notifications: [],
    theme: {
        mode: 'light',
        primaryColor: '#134e9d'
    },
    network: {
        online: true,
        connectionSpeed: 'fast'
    },
    performance: {
        pageLoadTime: 0,
        apiResponseTimes: {},
        memoryUsage: 0,
        renderTimes: {}
    }
};

// Reducer
const appReducer = (state, action) => {
    switch (action.type) {
        case actionTypes.SET_LOADING:
            return {
                ...state,
                loading: {
                    ...state.loading,
                    [action.payload.component || 'global']: action.payload.loading
                }
            };

        case actionTypes.SET_ERROR:
            return {
                ...state,
                error: {
                    ...state.error,
                    [action.payload.component || 'global']: action.payload.error
                }
            };

        case actionTypes.CLEAR_ERROR:
            return {
                ...state,
                error: {
                    ...state.error,
                    [action.payload.component || 'global']: null
                }
            };

        case actionTypes.SET_USER_PREFERENCES:
            return {
                ...state,
                user: {
                    ...state.user,
                    preferences: {
                        ...state.user.preferences,
                        ...action.payload
                    }
                }
            };

        case actionTypes.ADD_NOTIFICATION:
            return {
                ...state,
                notifications: [...state.notifications, {
                    id: Date.now(),
                    timestamp: new Date(),
                    ...action.payload
                }]
            };

        case actionTypes.REMOVE_NOTIFICATION:
            return {
                ...state,
                notifications: state.notifications.filter(n => n.id !== action.payload.id)
            };

        case actionTypes.SET_THEME:
            return {
                ...state,
                theme: {
                    ...state.theme,
                    ...action.payload
                }
            };

        case actionTypes.SET_NETWORK_STATUS:
            return {
                ...state,
                network: {
                    ...state.network,
                    ...action.payload
                }
            };

        case actionTypes.UPDATE_PERFORMANCE_METRICS:
            return {
                ...state,
                performance: {
                    ...state.performance,
                    ...action.payload
                }
            };

        default:
            return state;
    }
};

// Context
const AppStateContext = createContext();

// Provider component
export const AppStateProvider = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);

    // Load user preferences from localStorage on mount
    useEffect(() => {
        const savedPreferences = localStorage.getItem('userPreferences');
        if (savedPreferences) {
            try {
                const preferences = JSON.parse(savedPreferences);
                dispatch({
                    type: actionTypes.SET_USER_PREFERENCES,
                    payload: preferences
                });
            } catch (error) {
                console.warn('Failed to load user preferences:', error);
            }
        }
    }, []);

    // Save preferences to localStorage when they change
    useEffect(() => {
        localStorage.setItem('userPreferences', JSON.stringify(state.user.preferences));
    }, [state.user.preferences]);

    // Network status monitoring
    useEffect(() => {
        const updateNetworkStatus = () => {
            dispatch({
                type: actionTypes.SET_NETWORK_STATUS,
                payload: {
                    online: navigator.onLine
                }
            });
        };

        window.addEventListener('online', updateNetworkStatus);
        window.addEventListener('offline', updateNetworkStatus);

        return () => {
            window.removeEventListener('online', updateNetworkStatus);
            window.removeEventListener('offline', updateNetworkStatus);
        };
    }, []);

    // Performance monitoring
    useEffect(() => {
        if (typeof window !== 'undefined' && 'performance' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.entryType === 'navigation') {
                        dispatch({
                            type: actionTypes.UPDATE_PERFORMANCE_METRICS,
                            payload: {
                                pageLoadTime: entry.loadEventEnd - entry.fetchStart
                            }
                        });
                    }
                }
            });

            observer.observe({ entryTypes: ['navigation'] });

            return () => observer.disconnect();
        }
    }, []);

    // Action creators
    const actions = {
        setLoading: (component, loading) => dispatch({
            type: actionTypes.SET_LOADING,
            payload: { component, loading }
        }),

        setError: (component, error) => dispatch({
            type: actionTypes.SET_ERROR,
            payload: { component, error }
        }),

        clearError: (component) => dispatch({
            type: actionTypes.CLEAR_ERROR,
            payload: { component }
        }),

        updatePreferences: (preferences) => dispatch({
            type: actionTypes.SET_USER_PREFERENCES,
            payload: preferences
        }),

        addNotification: (notification) => dispatch({
            type: actionTypes.ADD_NOTIFICATION,
            payload: notification
        }),

        removeNotification: (id) => dispatch({
            type: actionTypes.REMOVE_NOTIFICATION,
            payload: { id }
        }),

        setTheme: (theme) => dispatch({
            type: actionTypes.SET_THEME,
            payload: theme
        }),

        updatePerformanceMetrics: (metrics) => dispatch({
            type: actionTypes.UPDATE_PERFORMANCE_METRICS,
            payload: metrics
        })
    };

    return (
        <AppStateContext.Provider value={{ state, actions }}>
            {children}
        </AppStateContext.Provider>
    );
};

// Custom hook to use app state
export const useAppState = () => {
    const context = useContext(AppStateContext);
    if (!context) {
        throw new Error('useAppState must be used within AppStateProvider');
    }
    return context;
};

// Performance hook
export const usePerformanceMonitor = () => {
    const { state, actions } = useAppState();

    const measureApiCall = async (apiCall, endpoint) => {
        const startTime = performance.now();
        try {
            const result = await apiCall();
            const endTime = performance.now();
            const responseTime = endTime - startTime;

            actions.updatePerformanceMetrics({
                apiResponseTimes: {
                    ...state.performance.apiResponseTimes,
                    [endpoint]: responseTime
                }
            });

            return result;
        } catch (error) {
            actions.setError('api', `API call failed: ${error.message}`);
            throw error;
        }
    };

    const measureRender = (componentName, renderFunction) => {
        const startTime = performance.now();
        const result = renderFunction();
        const endTime = performance.now();
        const renderTime = endTime - startTime;

        actions.updatePerformanceMetrics({
            renderTimes: {
                ...state.performance.renderTimes,
                [componentName]: renderTime
            }
        });

        return result;
    };

    return {
        measureApiCall,
        measureRender,
        metrics: state.performance
    };
};

export default AppStateProvider;

// Helper to set auth store reference for the API client
let getAuthState = () => ({});

export const setAuthStoreRef = (getState: () => any) => {
  getAuthState = getState;
};

export const getAuthStoreRef = () => getAuthState;
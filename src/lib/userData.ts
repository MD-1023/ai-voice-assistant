
import { UserData } from './types';

// Store user data in local storage
export const saveUserData = (userData: UserData): void => {
  const existingUsers = getUsersData();
  const userIndex = existingUsers.findIndex(user => user.email === userData.email);
  
  if (userIndex >= 0) {
    existingUsers[userIndex] = userData;
  } else {
    existingUsers.push(userData);
  }
  
  localStorage.setItem("aiAssistantUsers", JSON.stringify(existingUsers));
  localStorage.setItem("conversation_history", JSON.stringify(userData.conversations));
};

// Get all users data
export const getUsersData = (): UserData[] => {
  const data = localStorage.getItem("aiAssistantUsers");
  return data ? JSON.parse(data) : [];
};

// Get specific user data
export const getUserData = (email: string): UserData | undefined => {
  if (!email) return undefined;
  
  const users = getUsersData();
  const userData = users.find(user => user.email.toLowerCase() === email.toLowerCase());
  return userData;
};

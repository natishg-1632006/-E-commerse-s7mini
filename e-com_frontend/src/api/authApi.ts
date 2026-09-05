import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const COGNITO_REGION = import.meta.env.VITE_COGNITO_REGION || 'ap-south-2';
export const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || '';
export const COGNITO_URL = import.meta.env.VITE_COGNITO_ENDPOINT || `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`;

// Axios instance for protected backend requests
export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Automatically attach AccessToken to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('natcart_access_token') || localStorage.getItem('natcart_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Cognito HTTP Client
export const cognitoClient = axios.create({
  baseURL: COGNITO_URL,
  headers: {
    'Content-Type': 'application/x-amz-json-1.1',
  },
});

export const callCognito = async (target: string, payload: any) => {
  try {
    // Re-verify baseURL in case it was created before env load completed in some edge builds
    const url = import.meta.env.VITE_COGNITO_ENDPOINT || COGNITO_URL;
    const response = await cognitoClient.post(url, payload, {
      headers: {
        'X-Amz-Target': `AWSCognitoIdentityProviderService.${target}`,
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      const cognitoError = error.response.data;
      const type = cognitoError.__type || '';
      const message = cognitoError.message || 'AWS Cognito operation failed';

      if (type.includes('UsernameExistsException')) {
        throw new Error('An account with this email already exists.');
      } else if (type.includes('CodeMismatchException')) {
        throw new Error('Invalid verification code. Please check and try again.');
      } else if (type.includes('ExpiredCodeException')) {
        throw new Error('Verification code has expired. Please request a new one.');
      } else if (type.includes('NotAuthorizedException')) {
        throw new Error('Incorrect email or password.');
      } else if (type.includes('UserNotConfirmedException')) {
        throw new Error('User is not confirmed. Please verify your email first.');
      } else if (type.includes('UserNotFoundException')) {
        throw new Error('No account found with this email.');
      } else if (type.includes('InvalidPasswordException')) {
        throw new Error('Password does not meet the policy requirements.');
      } else if (type.includes('LimitExceededException')) {
        throw new Error('Attempt limit exceeded. Please try again later.');
      } else if (type.includes('TooManyRequestsException')) {
        throw new Error('Too many requests. Please try again later.');
      } else if (type.includes('InvalidParameterException')) {
        throw new Error('Invalid parameter. Please check your inputs.');
      } else if (type.includes('PasswordResetRequiredException')) {
        throw new Error('Password reset is required.');
      }
      throw new Error(message);
    }
    throw new Error(error.message || 'Network error occurred. Please check your connection.');
  }
};

export const getUserProfileApi = async (): Promise<any> => {
  const response = await api.get('/api/v1/users/profile');
  return response.data;
};

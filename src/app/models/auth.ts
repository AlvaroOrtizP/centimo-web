export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token?: string;
  preAuthToken?: string;
  requires2fa?: boolean;
}

export interface Verify2faRequest {
  preAuthToken: string;
  code: string;
}

export interface TotpSetupResponse {
  secret?: string;
  otpauthUrl?: string;
  backupCodes?: string[];
}

export interface Confirm2faRequest {
  code: string;
}

export interface Disable2faRequest {
  password: string;
}

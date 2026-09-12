export type StaffRole = "admin" | "operator" | "superadmin";

const SESSION_KEY = "staff_auth";
const ROLE_KEY = "staff_role";
const EMAIL_KEY = "staff_email";
const NICKNAME_KEY = "staff_nickname";
const EXPIRY_KEY = "staff_auth_expiry";
const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export function setStaffSession(role: StaffRole, email: string, nickname?: string | null): void {
  localStorage.setItem(SESSION_KEY, "true");
  localStorage.setItem(ROLE_KEY, role);
  localStorage.setItem(EMAIL_KEY, email);
  if (nickname) {
    localStorage.setItem(NICKNAME_KEY, nickname);
  } else {
    localStorage.removeItem(NICKNAME_KEY);
  }
  localStorage.setItem(EXPIRY_KEY, String(Date.now() + TIMEOUT_MS));
}

export function clearStaffSession(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(NICKNAME_KEY);
  localStorage.removeItem(EXPIRY_KEY);
}

export function getStaffEmail(): string | null {
  try {
    if (!isStaffSessionValid()) return null;
    return localStorage.getItem(EMAIL_KEY);
  } catch {
    return null;
  }
}

export function getStaffNickname(): string | null {
  try {
    if (!isStaffSessionValid()) return null;
    return localStorage.getItem(NICKNAME_KEY);
  } catch {
    return null;
  }
}

export function setStaffNickname(nickname: string | null): void {
  try {
    if (nickname) {
      localStorage.setItem(NICKNAME_KEY, nickname);
    } else {
      localStorage.removeItem(NICKNAME_KEY);
    }
  } catch {
    // ignore
  }
}

export function isStaffSessionValid(): boolean {
  try {
    const auth = localStorage.getItem(SESSION_KEY);
    const expiry = localStorage.getItem(EXPIRY_KEY);
    if (auth !== "true" || !expiry) return false;
    return Date.now() < parseInt(expiry, 10);
  } catch {
    return false;
  }
}

export function getStaffRole(): StaffRole | null {
  try {
    if (!isStaffSessionValid()) return null;
    const role = localStorage.getItem(ROLE_KEY);
    return role === "admin" || role === "operator" || role === "superadmin" ? role : null;
  } catch {
    return null;
  }
}

export function refreshStaffSession(): void {
  try {
    if (localStorage.getItem(SESSION_KEY) === "true") {
      localStorage.setItem(EXPIRY_KEY, String(Date.now() + TIMEOUT_MS));
    }
  } catch {
    // ignore
  }
}

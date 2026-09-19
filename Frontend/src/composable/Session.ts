const SESSION_NOTICE_KEY = 'sessionNotice';

export const SESSION_EXPIRED_MESSAGE = 'Tu sesion expiro. Vuelve a iniciar sesion.';

export function clearSession(notice?: string): void {
    localStorage.removeItem('user');
    if (notice) {
        sessionStorage.setItem(SESSION_NOTICE_KEY, notice);
    }
    window.location.replace('/');
}

export function throwSessionExpired(): never {
    clearSession(SESSION_EXPIRED_MESSAGE);
    throw new Error(SESSION_EXPIRED_MESSAGE);
}

export function takeSessionNotice(): string {
    const notice = sessionStorage.getItem(SESSION_NOTICE_KEY);
    if (notice) {
        sessionStorage.removeItem(SESSION_NOTICE_KEY);
    }
    return notice ?? '';
}

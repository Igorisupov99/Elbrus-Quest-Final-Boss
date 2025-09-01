let inMemoryToken: string | null = null;
const LS_KEY = 'accessToken';

export function setAccessToken(token: string) {
    inMemoryToken = token;
    localStorage.setItem(LS_KEY, token);
}

export function getAccessToken(): string | null {
    if (inMemoryToken) return inMemoryToken;
    const fromLS = localStorage.getItem(LS_KEY);
    if (fromLS) inMemoryToken = fromLS;
    return inMemoryToken;
}

export function clearAccessToken() {
    inMemoryToken = null;
    localStorage.removeItem(LS_KEY);
}
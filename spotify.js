/////////////////////////////////////////////////////////////////////////////////////////////////
// Code from https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow

const generateRandomString = (length) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

const sha256 = async (plain) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(plain)
    return window.crypto.subtle.digest('SHA-256', data)
}

const base64encode = (input) => {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

//
/////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////////
// Code for interacting with Spotify API (USEFUL!)

// Code challenge generation
const generateCodeChallenge = async () => {
    const verifier = generateRandomString(64);
    const challenge = base64encode(await sha256(verifier));
    return [verifier, challenge];
}

// Auth code request
const requestAuthCode = async (clientId, redirectUri, codeChallenge) => {
    const scope = 'user-read-private user-read-email'; // Add more scopes as needed
    const authUrl = new URL("https://accounts.spotify.com/authorize");

    const params = {
        response_type: "code",
        client_id: clientId,
        scope: scope,
        code_challenge_method: "S256",
        code_challenge: codeChallenge,
        redirect_uri: redirectUri,
    }

    authUrl.search = new URLSearchParams(params).toString();
    window.location.href = authUrl.toString();
}

// Exchange for access token
const getToken = async (clientId, authCode, redirectUri, codeVerifier) => {
    const payload = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: clientId,
            redirect_uri: redirectUri,
            code: authCode,
            code_verifier: codeVerifier,
        }),
    }

    const response = await fetch("https://accounts.spotify.com/api/token", payload);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(`${data.error}: ${data.error_description}`);
    }

    return data.access_token;
}

// Make API call
const getUserProfile = async (accessToken) => {
    const response = await fetch("https://api.spotify.com/v1/me", {
        headers: {
            'Authorization': 'Bearer ' + accessToken,
        },
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(`${data.error.message}`);
    }

    return data;
}

//
/////////////////////////////////////////////////////////////////////////////////////////////////

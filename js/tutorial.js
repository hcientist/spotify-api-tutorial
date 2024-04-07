/////////////////////////////////////////////////////////////////////////////////////////////////
// Below is the code for the tutorial

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

// Set up code verifier and code challenge

const displayCodeChallenge = async (verifier, challenge) => {
    document.getElementById("code-verifier").textContent = verifier;
    document.getElementById("code-challenge").textContent = challenge;
    document.getElementById("code-verifier-body").textContent = verifier;
}

const createNewCodes = () => {
    return generateCodeChallenge().then(([verifier, challenge]) => {
        localStorage.setItem("code_verifier", verifier);
        codeVerifier = verifier;
        codeChallenge = challenge;
        displayCodeChallenge(verifier, challenge);
    });
}

let codeVerifier = localStorage.getItem("code_verifier");
let codeChallenge = "";

if (!codeVerifier) {
    createNewCodes();
} else {
    sha256(codeVerifier).then((challenge) => {
        codeChallenge = base64encode(challenge);
        displayCodeChallenge(codeVerifier, codeChallenge);
    });
}

// Code for synchronized fields

if (!localStorage.getItem("redirect_uri")) {
    // Set default redirect URI
    let redirectUri = window.location.origin + window.location.pathname;
    // redirectUri = redirectUri.replace("127.0.0.1", "localhost");
    localStorage.setItem("redirect_uri", redirectUri);
}

const loadSyncFields = () => {
    const elements = document.querySelectorAll("[data-sync]");
    for (let element of elements) {
        const field = element.getAttribute("data-sync");
        const value = localStorage.getItem(field);
        if (value) {
            if (element.tagName === "INPUT") {
                element.value = value;
            } else {
                element.textContent = value;
            }
        }
    }
}

loadSyncFields();

const syncFields = (field) => {
    return (event) => {
        const value = event.target.value;
        const elements = document.querySelectorAll(`[data-sync="${field}"]`);
        for (let element of elements) {
            // Skip if element is the same as the event target
            if (element === event.target) {
                continue;
            }

            if (element.tagName === "INPUT") {
                element.value = value;
            } else {
                element.textContent = value;
            }
        }
        
        // Also store in local storage
        localStorage.setItem(field, value);
    }
}

// Populate auth code if present in URL

const urlParams = new URLSearchParams(window.location.search);
const authCode = urlParams.get("code");

if (authCode) {
    window.location.hash = "#try-login";
    document.getElementById("auth-code").textContent = authCode;
    document.getElementById("auth-code-body").textContent = authCode;
} else {
    document.getElementById("auth-code").textContent = "(No auth code found in URL 😢)";
}

// Read access token from local storage

let accessToken = localStorage.getItem("access_token");
if (accessToken) {
    document.getElementById("access-token").textContent = accessToken;
} else {
    document.getElementById("access-token").textContent = "(No access token found in local storage 😢)";
}

// Set up event handlers

document.getElementById("paste-client-id").addEventListener("change", syncFields("client_id"));
document.getElementById("login-client-id").addEventListener("change", syncFields("client_id"));
document.getElementById("login-redirect-uri").addEventListener("change", syncFields("redirect_uri"));

document.getElementById("generate-button").addEventListener("click", createNewCodes);

document.getElementById("login-button").addEventListener("click", () => {
    const clientId = document.getElementById("login-client-id").value;
    const redirectUri = document.getElementById("login-redirect-uri").value;

    if (!clientId || !redirectUri) {
        alert("Please provide a client ID and redirect URI.");
        return;
    }

    requestAuthCode(clientId, redirectUri, codeChallenge);
});

document.getElementById("token-button").addEventListener("click", () => {
    const clientId = document.getElementById("login-client-id").value;
    const redirectUri = document.getElementById("login-redirect-uri").value;

    if (!clientId || !authCode || !redirectUri) {
        alert("Please provide a client ID, auth code, and redirect URI.");
        return;
    }

    getToken(clientId, redirectUri, authCode, codeVerifier).then((data) => {
        accessToken = data.access_token;
        document.getElementById("access-token").textContent = accessToken;
        localStorage.setItem("access_token", accessToken);
        alert("Access token received and stored in local storage.");
    }).catch((error) => {
        alert(`Error: ${error.message}`);
    });
});

document.getElementById("profile-button").addEventListener("click", () => {
    if (!accessToken) {
        alert("Please get an access token first.");
        return;
    }

    getUserProfile(accessToken).then((profile) => {
        document.getElementById("profile-image").src = profile.images[profile.images.length - 1].url;
        document.getElementById("profile-name").textContent = profile.display_name;
    }).catch((error) => {
        alert(`Error: ${error.message}`);
    });
});

//
/////////////////////////////////////////////////////////////////////////////////////////////////

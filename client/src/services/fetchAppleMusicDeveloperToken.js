import { baseUrl } from "./baseUrl";

async function fetchAppleMusicDeveloperToken() {
    const response = await fetch(`${baseUrl}apple-music/developer-token`);

    if (!response.ok) {
        throw new Error(`Apple Music developer token request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.token;
}

export default fetchAppleMusicDeveloperToken;

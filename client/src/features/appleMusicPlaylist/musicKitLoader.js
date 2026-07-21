const MUSICKIT_SCRIPT_URL = 'https://js-cdn.music.apple.com/musickit/v3/musickit.js';
const MUSICKIT_SCRIPT_ATTR = 'data-musickit-loader';

let musicKitLoadPromise = null;

export function loadMusicKit() {
    if (window.MusicKit) {
        return Promise.resolve(window.MusicKit);
    }

    if (musicKitLoadPromise) {
        return musicKitLoadPromise;
    }

    musicKitLoadPromise = new Promise((resolve, reject) => {
        const onLoaded = () => resolve(window.MusicKit);

        const existingScript = document.querySelector(`script[${MUSICKIT_SCRIPT_ATTR}]`);
        if (existingScript) {
            document.addEventListener('musickitloaded', onLoaded, { once: true });
            return;
        }

        const script = document.createElement('script');
        script.src = MUSICKIT_SCRIPT_URL;
        script.async = true;
        script.setAttribute(MUSICKIT_SCRIPT_ATTR, 'true');
        script.onerror = () => reject(new Error('Failed to load Apple MusicKit JS.'));
        document.addEventListener('musickitloaded', onLoaded, { once: true });
        document.head.appendChild(script);
    }).catch((err) => {
        musicKitLoadPromise = null;
        throw err;
    });

    return musicKitLoadPromise;
}

export default loadMusicKit;

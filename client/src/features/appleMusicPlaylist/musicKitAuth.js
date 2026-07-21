import loadMusicKit from './musicKitLoader';
import fetchAppleMusicDeveloperToken from '../../services/fetchAppleMusicDeveloperToken';

let configurePromise = null;

async function configureMusicKit() {
    const MusicKit = await loadMusicKit();

    if (!configurePromise) {
        configurePromise = fetchAppleMusicDeveloperToken().then(async (developerToken) => {
            const instance = await MusicKit.configure({
                developerToken,
                app: {
                    name: 'Music Historeum',
                    build: '1.0.0',
                },
            });
            return instance || MusicKit.getInstance();
        }).catch((err) => {
            configurePromise = null;
            throw err;
        });
    }

    return configurePromise;
}

export async function getAuthorizedMusicKitInstance() {
    const instance = await configureMusicKit();

    if (!instance.isAuthorized) {
        try {
            await instance.authorize();
        } catch (err) {
            throw new Error('Apple Music sign-in was cancelled or failed.');
        }
    }

    return instance;
}

export default getAuthorizedMusicKitInstance;

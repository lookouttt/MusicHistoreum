import { useEffect, useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, FormGroup, Label, Input } from 'reactstrap';
import createAppleMusicPlaylist from './createAppleMusicPlaylist';
import getAuthorizedMusicKitInstance from './musicKitAuth';
import fetchLibraryPlaylists from './fetchLibraryPlaylists';

// Our own code already crafts a friendly message for these specific cases (musicKitLoader.js,
// musicKitAuth.js, fetchAppleMusicDeveloperToken.js) - pass those through as-is. Anything else
// is either a raw network failure or an unvetted MusicKit/Apple SDK internal error message, so
// fall back to a generic message rather than showing that directly to the user.
const KNOWN_FRIENDLY_MESSAGES = [
    'Failed to load Apple MusicKit JS.',
    'Apple Music sign-in was cancelled or failed.',
];

function getFriendlyErrorMessage(err) {
    const message = err?.message || '';
    if (KNOWN_FRIENDLY_MESSAGES.some((known) => message.includes(known)))
        return message;
    if (message.includes('developer token request failed'))
        return "Couldn't reach Music Historeum's server to authorize with Apple Music. Please try again later.";
    if (err?.name === 'TypeError' || /network|fetch/i.test(message))
        return "Couldn't reach Apple Music. Check your connection and try again.";
    return 'Something went wrong talking to Apple Music. Please try again.';
}

const CreatePlaylistModal = ({ isOpen, toggle, songs, defaultPlaylistName }) => {
    const [mode, setMode] = useState('new'); // 'new' | 'existing'
    const [playlistName, setPlaylistName] = useState(defaultPlaylistName || '');
    const [existingPlaylists, setExistingPlaylists] = useState([]);
    const [selectedPlaylistId, setSelectedPlaylistId] = useState('');
    const [playlistsLoading, setPlaylistsLoading] = useState(false);
    const [playlistsError, setPlaylistsError] = useState(false);
    const [preferClean, setPreferClean] = useState(true);
    const [status, setStatus] = useState('idle'); // idle | working | done | error
    const [progress, setProgress] = useState(null);
    const [result, setResult] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            setMode('new');
            setPlaylistName(defaultPlaylistName || '');
            setSelectedPlaylistId('');
            setStatus('idle');
            setProgress(null);
            setResult(null);
            setErrorMessage('');

            setPlaylistsLoading(true);
            setPlaylistsError(false);
            getAuthorizedMusicKitInstance()
                .then((instance) => fetchLibraryPlaylists(instance))
                .then((playlists) => setExistingPlaylists(playlists))
                .catch(() => setPlaylistsError(true))
                .finally(() => setPlaylistsLoading(false));
        }
    }, [isOpen, defaultPlaylistName]);

    const handleCreate = async () => {
        setStatus('working');
        setErrorMessage('');
        try {
            const summary = await createAppleMusicPlaylist({
                playlistName: mode === 'new' ? playlistName : undefined,
                targetPlaylistId: mode === 'existing' ? selectedPlaylistId : undefined,
                songs,
                preferClean,
                onProgress: setProgress,
            });
            setResult(summary);
            setStatus('done');
        } catch (err) {
            setErrorMessage(getFriendlyErrorMessage(err));
            setStatus('error');
        }
    };

    const canSubmit = songs.length > 0 && (mode === 'new' ? !!playlistName : !!selectedPlaylistId);
    const selectedPlaylistName = existingPlaylists.find((p) => p.id === selectedPlaylistId)?.name;

    return (
        <Modal isOpen={isOpen} toggle={toggle} className='modalStyle'>
            <ModalHeader toggle={toggle}>Save to Apple Music</ModalHeader>
            <ModalBody>
                {status === 'idle' && (
                    <>
                        <FormGroup tag='fieldset'>
                            <FormGroup check>
                                <Label check>
                                    <Input
                                        type='radio'
                                        name='playlistMode'
                                        checked={mode === 'new'}
                                        onChange={() => setMode('new')}
                                    />
                                    {' '}Create a new playlist
                                </Label>
                            </FormGroup>
                            <FormGroup check>
                                <Label check>
                                    <Input
                                        type='radio'
                                        name='playlistMode'
                                        checked={mode === 'existing'}
                                        onChange={() => setMode('existing')}
                                        disabled={!playlistsLoading && !playlistsError && existingPlaylists.length === 0}
                                    />
                                    {' '}Add to an existing playlist
                                </Label>
                            </FormGroup>
                        </FormGroup>

                        {mode === 'new' && (
                            <FormGroup>
                                <Label htmlFor='playlistName'>Playlist Name</Label>
                                <Input
                                    id='playlistName'
                                    value={playlistName}
                                    onChange={(e) => setPlaylistName(e.target.value)}
                                />
                            </FormGroup>
                        )}

                        {mode === 'existing' && (
                            <FormGroup>
                                <Label htmlFor='existingPlaylist'>Playlist</Label>
                                {playlistsLoading ? (
                                    <p>Loading your playlists&hellip;</p>
                                ) : playlistsError ? (
                                    <p className='text-danger'>Couldn't load your Apple Music playlists.</p>
                                ) : existingPlaylists.length === 0 ? (
                                    <p>You don't have any Apple Music playlists yet.</p>
                                ) : (
                                    <Input
                                        type='select'
                                        id='existingPlaylist'
                                        value={selectedPlaylistId}
                                        onChange={(e) => setSelectedPlaylistId(e.target.value)}
                                    >
                                        <option value=''>Select a playlist&hellip;</option>
                                        {existingPlaylists.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </Input>
                                )}
                            </FormGroup>
                        )}

                        <p>{songs.length} song{songs.length === 1 ? '' : 's'} will be added.</p>
                        <FormGroup check>
                            <Label check>
                                <Input
                                    type='checkbox'
                                    checked={preferClean}
                                    onChange={(e) => setPreferClean(e.target.checked)}
                                />
                                {' '}Prefer clean versions when available
                            </Label>
                        </FormGroup>
                        <Button
                            disabled={!canSubmit}
                            style={{ backgroundColor: '#483d8b', color: 'white' }}
                            onClick={handleCreate}
                        >
                            {mode === 'new' ? 'Create' : 'Add'}
                        </Button>
                    </>
                )}

                {status === 'working' && (
                    <p role='status' aria-live='polite'>
                        {progress?.stage === 'adding'
                            ? `Adding to playlist (${progress.completed} of ${progress.total})…`
                            : `Searching Apple Music${progress ? ` (${progress.completed} of ${progress.total})` : '…'}`}
                    </p>
                )}

                {status === 'error' && (
                    <>
                        <p className='text-danger' role='alert' aria-live='assertive'>{errorMessage}</p>
                        <Button onClick={handleCreate}>Try Again</Button>
                    </>
                )}

                {status === 'done' && result && (
                    <>
                        <p>
                            {result.targetPlaylistId && mode === 'existing'
                                ? `Added ${result.addedCount} of ${result.totalSelected} songs to "${selectedPlaylistName}".`
                                : `Playlist "${result.playlistName}" created with ${result.addedCount} of ${result.totalSelected} songs.`}
                        </p>
                        {result.unmatched.length > 0 && (
                            <>
                                <p>These songs couldn't be matched on Apple Music:</p>
                                <ul>
                                    {result.unmatched.map((title) => <li key={title}>{title}</li>)}
                                </ul>
                            </>
                        )}
                        <Button onClick={toggle}>Close</Button>
                    </>
                )}
            </ModalBody>
        </Modal>
    );
};

export default CreatePlaylistModal;

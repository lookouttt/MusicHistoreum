import { useEffect, useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, FormGroup, Label, Input } from 'reactstrap';
import createAppleMusicPlaylist from './createAppleMusicPlaylist';
import getAuthorizedMusicKitInstance from './musicKitAuth';
import fetchLibraryPlaylists from './fetchLibraryPlaylists';
import UnmatchedSongItem from './UnmatchedSongItem';

// Our own code already crafts a friendly message for these specific cases (musicKitLoader.js,
// musicKitAuth.js, fetchAppleMusicDeveloperToken.js) - pass those through as-is. Anything else
// is either a raw network failure or an unvetted MusicKit/Apple SDK internal error message, so
// fall back to a generic message rather than showing that directly to the user.
const KNOWN_FRIENDLY_MESSAGES = [
    'Failed to load Apple MusicKit JS.',
    'Apple Music sign-in was cancelled or failed.',
];

// Survives even if the modal closes unexpectedly mid-review (e.g. the tab was backgrounded long
// enough for the browser to reclaim it) - the run's own summary is otherwise only ever held in
// this component's local state, with nowhere else to see it afterward.
const LAST_RESULT_KEY = 'appleMusicPlaylistLastResult';

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
    // Seeded from result.playlistKnownIdentities/playlistKnownTextKeys whenever a result is set
    // (fresh run or restored), then grown as manual "add this candidate" picks succeed, so a song
    // picked for one unmatched entry is recognized if it also shows up as a candidate elsewhere in
    // the same review session.
    const [knownIdentities, setKnownIdentities] = useState([]);
    const [knownTextKeys, setKnownTextKeys] = useState([]);
    const [knownTracks, setKnownTracks] = useState([]);

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
        if (status === 'working')
            return;
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
            setKnownIdentities(summary.playlistKnownIdentities || []);
            setKnownTextKeys(summary.playlistKnownTextKeys || []);
            setKnownTracks(summary.playlistKnownTracks || []);
            setStatus('done');
            try {
                sessionStorage.setItem(LAST_RESULT_KEY, JSON.stringify(summary));
            } catch (err) {
                // sessionStorage unavailable (private browsing, quota, etc.) - not critical, the
                // result is still shown normally, it just won't survive an unexpected modal close.
            }
        } catch (err) {
            setErrorMessage(getFriendlyErrorMessage(err));
            setStatus('error');
        }
    };

    const handleViewLastResult = () => {
        try {
            const saved = sessionStorage.getItem(LAST_RESULT_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                setResult(parsed);
                setKnownIdentities(parsed.playlistKnownIdentities || []);
                setKnownTextKeys(parsed.playlistKnownTextKeys || []);
                setKnownTracks(parsed.playlistKnownTracks || []);
                setStatus('done');
            }
        } catch (err) {
            // Nothing to show if it's missing or corrupt - the button just won't do anything.
        }
    };

    const canSubmit = songs.length > 0 && (mode === 'new' ? !!playlistName : !!selectedPlaylistId);
    // Derived from the result itself, not from `mode`/`selectedPlaylistId` component state, so a
    // result restored via "View last result" (see handleViewLastResult) displays correctly even
    // though those selection-form fields have since reset back to their defaults.
    const targetPlaylistName = existingPlaylists.find((p) => p.id === result?.targetPlaylistId)?.name;

    return (
        <Modal isOpen={isOpen} toggle={toggle} backdrop='static' className='modalStyle'>
            <ModalHeader toggle={toggle}>Save to Apple Music</ModalHeader>
            <ModalBody>
                {status === 'idle' && (
                    <>
                        {sessionStorage.getItem(LAST_RESULT_KEY) && (
                            <p>
                                <Button size='sm' color='link' className='p-0' onClick={handleViewLastResult}>
                                    View results from your last completed run
                                </Button>
                            </p>
                        )}
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
                            : progress?.stage === 'checking-playlist'
                                ? `Checking existing playlist for duplicates (${progress.completed} tracks found so far)…`
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
                            {result.createdNewPlaylist
                                ? `Playlist "${result.playlistName}" created with ${result.addedCount} of ${result.totalSelected} songs.`
                                : `Added ${result.addedCount} of ${result.totalSelected} songs to "${targetPlaylistName || 'your playlist'}".`}
                        </p>
                        <p>{result.foundInLibraryCount} song{result.foundInLibraryCount === 1 ? '' : 's'} found already in your Apple Music library, {result.addedToLibraryCount} newly added to it.</p>
                        {result.duplicateCount > 0 && (
                            <p>{result.duplicateCount} song{result.duplicateCount === 1 ? '' : 's'} already on the playlist {result.duplicateCount === 1 ? 'was' : 'were'} skipped.</p>
                        )}
                        {result.unmatched.length > 0 && (
                            <>
                                <p>These songs couldn't be matched on Apple Music:</p>
                                <ul>
                                    {result.unmatched.map(({ title, reason, candidates }) => (
                                        <UnmatchedSongItem
                                            key={title}
                                            title={title}
                                            reason={reason}
                                            candidates={candidates}
                                            playlistId={result.targetPlaylistId}
                                            knownIdentities={knownIdentities}
                                            knownTextKeys={knownTextKeys}
                                            knownTracks={knownTracks}
                                            onAdded={(identity, textKey, track) => {
                                                setKnownIdentities((prev) => [...prev, identity]);
                                                setKnownTextKeys((prev) => [...prev, textKey]);
                                                setKnownTracks((prev) => [...prev, track]);
                                            }}
                                        />
                                    ))}
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

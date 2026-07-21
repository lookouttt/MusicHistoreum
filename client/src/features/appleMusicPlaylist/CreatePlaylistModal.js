import { useEffect, useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, FormGroup, Label, Input } from 'reactstrap';
import createAppleMusicPlaylist from './createAppleMusicPlaylist';

const CreatePlaylistModal = ({ isOpen, toggle, songs, defaultPlaylistName }) => {
    const [playlistName, setPlaylistName] = useState(defaultPlaylistName || '');
    const [preferClean, setPreferClean] = useState(true);
    const [status, setStatus] = useState('idle'); // idle | working | done | error
    const [progress, setProgress] = useState(null);
    const [result, setResult] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            setPlaylistName(defaultPlaylistName || '');
            setStatus('idle');
            setProgress(null);
            setResult(null);
            setErrorMessage('');
        }
    }, [isOpen, defaultPlaylistName]);

    const handleCreate = async () => {
        setStatus('working');
        setErrorMessage('');
        try {
            const summary = await createAppleMusicPlaylist({
                playlistName,
                songs,
                preferClean,
                onProgress: setProgress,
            });
            setResult(summary);
            setStatus('done');
        } catch (err) {
            setErrorMessage(err.message || 'Something went wrong creating the playlist.');
            setStatus('error');
        }
    };

    return (
        <Modal isOpen={isOpen} toggle={toggle} className='modalStyle'>
            <ModalHeader toggle={toggle}>Create Apple Music Playlist</ModalHeader>
            <ModalBody>
                {status === 'idle' && (
                    <>
                        <FormGroup>
                            <Label htmlFor='playlistName'>Playlist Name</Label>
                            <Input
                                id='playlistName'
                                value={playlistName}
                                onChange={(e) => setPlaylistName(e.target.value)}
                            />
                        </FormGroup>
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
                            disabled={!playlistName || songs.length === 0}
                            style={{ backgroundColor: '#483d8b', color: 'white' }}
                            onClick={handleCreate}
                        >
                            Create
                        </Button>
                    </>
                )}

                {status === 'working' && (
                    <p>
                        Searching Apple Music{progress ? ` (${progress.completed} of ${progress.total})` : '…'}
                    </p>
                )}

                {status === 'error' && (
                    <>
                        <p className='text-danger'>{errorMessage}</p>
                        <Button onClick={handleCreate}>Try Again</Button>
                    </>
                )}

                {status === 'done' && result && (
                    <>
                        <p>
                            Playlist "{result.playlistName}" created with {result.addedCount} of {result.totalSelected} songs.
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

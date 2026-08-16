import { useState } from 'react';
import { Button } from 'reactstrap';
import { addCandidateToPlaylist } from './createAppleMusicPlaylist';

const UnmatchedSongItem = ({ title, reason, candidates, playlistId, knownIdentities, knownTextKeys, onAdded }) => {
    const [expanded, setExpanded] = useState(false);
    const [addingId, setAddingId] = useState(null);
    const [addedId, setAddedId] = useState(null);
    const [alreadyOnPlaylistId, setAlreadyOnPlaylistId] = useState(null);
    const [error, setError] = useState('');

    const handleAdd = async (candidate) => {
        setAddingId(candidate.id);
        setError('');
        try {
            const outcome = await addCandidateToPlaylist(playlistId, candidate, knownIdentities, knownTextKeys);
            if (outcome.alreadyOnPlaylist) {
                setAlreadyOnPlaylistId(candidate.id);
            } else {
                setAddedId(candidate.id);
                // Shares this pick's identity with sibling rows in the same review session, so
                // picking the same song for two different unmatched entries doesn't double-add it.
                onAdded && onAdded(outcome.identity, outcome.textKey);
            }
        } catch (err) {
            setError("Couldn't add this track. Please try again.");
        } finally {
            setAddingId(null);
        }
    };

    if (addedId) {
        const added = candidates.find((c) => c.id === addedId);
        return <li>{title} — Added "{added?.name}" by {added?.artistName} ✓</li>;
    }

    if (alreadyOnPlaylistId) {
        const already = candidates.find((c) => c.id === alreadyOnPlaylistId);
        return <li>{title} — "{already?.name}" by {already?.artistName} is already on this playlist.</li>;
    }

    return (
        <li>
            {title}{reason ? ` — ${reason}` : ''}
            {candidates.length > 0 && (
                <>
                    {' '}
                    <Button size='sm' color='link' className='p-0' onClick={() => setExpanded((e) => !e)}>
                        {expanded ? 'Hide possible matches' : `Show possible matches (${candidates.length})`}
                    </Button>
                    {expanded && (
                        <ul>
                            {candidates.map((candidate) => (
                                <li key={candidate.id}>
                                    {candidate.name} — {candidate.artistName}
                                    {candidate.albumName ? ` (${candidate.albumName})` : ''}
                                    {candidate.contentRating === 'explicit' ? ' [Explicit]' : ''}
                                    {' '}
                                    <Button
                                        size='sm'
                                        disabled={!!addingId}
                                        onClick={() => handleAdd(candidate)}
                                    >
                                        {addingId === candidate.id ? 'Adding…' : 'Add this one'}
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}
            {error && <span className='text-danger'> {error}</span>}
        </li>
    );
};

export default UnmatchedSongItem;

import { useState } from 'react';
import { Button } from 'reactstrap';
import CreatePlaylistModal from './CreatePlaylistModal';

const TOP_N_PRESETS = [50, 75, 100];

const AppleMusicPlaylistToolbar = ({ data, selectedIds, onSelectTopN, onClear, defaultPlaylistName }) => {
    const [customN, setCustomN] = useState('');
    const [modalOpen, setModalOpen] = useState(false);

    const selectedSongs = data.filter((row) => selectedIds.has(String(row.song_id)));

    const applyCustomN = () => {
        const n = parseInt(customN, 10);
        if (n > 0)
            onSelectTopN(n);
    };

    return (
        <div className='appleMusicToolbar' style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
            <span>Select top:</span>
            {TOP_N_PRESETS.map((n) => (
                <Button key={n} size='sm' outline onClick={() => onSelectTopN(n)}>
                    {n}
                </Button>
            ))}
            <input
                type='number'
                min='1'
                placeholder='Custom'
                value={customN}
                onChange={(e) => setCustomN(e.target.value)}
                style={{ width: '70px' }}
                className='form-control form-control-sm'
            />
            <Button size='sm' outline onClick={applyCustomN}>Apply</Button>
            <Button size='sm' outline onClick={onClear}>Clear selection</Button>
            <span>Selected: {selectedIds.size} song{selectedIds.size === 1 ? '' : 's'}</span>
            <Button
                size='sm'
                disabled={selectedIds.size === 0}
                style={{ backgroundColor: '#483d8b', color: 'white', border: 'none' }}
                onClick={() => setModalOpen(true)}
            >
                <i className='fa fa-music' /> Create Apple Music Playlist
            </Button>
            <CreatePlaylistModal
                isOpen={modalOpen}
                toggle={() => setModalOpen(false)}
                songs={selectedSongs}
                defaultPlaylistName={defaultPlaylistName}
            />
        </div>
    );
};

export default AppleMusicPlaylistToolbar;

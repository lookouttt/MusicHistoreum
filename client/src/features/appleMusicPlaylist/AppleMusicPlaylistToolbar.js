import { useState } from 'react';
import { Button } from 'reactstrap';
import CreatePlaylistModal from './CreatePlaylistModal';
import Icon from '../../components/Icon';

const TOP_N_PRESETS = [50, 75, 100];

const AppleMusicPlaylistToolbar = ({
    data, selectedIds, onSelectTopN, onClear, defaultPlaylistName,
    showTopNPresets = true, onSelectAll, selectAllLoading = false,
}) => {
    const [topNSelection, setTopNSelection] = useState('');
    const [customN, setCustomN] = useState('');
    const [modalOpen, setModalOpen] = useState(false);

    // a song can appear on more than one row (e.g. multiple years/charts on the
    // annual top songs page) -- dedupe by song_id so it's only added to the
    // playlist once, keeping whichever row is encountered first.
    const selectedSongsById = new Map();
    data.forEach((row) => {
        const id = String(row.song_id);
        if (selectedIds.has(id) && !selectedSongsById.has(id)) {
            selectedSongsById.set(id, row);
        }
    });
    const selectedSongs = Array.from(selectedSongsById.values());

    const applyCustomN = () => {
        const n = parseInt(customN, 10);
        if (n > 0)
            onSelectTopN(n);
    };

    const handleTopNChange = (e) => {
        const value = e.target.value;
        setTopNSelection(value);
        if (value === 'all')
            onSelectTopN(Infinity);
        else if (value !== 'custom' && value !== '')
            onSelectTopN(Number(value));
    };

    return (
        <div
            className='appleMusicToolbar'
            style={{
                display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.85)',
                borderRadius: '0.3rem',
            }}
        >
            {showTopNPresets && (
                <>
                    <span>Select top:</span>
                    <select
                        value={topNSelection}
                        onChange={handleTopNChange}
                        className='form-select form-select-sm'
                        style={{ width: 'auto' }}
                    >
                        <option value='' disabled>Choose…</option>
                        {TOP_N_PRESETS.map((n) => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                        <option value='all'>All</option>
                        <option value='custom'>Custom…</option>
                    </select>
                    {topNSelection === 'custom' && (
                        <>
                            <input
                                type='number'
                                min='1'
                                placeholder='#'
                                value={customN}
                                onChange={(e) => setCustomN(e.target.value)}
                                style={{ width: '70px' }}
                                className='form-control form-control-sm'
                            />
                            <Button size='sm' outline onClick={applyCustomN}>Apply</Button>
                        </>
                    )}
                </>
            )}
            {onSelectAll && (
                <Button size='sm' outline disabled={selectAllLoading} onClick={onSelectAll}>
                    {selectAllLoading ? 'Selecting all…' : 'Select all'}
                </Button>
            )}
            <Button size='sm' outline onClick={onClear}>Deselect all</Button>
            <span>Selected: {selectedIds.size} song{selectedIds.size === 1 ? '' : 's'}</span>
            <Button
                size='sm'
                disabled={selectedIds.size === 0}
                style={{ backgroundColor: '#483d8b', color: 'white', border: 'none' }}
                onClick={() => setModalOpen(true)}
            >
                <Icon name='music' /> Create Apple Music Playlist
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

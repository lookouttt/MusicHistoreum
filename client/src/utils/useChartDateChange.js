import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { updateCurrentChart, updatePendingDate } from '../features/chart/chartsSlice';

const useChartDateChange = (transformDate = (date) => date) => {
    const [startDate, setStartDate] = useState(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const onChange = (rawDate) => {
        const date = transformDate(rawDate);
        setStartDate(date);
        const chartDate = format(date, "yyyy-MM-dd");
        dispatch(updatePendingDate(chartDate));
        dispatch(updateCurrentChart());
        document.getElementById('root')
            .dispatchEvent(new MouseEvent('click', { shiftKey: true }));
        navigate('/Chart');
    };

    return { startDate, onChange };
};

export default useChartDateChange;

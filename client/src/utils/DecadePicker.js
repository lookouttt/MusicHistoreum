import React from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { addDays, getYear } from 'date-fns';
import DatePickerStyles from './DatePickerStyles';
import useChartDateChange from './useChartDateChange';

const roundToDecadeStart = (date) => {
    const decade = Math.floor(getYear(date) / 10) * 10;
    return new Date(decade, 0, 1);
};

const DecadePicker = ({ firstDate, lastDate }) => {
    const { startDate, onChange } = useChartDateChange(roundToDecadeStart);

    return (
        <DatePickerStyles>
            <DatePicker
                selected={startDate}
                onChange={onChange}
                minDate={new Date(firstDate)}
                maxDate={addDays(new Date(lastDate), 1)}
                showYearPicker
                dateFormat="yyyy"
                placeholderText="Select year in desired decade"
            />
        </DatePickerStyles>
    );
};

export default DecadePicker;

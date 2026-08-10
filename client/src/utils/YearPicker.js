import React from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { addDays } from 'date-fns';
import DatePickerStyles from './DatePickerStyles';
import useChartDateChange from './useChartDateChange';

const YearPicker = ({ firstDate, lastDate }) => {
    const { startDate, onChange } = useChartDateChange();

    return (
        <DatePickerStyles>
            <label className="visually-hidden" htmlFor="year-picker-input">Select a year</label>
            <DatePicker
                id="year-picker-input"
                selected={startDate}
                onChange={onChange}
                minDate={new Date(firstDate)}
                maxDate={addDays(new Date(lastDate), 1)}
                showYearPicker
                dateFormat="yyyy"
                placeholderText="Select a year"
            />
        </DatePickerStyles>
    );
};

export default YearPicker;

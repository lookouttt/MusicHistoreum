import React from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { addDays, getDay } from 'date-fns';
import DatePickerStyles from './DatePickerStyles';
import useChartDateChange from './useChartDateChange';

const isSaturday = (date) => getDay(date) === 6;

const WeekPicker = ({ firstDate, lastDate }) => {
    const { startDate, onChange } = useChartDateChange();

    return (
        <DatePickerStyles>
            <DatePicker
                selected={startDate}
                onChange={onChange}
                minDate={new Date(firstDate)}
                maxDate={addDays(new Date(lastDate), 1)}
                filterDate={isSaturday}
                placeholderText="Select a chart date"
                showMonthDropdown
                showYearDropdown
                dropdownMode='select'
            />
        </DatePickerStyles>
    );
};

export default WeekPicker;

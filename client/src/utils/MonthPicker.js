import React from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { addDays } from 'date-fns';
import DatePickerStyles from './DatePickerStyles';
import useChartDateChange from './useChartDateChange';

const MonthPicker = ({ firstDate, lastDate }) => {
    const { startDate, onChange } = useChartDateChange();

    return (
        <DatePickerStyles>
            <DatePicker
                selected={startDate}
                onChange={onChange}
                minDate={new Date(firstDate)}
                maxDate={addDays(new Date(lastDate), 1)}
                dateFormat="MM/yyyy"
                showMonthYearPicker
                showFullMonthYearPicker
                placeholderText="Select a month"
            />
        </DatePickerStyles>
    );
};

export default MonthPicker;

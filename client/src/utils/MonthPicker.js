import { useState } from 'react';
import { DatePicker } from 'react-datepicker';

const MonthPicker = () => {
    const [startDate, setStartDate] = useState(new Date());
    return (
      <DatePicker
        selected={startDate}
        onChange={(date) => setStartDate(date)}
        dateFormat="MM/yyyy"
        showMonthYearPicker
        showFullMonthYearPicker
      />
    );
  };

export default MonthPicker;
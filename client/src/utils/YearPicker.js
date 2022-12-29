import { useState } from 'react';
import { DatePicker } from 'react-datepicker';

const YearPicker = () => {
    const [startDate, setStartDate] = useState(new Date());
    return (
      <DatePicker
        selected={startDate}
        onChange={(date) => setStartDate(date)}
        showYearPicker
        dateFormat="yyyy"
      />
    );
  };

export default YearPicker;
import { useState } from 'react';
import { AccordionBody, AccordionItem, AccordionHeader } from 'reactstrap';
import WeekPicker from '../../utils/WeekPicker';
import MonthPicker from '../../utils/MonthPicker';
import YearPicker from '../../utils/YearPicker';
import DecadePicker from '../../utils/DecadePicker';
import MyDatePicker from '../../utils/WeekPicker';
import { getDay } from 'date-fns';

const TimeFrameMenu = (({bWeekly}) => {
    let index = 1;
    let timeframes = [];
    const [startDate, setStartDate] = useState(new Date());

    if (bWeekly) {
        timeframes = [
            {tf: "Weekly", picker: <><WeekPicker/></>},
            {tf: "Monthly", picker: <><MonthPicker/></>},
            {tf: "Yearly", picker: <><YearPicker/></>},
            {tf: "Decade", picker: <><DecadePicker/></>}
        ];
    } else {
        timeframes = [
            {tf: "Monthly", picker: <><MonthPicker/></>},
            {tf: "Yearly", picker: <><YearPicker/></>},
            {tf: "Decade", picker: <><DecadePicker/></>}
        ];
    }

    return (
        timeframes.map((timeframe) => {

            return (
                <AccordionItem>
                    <AccordionHeader targetId={String(index)}>
                        {timeframe.tf}
                    </AccordionHeader>
                    <AccordionBody accordionId={String(index++)}>
                        {timeframe.picker}
                    </AccordionBody>
                </AccordionItem> 
            )
        })
    );
});

export default TimeFrameMenu;
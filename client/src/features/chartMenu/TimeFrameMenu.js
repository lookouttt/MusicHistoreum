import { useState } from 'react';
import { AccordionBody, AccordionItem, AccordionHeader } from 'reactstrap';
import WeekPicker from '../../utils/WeekPicker';
import MonthPicker from '../../utils/MonthPicker';
import YearPicker from '../../utils/YearPicker';
import DecadePicker from '../../utils/DecadePicker';

const TimeFrameMenu = (({bWeekly}) => {
    let index;
    let timeframes = [];

    if (bWeekly) {
        index = 1;
        timeframes = [
            {tf: "Weekly", picker: <><WeekPicker/></>},
            {tf: "Monthly", picker: <><MonthPicker/></>},
            {tf: "Yearly", picker: <><YearPicker/></>},
            {tf: "Decade", picker: <><DecadePicker/></>}
        ];
    } else {
        index = 2;
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
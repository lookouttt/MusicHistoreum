import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Accordion, AccordionBody, AccordionItem, AccordionHeader } from 'reactstrap';
import { selectChartsMenu } from './chartsMenusSlice';
import TimeFrameMenu from './TimeFrameMenu';
import { updatePendingTimeframe } from '../chart/chartsSlice';

const SingleChartMenu = (({chartType}) => {
    const chartList = useSelector(selectChartsMenu(chartType));
    const [chartOpen, setChartOpen] = useState(false);
    const dispatch = useDispatch();

    const chartToggle = (id) => {
      if (chartOpen === id) {
        setChartOpen();
      } else {
        setChartOpen(id);
        dispatch(updatePendingTimeframe(id));
      }
      console.log('chartOpen: ',id);
    };


    return (
        chartList.map((chart) => {

            return (
                <AccordionItem>
                    <AccordionHeader targetId={String(chart.ChartId)}>
                        {chart.ChartTitle}
                    </AccordionHeader>
                    <AccordionBody accordionId={String(chart.ChartId)}>
                        <Accordion flush open={chartOpen} toggle={chartToggle}>
                            <TimeFrameMenu bWeekly={true}/>
                        </Accordion>
                    </AccordionBody>
                </AccordionItem>
            )
        })
    );
});

export default SingleChartMenu;
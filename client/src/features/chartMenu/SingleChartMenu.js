import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Accordion, AccordionBody, AccordionItem, AccordionHeader } from 'reactstrap';
import { selectChartsMenu } from './chartsMenusSlice';
import TimeFrameMenu from './TimeFrameMenu';

const SingleChartMenu = (({chartType}) => {
    const chartList = useSelector(selectChartsMenu(chartType));
    const [chartOpen, setChartOpen] = useState(false);

    const chartToggle = (id) => {
      if (chartOpen === id) {
        setChartOpen();
      } else {
        setChartOpen(id);
      }
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
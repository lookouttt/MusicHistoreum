import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Accordion, AccordionBody, AccordionItem, AccordionHeader } from 'reactstrap';
import { selectSongCharts } from './songChartMenusSlice';
import { selectAlbumCharts } from './albumChartMenusSlice';
import TimeFrameMenu from './TimeFrameMenu';

const ChartMenu = () => {
    const songChartList = useSelector(selectSongCharts);
    const albumChartList = useSelector(selectAlbumCharts);
    const songChartTitle = songChartList.map((curChart) => {
        return curChart.ChartTitle;
    });

    const albumChartTitle = albumChartList.map((curChart) => {
        return curChart.ChartTitle;
    });

    const [mainOpen, setMainOpen] = useState(false);

    const mainToggle = (id) => {
      if (mainOpen === id) {
        setMainOpen();
      } else {
        setMainOpen(id);
      }
    };

    const [songsOpen, setSongsOpen] = useState(false);
    const songsToggle = (id) => {
      if (songsOpen === id) {
        setSongsOpen();
      } else {
        setSongsOpen(id);
      }
    };

    const [albumsOpen, setAlbumsOpen] = useState(false);
    const albumsToggle = (id) => {
      if (albumsOpen === id) {
        setAlbumsOpen();
      } else {
        setAlbumsOpen(id);
      }
    };

    const [songChartOpen, setSongChartOpen] = useState(false);
    const songChartToggle = (id) => {
      if (songChartOpen === id) {
        setSongChartOpen();
      } else {
        setSongChartOpen(id);
      }
    };

    const [albumChartOpen, setAlbumChartOpen] = useState(false);
    const albumChartToggle = (id) => {
      if (albumChartOpen === id) {
        setAlbumChartOpen();
      } else {
        setAlbumChartOpen(id);
      }
    };

    let index = 1;

    // if (chartList && chartList.length > 0) {
    //     chartList.map((curChart) => {
            return(
                <Accordion flush open={mainOpen} toggle={mainToggle}>
                <AccordionItem>
                    <AccordionHeader targetId='1'>
                        Songs
                    </AccordionHeader>
                    <AccordionBody accordionId='1'>
                        <Accordion flush open={songsOpen} toggle={songsToggle}>
                            <AccordionItem>
                                <AccordionHeader targetId='1'>
                                    {songChartTitle[0]}
                                </AccordionHeader>
                                <AccordionBody accordionId='1'>
                                    <Accordion flush open={songChartOpen} toggle={songChartToggle}>
                                        <TimeFrameMenu bWeekly={true}/>
                                    </Accordion>
                                </AccordionBody>
                            </AccordionItem>
                            <AccordionItem>
                                <AccordionHeader targetId='2'>
                                    {songChartTitle[1]}
                                </AccordionHeader>
                                <AccordionBody accordionId='2'>
                                    <Accordion flush open={songChartOpen} toggle={songChartToggle}>
                                        <TimeFrameMenu bWeekly={false}/>
                                    </Accordion>
                                </AccordionBody>
                            </AccordionItem>
                            <AccordionItem>
                                <AccordionHeader targetId='3'>
                                    {songChartTitle[2]}
                                </AccordionHeader>
                                <AccordionBody accordionId='3'>
                                    <Accordion flush open={songChartOpen} toggle={songChartToggle}>
                                        <TimeFrameMenu bWeekly={false}/>
                                    </Accordion>
                                </AccordionBody>
                            </AccordionItem>
                            <AccordionItem>
                                <AccordionHeader targetId='4'>
                                    {songChartTitle[3]}
                                </AccordionHeader>
                                <AccordionBody accordionId='4'>
                                    <Accordion flush open={songChartOpen} toggle={songChartToggle}>
                                        <TimeFrameMenu bWeekly={false}/>
                                    </Accordion>
                                </AccordionBody>
                            </AccordionItem>
                            <AccordionItem>
                                <AccordionHeader targetId='5'>
                                    {songChartTitle[4]}
                                </AccordionHeader>
                                <AccordionBody accordionId='5'>
                                    <Accordion flush open={songChartOpen} toggle={songChartToggle}>
                                        <TimeFrameMenu bWeekly={false}/>
                                    </Accordion>
                                </AccordionBody>
                            </AccordionItem>
                            <AccordionItem>
                                <AccordionHeader targetId='6'>
                                    {songChartTitle[5]}
                                </AccordionHeader>
                                <AccordionBody accordionId='6'>
                                    <Accordion flush open={songChartOpen} toggle={songChartToggle}>
                                        <TimeFrameMenu bWeekly={false}/>
                                    </Accordion>
                                </AccordionBody>
                            </AccordionItem>
                        </Accordion>
                    </AccordionBody>
                </AccordionItem>
                <AccordionItem>
                    <AccordionHeader targetId='2'>
                        Albums
                    </AccordionHeader>
                    <AccordionBody accordionId='2'>
                        <Accordion flush open={albumsOpen} toggle={albumsToggle}>
                            <AccordionItem>
                                <AccordionHeader targetId='1'>
                                    {albumChartTitle[0]}
                                </AccordionHeader>
                                <AccordionBody accordionId='1'>
                                    <Accordion flush open={albumChartOpen} toggle={albumChartToggle}>
                                        <TimeFrameMenu bWeekly={true}/>
                                    </Accordion>
                                </AccordionBody>
                            </AccordionItem>
                            <AccordionItem>
                                <AccordionHeader targetId='2'>
                                    {albumChartTitle[1]}
                                </AccordionHeader>
                                <AccordionBody accordionId='2'>
                                    <Accordion flush open={albumChartOpen} toggle={albumChartToggle}>
                                        <TimeFrameMenu bWeekly={false}/>
                                    </Accordion>
                                </AccordionBody>
                            </AccordionItem>
                            <AccordionItem>
                                <AccordionHeader targetId='3'>
                                    {albumChartTitle[2]}
                                </AccordionHeader>
                                <AccordionBody accordionId='3'>
                                    <Accordion flush open={albumChartOpen} toggle={albumChartToggle}>
                                        <TimeFrameMenu bWeekly={false}/>
                                    </Accordion>
                                </AccordionBody>
                            </AccordionItem>
                            <AccordionItem>
                                <AccordionHeader targetId='4'>
                                    {albumChartTitle[3]}
                                </AccordionHeader>
                                <AccordionBody accordionId='4'>
                                    <Accordion flush open={albumChartOpen} toggle={albumChartToggle}>
                                        <TimeFrameMenu bWeekly={false}/>
                                    </Accordion>
                                </AccordionBody>
                            </AccordionItem>
                            <AccordionItem>
                                <AccordionHeader targetId='5'>
                                    {albumChartTitle[4]}
                                </AccordionHeader>
                                <AccordionBody accordionId='5'>
                                    <Accordion flush open={albumChartOpen} toggle={albumChartToggle}>
                                        <TimeFrameMenu bWeekly={false}/>
                                    </Accordion>
                                </AccordionBody>
                            </AccordionItem>
                        </Accordion>
                    </AccordionBody>
                </AccordionItem>
            </Accordion>
                // <AccordionItem>
                //     <AccordionHeader targetId={String(index)}>
                //         {curChart.ChartTitle}
                //     </AccordionHeader>
                //     <AccordionBody accordionId={String(index++)}>
                //         Lorem ipsum dolor sit amet, consectetur adipiscing elit, 
                //         sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                //     </AccordionBody>
                // </AccordionItem>
            )
        // }, {})

    // }
}

export default ChartMenu;
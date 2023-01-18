import { Container, Row, Col, Card, CardHeader, CardBody } from "reactstrap";

const AboutPage = () => {
    return (
        <Container fluid>
            <Row className="justify-content-md-center">
                <Col>
                    <section className='mh-background' data-urltype='AboutPage'>
                        <Container>
                            <Row>
                                <Col>
                                    <Card id='about-card'>
                                        <CardHeader>
                                            <h1 id="about-title">
                                                About Music Historeum
                                            </h1>
                                        </CardHeader>
                                        <CardBody>
                                            <p id="about-content">
                                                Ever since I was a child, I have been a big fan of music.  In the early ‘80s, I started listening
                                                to Casey Kasem’s American Top 40 as often as I could.  As a teenager, I would ride my bike into town 
                                                just so I could go to the local record store and look at the Billboard Hot 100 Singles chart and 
                                                handwrite the information into a notebook.  For a while I even created my own Top 40 charts based 
                                                on my personal listening preferences.
                                            <br/>
                                            <br/>
                                                Fast-forward a few decades and the music landscape has changed greatly.  We have gone from records 
                                                to cassettes, CDs to MP3s, and now the abundance of streaming music options. We have gone from 
                                                over-the-air radio transmissions to satellite radio and internet-based radio stations and streaming 
                                                services. What has not changed is peoples’ appetite for listening to music spanning the eras of the 
                                                music recording industry.
                                            <br/>
                                            <br/>
                                                The inital idea for this website was to create a space where music chart data could be found in one 
                                                central location.  That idea has since morphed into an idea to create a virtual encyclopedia of music, 
                                                or as I call it, a Music Historeum.  It's a much loftier goal than what I started with, but it's 
                                                something that I would like and I think many others would as well.
                                            <br/>
                                            <br/>    
                                                The initial launch of this site includes chart information of songs dating back to the late '50s. 
                                                Music from various genres is included.  The Top Songs and Top Albums charts include information from 
                                                the Billboard Hot 100 singles chart and the Billboard 200 albums chart.  All other monthly, yearly, 
                                                and decade charts are created using a custom tabulation method that I created.
                                            <br/>
                                            <br/>
                                                I have many more ideas that I would like to add to the site over time.  Go check out the Future 
                                                Features section of the site to find out more about those.  And if you have any ideas for things 
                                                to include, please click on the Contact Form link in the top right and let me know.
                                            </p>
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>
                        </Container>
                    </section>
                </Col>
            </Row>
        </Container>
    );
};

export default AboutPage;
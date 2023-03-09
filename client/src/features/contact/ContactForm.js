import { useState} from 'react';
import { Button, Modal, ModalHeader, ModalBody, FormGroup, Label } from 'reactstrap';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import validateContactForm from '../../utils/validateContactForm';
import fetchContactForm from '../../services/fetchContactForm';
import '../../App.css';

const ContactForm = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const FormTopics = ['Default','Chart Question', 'Feature Request', 'Other' ];

    const handleSubmit = (values) => {
        const comment = {
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            topic: FormTopics[values.topic],
            text: values.commentText,
            date: new Date(Date.now()).toISOString()
        };
        console.log("comment: ", comment);
        fetchContactForm(comment);
        setModalOpen(false);
    };

    return (
        <>
            <span className='navbar-text ml-auto'>
                <a href style={{ textDecoration: 'none' }} onClick={() => setModalOpen(true)}
                >
                    <i className='fa fa-comment' /> Contact
                </a>
            </span>
            <Modal isOpen={modalOpen} className='modalStyle'>
                <ModalHeader toggle={() => setModalOpen(false)}>
                    Contact Us
                </ModalHeader>
                <ModalBody>
                    <Formik 
                        initialValues={
                            {
                                firstName: '',
                                lastName: '',
                                email: '',
                                topic: 0,
                                commentText: ''
                            }
                        }
                        onSubmit={handleSubmit}
                        validate={validateContactForm}
                        >
                        <Form>
                            <FormGroup>
                                <Label htmlFor='firstName'>First Name</Label>
                                <Field
                                    name='firstName'
                                    placeholder='First Name'
                                    className='form-control'
                                />
                                <ErrorMessage name='firstName'>
                                    {(msg) => <p className='text-danger'>{msg}</p>} 
                                </ErrorMessage>
                                <Label htmlFor='lastName'>Last Name</Label>
                                <Field
                                    name='lastName'
                                    placeholder='Last Name'
                                    className='form-control'
                                />
                                <ErrorMessage name='lastName'>
                                    {(msg) => <p className='text-danger'>{msg}</p>} 
                                </ErrorMessage>          
                            </FormGroup>
                            <FormGroup>
                                <Label htmlFor='email'>Email</Label>
                                <Field
                                    name='email'
                                    placeholder='Email'
                                    className='form-control'
                                />
                                <ErrorMessage name='email'>
                                    {(msg) => <p className='text-danger'>{msg}</p>}
                                </ErrorMessage>
                            </FormGroup>    
                            <FormGroup>
                                <Label htmlFor='topic' style={{ paddingRight:10 }}>Topic</Label>
                                <Field as='select' name='topic'>
                                    <option value='0'>Choose...</option>
                                    <option value='1'>Chart Question</option>
                                    <option value='2'>Feature Request</option>
                                    <option value='3'>Other</option>
                                </Field>
                            </FormGroup>                     
                            <FormGroup>
                                <Label htmlFor='commentText'>Comment</Label>
                                <Field
                                    name='commentText'
                                    as='textarea'
                                    rows='12'
                                    className='form-control'
                                />
                                <ErrorMessage name='commentText'>
                                    {(msg) => <p className='text-danger'>{msg}</p>} 
                                </ErrorMessage>         
                            </FormGroup>

                            <Button type='submit' style={{backgroundColor:"#483d8b", color:"white", margin: "5%", boxShadow: "3px 3px 1px rgba(46, 46, 46, 0.62)"}}>
                                Submit
                            </Button>
                        </Form>
                    </Formik>
                </ModalBody>
            </Modal>
        </>
    );
};

export default ContactForm;
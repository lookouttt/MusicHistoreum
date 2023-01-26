import { useState} from 'react';
// import { useDispatch } from 'react-redux';
import { Button, Modal, ModalHeader, ModalBody, FormGroup, Label } from 'reactstrap';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import validateContactForm from '../../utils/validateContactForm';
// import { postComment } from './commentsSlice';


const ContactForm = () => {
    const [modalOpen, setModalOpen] = useState(false);

    // const dispatch = useDispatch();

    const handleSubmit = (values) => {
        const comment = {
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            topic: values.topic,
            text: values.commentText,
            date: new Date(Date.now()).toISOString()
        };
        console.log("comment: ", comment);
        // dispatch(postComment(comment));
        setModalOpen(false);
    };

    return (
        <>
            <span className='navbar-text ml-auto'>
                <a href='#' style={{ textDecoration: 'none' }} onClick={() => setModalOpen(true)}
                >
                    <i className='fa fa-comment' /> Contact
                </a>
            </span>
            <Modal isOpen={modalOpen}>
                <ModalHeader toggle={() => setModalOpen(false)}>
                    Add Comment
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
                                <Label htmlFor='topic'>Topic</Label>
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

                            <Button type='submit' color='primary'>
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
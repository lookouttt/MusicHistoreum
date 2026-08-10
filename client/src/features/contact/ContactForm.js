import { useState} from 'react';
import { Button, Modal, ModalHeader, ModalBody, FormGroup, Label } from 'reactstrap';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import validateContactForm from '../../utils/validateContactForm';
import fetchContactForm from '../../services/fetchContactForm';
import Icon from '../../components/Icon';
import '../../App.css';

const ContactForm = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const [submitError, setSubmitError] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const FormTopics = ['Default','Chart Question', 'Feature Request', 'Other' ];

    const handleSubmit = async (values, { setSubmitting, resetForm }) => {
        const comment = {
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            topic: FormTopics[values.topic],
            text: values.commentText,
            date: new Date(Date.now()).toISOString()
        };
        try {
            await fetchContactForm(comment);
            setSubmitError(false);
            setSubmitSuccess(true);
            resetForm();
        } catch (err) {
            setSubmitError(true);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <span className='navbar-text ml-auto'>
                <button
                    type='button'
                    className='nav-link'
                    style={{ textDecoration: 'none', background: 'none', border: 'none', padding: 0, color: 'inherit' }}
                    onClick={() => { setSubmitError(false); setSubmitSuccess(false); setModalOpen(true); }}
                >
                    <Icon name='comment' /> Contact
                </button>
            </span>
            <Modal isOpen={modalOpen} className='modalStyle'>
                <ModalHeader toggle={() => setModalOpen(false)}>
                    Contact Us
                </ModalHeader>
                <ModalBody>
                    {submitSuccess ? (
                        <>
                            <p role='status' aria-live='polite'>Thanks! Your message has been sent.</p>
                            <Button onClick={() => setModalOpen(false)}>Close</Button>
                        </>
                    ) : (
                    <>
                    {submitError && <p className='text-danger' role='alert' aria-live='assertive'>Sorry, your message couldn't be sent. Please try again.</p>}
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
                        {({ isSubmitting }) => (
                        <Form>
                            <FormGroup>
                                <Label htmlFor='firstName'>First Name <span className='text-danger'>*</span></Label>
                                <Field
                                    name='firstName'
                                    placeholder='First Name'
                                    className='form-control'
                                />
                                <ErrorMessage name='firstName'>
                                    {(msg) => <p className='text-danger'>{msg}</p>}
                                </ErrorMessage>
                                <Label htmlFor='lastName'>Last Name <span className='text-danger'>*</span></Label>
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
                                <Label htmlFor='email'>Email <span className='text-danger'>*</span></Label>
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
                                <Label htmlFor='commentText'>Comment <span className='text-danger'>*</span></Label>
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

                            <Button
                                type='submit'
                                disabled={isSubmitting}
                                style={{backgroundColor:"#483d8b", color:"white", margin: "5%", boxShadow: "3px 3px 1px rgba(46, 46, 46, 0.62)"}}
                            >
                                {isSubmitting ? 'Sending…' : 'Submit'}
                            </Button>
                        </Form>
                        )}
                    </Formik>
                    </>
                    )}
                </ModalBody>
            </Modal>
        </>
    );
};

export default ContactForm;
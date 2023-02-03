async function fetchContactForm(formData) {
    const response = await fetch(`http://localhost:5000/contact`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    }).then((res) => {
        console.log('Response received: ', res);
        if (res.status === 200) {
            console.log('Response succeeded');
        }
    });
}

export default fetchContactForm;
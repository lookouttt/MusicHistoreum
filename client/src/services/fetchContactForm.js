import { baseUrl } from "./baseUrl";

async function fetchContactForm(formData) {
    const response = await fetch(`${baseUrl}/contact`, {
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

    return response;
}

export default fetchContactForm;
document.addEventListener('DOMContentLoaded', function () {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);

    // By default, load the inbox
    load_mailbox('inbox');

    // Submit the form
    document.querySelector('#compose-form').addEventListener('submit', send_email);
});

function compose_email() {

    // Show compose view and hide other views
    document.querySelector('#email_details').style.display = 'none';
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {

    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email_details').style.display = 'none';

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    // Show Emails in the mailbox
    fetch(`/emails/${mailbox}`)
        .then(response => response.json())
        .then(emails => {
            // Print emails
            console.log(emails);

            emails.forEach(email => {
                let email_box = document.createElement('div');
                email_box.className = "col border d-flex justify-content-between p-2 m-1";
                email_box.style.cursor = 'pointer';
                email_box.onmouseover = function () {
                    this.style.boxShadow = '#3c40433f 0px 2px 6px 2px';
                };
                email_box.onmouseleave = function () {
                    this.style.boxShadow = 'none';
                };

                // Change the background if the email has been read
                if (email.read === true) {
                    email_box.style.backgroundColor = '#F5F5F5';
                } else {
                    email_box.style.backgroundColor = '#FFF';
                }

                let email_sender = document.createElement('span');
                let email_subject = document.createElement('span');
                let email_timestamp = document.createElement('small');

                email_sender.innerHTML = email.sender;
                email_subject.innerHTML = email.subject;
                email_timestamp.innerHTML = email.timestamp;

                email_box.appendChild(email_sender);
                email_box.appendChild(email_subject);
                email_box.appendChild(email_timestamp);

                // make the font weight bold for new emails
                if (email.read === false) {
                    email_sender.className = 'font-weight-bold';
                    email_subject.className = 'font-weight-bold';
                    email_timestamp.className = 'font-weight-bold';
                }

                document.querySelector('#emails-view').append(email_box);

                // Show the content of the email and + make the email read.
                email_box.addEventListener('click', () => { email_details(email.id, mailbox); });
                email_box.addEventListener('click', () => { read_email(email.id); });
            });
        });

}

function email_details(email_id, mailbox) {
    // Hide the email_view section and show email details.
    document.querySelector('#emails-view').style.display = 'none';

    let email_details = document.querySelector('#email_details');
    email_details.style.display = 'block';

    // Clear Out the section first
    email_details.innerHTML = "";
    // Get the email from API
    fetch(`/emails/${email_id}`)
        .then(response => response.json())
        .then(email => {
            // Print email
            console.log(email);

            // show new lines in the email after replying.
            email.body = email.body.replaceAll('\n', '<br>');

            let sender = document.createElement('span');
            let recipients = document.createElement('span');
            let subject = document.createElement('span');
            let timestamp = document.createElement('span');
            let reply = document.createElement('button');
            reply.className = 'btn btn-sm btn-outline-secondary mr-2';
            reply.innerHTML = 'Reply';
            let archive = document.createElement('button');
            archive.className = 'btn btn-sm btn-outline-danger';
            archive.innerHTML = 'Archive';
            let body = document.createElement('p');
            body.className = 'mt-4';

            sender.innerHTML = `<strong class="d-block">From: ${email.sender}</strong>`;
            recipients.innerHTML = `<strong class="d-block">To: ${email.recipients}</strong>`;
            subject.innerHTML = `<strong class="d-block">Subject: ${email.subject}</strong>`;
            timestamp.innerHTML = `<small class="d-block mb-2">${email.timestamp}</small>`;
            body.innerHTML = `${email.body}`;

            email_details.append(sender);
            email_details.append(recipients);
            email_details.append(subject);
            email_details.append(timestamp);

            // Add reply button to inbox and archived only
            if (mailbox != 'sent') {
                email_details.append(reply);
                email_details.append(archive);
                if (mailbox === 'archive') {
                    archive.className = 'btn btn-sm btn-outline-secondary';
                    archive.innerHTML = 'Unarchive';
                }
            }
            email_details.append(body);

            // Archive email
            archive.addEventListener('click', function () {
                fetch(`/emails/${email_id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        archived: !email.archived
                    })
                });
                load_mailbox('inbox');
                // Need to reload page every time to load archived/unarchived mails
                location.reload();
            });

            // Reply to an email
            reply.addEventListener('click', function () {
                // Fix new lines problem
                email.body = email.body.replaceAll('<br>', '\n');
                compose_email();
                document.querySelector('#compose-recipients').value = email.sender;
                if (email.subject.slice(0, 4) != 'RE: ') {
                    document.querySelector('#compose-subject').value = `RE: ${email.subject}`;
                } else {
                    document.querySelector('#compose-subject').value = email.subject;
                }
                document.querySelector('#compose-body').value = `\n \n >> On ${email.timestamp}, ${email.sender} wrote: \n ${email.body}`;
                
                // Focus the cursor at the beginning of textarea
                document.querySelector('#compose-body').focus()
                document.querySelector('#compose-body').setSelectionRange(0, 0)
            });
        });
}

function send_email(event) {
    // prevent page from reloading.
    event.preventDefault();
    fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
            recipients: document.querySelector('#compose-recipients').value,
            subject: document.querySelector('#compose-subject').value,
            body: document.querySelector('#compose-body').value,
            read: false
        })
    })
        .then(response => response.json())
        .then(result => {
            // Print result
            console.log(result);
            load_mailbox('sent');
        });
}

function read_email(email_id) {
    fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
    });
}

/* eslint no-console:1 */

const request = require('request');
const chalk = require('chalk');
const auth = process.env.QUALTRICS_API_TOKEN; // = require('./auth.json');

/* break at startup if missing token */
if (!auth) {
    throw new Error('Qualtrics auth token missing');
}

/***************************************************
 * Sends all API requests. Takes a requestObj &
 * a callback
 **************************************************/
function makeRequest(reqObj, cb) {
    request(reqObj, (err, response, body) => {
        if (err) {
            cb(err);
        } else if (response.statusCode !== 200) {
            cb(new Error(`Status Code: ${response.statusCode}`));
        } else if (response.headers['content-type'] != 'application/json') {
            cb(new Error(`Content Type: ${response.headers['content-type']}`));
        } else {
            cb(null, JSON.parse(body));
        }
    });
}

/**********************************************
 * Gets all contacts from the given csvFile.
 * Calls makeRequest() with paginate() as a callback.
 * Returns an array of contacts to the CB.
 ***********************************************/
function getAll(csvFile, cb, contacts = []) {
    function paginate(err, body) {
        if (err) {
            cb(err);
            return;
        }
        contacts = contacts.concat(body.result.elements);

        /* Write to only one line in the console */
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(chalk.magenta(`Contacts retrieved: ${contacts.length}`));

        /* paginate if needed */
        if (body.result.nextPage === null) {
            /* new line when we're done */
            process.stdout.write('\n');
            cb(null, contacts);
        } else {
            requestObj.url = body.result.nextPage;
            makeRequest(requestObj, paginate, contacts);
        }
    }
    
    /* initial request object */
    var requestObj = {
        method: 'GET',
        url: `https://byui.az1.qualtrics.com/API/v3/mailinglists/${csvFile.config.MailingListID}/contacts`,
        headers: {
            'x-api-token': auth.token
        }
    };
    /* make initial request */
    makeRequest(requestObj, paginate);
}

function getOne (csvFile, contact, cb) {
    var requestObj = {
        method: 'GET',
        url: `https://byui.az1.qualtrics.com/API/v3/mailinglists/${csvFile.config.MailingListID}/contacts/${contact.id}`,
        headers: {
            'x-api-token': auth.token
        }
    };

    makeRequest(requestObj, cb);
}


/*******************************
 * Add a single contact to the
 * given mailing list
 ******************************/
function addContact(csvFile, contact, cb) {
    var requestObj = {
        method: 'POST',
        url: `https://byui.az1.qualtrics.com/API/v3/mailinglists/${csvFile.config.MailingListID}/contacts`,
        body: JSON.stringify(contact),
        headers: {
            'content-type': 'application/json',
            'x-api-token': auth.token
        }
    };

    makeRequest(requestObj, cb);
}

/*******************************************
 * Update a single contact from the 
 * given mailing list
 ******************************************/
function updateContact(csvFile, contact, cb) {
    if (contact.id === undefined) {
        cb(new Error('Qualtrics ID undefined'), null);
        return;
    }

    /* make a copy of the contact to send so we don't lose the id if the call fails */
    var contactCopy = Object.assign({}, contact);

    /* pull ID off of the contact! */
    var contactId = contactCopy.id;
    delete contactCopy.id;

    var requestObj = {
        method: 'PUT',
        url: `https://byui.az1.qualtrics.com/API/v3/mailinglists/${csvFile.config.MailingListID}/contacts/${contactId}`,
        body: JSON.stringify(contactCopy),
        headers: {
            'content-type': 'application/json',
            'x-api-token': auth.token
        }
    };
    
    makeRequest(requestObj, cb);
}

/********************************************
 * Delete a single contact from the 
 * given mailing list
 ********************************************/
function deleteContact(csvFile, contact, cb) {
    /* pull ID off of the contact! */
    var requestObj = {
        method: 'DELETE',
        url: `https://byui.az1.qualtrics.com/API/v3/mailinglists/${csvFile.config.MailingListID}/contacts/${contact.id}`,
        headers: {
            'x-api-token': auth.token
        }
    };
    
    makeRequest(requestObj, cb);
}

module.exports = {
    getContacts: getAll,
    addContact: addContact,
    updateContact: updateContact,
    deleteContact: deleteContact,
    getContact: getOne,
    request: makeRequest,
};
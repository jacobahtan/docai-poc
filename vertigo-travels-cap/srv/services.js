const cds = require('@sap/cds');
const axios = require('axios');
const xsenv = require("@sap/xsenv");

var s4desturl, s4destauthtoken, s4csrftoken, s4cookies;

getDestination("VERTIGO_S4HC").then((dest) => {
    s4desturl = dest.destinationConfiguration.URL;
    s4destauthtoken = dest.authTokens[0].http_header.value;
    console.log("S4 Destination URL: " + s4desturl);
    console.log("S4 Destination Auth Token: " + s4destauthtoken);
});

module.exports = cds.service.impl(async function () {
    this.on('getBusinessPartner', async req => {
        console.log(s4desturl);
        const payloadBP = req.data.message;
        console.log("Received payload for S4 Business Partners: ", payloadBP);
        const options = {
            method: 'GET',
            url: `${s4desturl}/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner`,
            headers: { 'Authorization': s4destauthtoken, 'x-csrf-token': 'fetch' }
        };

        try {
            const response = await axios.request(options);
            // console.log(response);
            console.log(response.headers['x-csrf-token']);
            console.log(response.data);
            s4csrftoken = response.headers['x-csrf-token'];
            s4cookies = response.headers['set-cookie'];
            console.log(s4cookies)

            return { 'csrf': response.headers['x-csrf-token'] };
            // return response.data;
        } catch (error) {
            console.error(error);
        }
    });
    this.on('createNewBusinessPartner', async req => {

        await getS4CsrfToken();

        const payloadBP = req.data.message;
        console.log("Received payload for S4 Business Partners: ", payloadBP);

        const options = {
            method: 'POST',
            url: `${s4desturl}/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner`,
            headers: {
                'x-csrf-token': s4csrftoken,
                authorization: s4destauthtoken,
                'content-type': 'application/json',
                'Cookie': s4cookies.join('; ')
            },
            data: {
                BusinessPartnerCategory: '1',
                BusinessPartnerFullName: `${payloadBP.firstName} ${payloadBP.lastName}`,
                FirstName: payloadBP.firstName,
                LastName: payloadBP.lastName,
            }
        };

        try {
            const { data } = await axios.request(options);
            console.log(data);
            return data.d;
        } catch (error) {
            console.error(error);
        }
    });
});

async function getS4CsrfToken() {
    const options1 = {
        method: 'GET',
        url: `${s4desturl}/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner`,
        headers: { 'Authorization': s4destauthtoken, 'x-csrf-token': 'fetch' }
    };

    try {
        const response = await axios.request(options1);
        // console.log(response);
        console.log(response.headers['x-csrf-token']);
        console.log(response.data);
        s4csrftoken = response.headers['x-csrf-token'];
        s4cookies = response.headers['set-cookie'];
        console.log(s4cookies)

        return { 'csrf': response.headers['x-csrf-token'] };
        // return response.data;
    } catch (error) {
        console.error(error);
    }
}

/** Default Helper function to auth your app getting connected with SAP BTP Destination services and return Destination object. */
async function getDestination(dest) {
    try {
        xsenv.loadEnv();
        let services = xsenv.getServices({
            dest: { tag: "destination" },
        });
        try {
            let options1 = {
                method: "POST",
                url: services.dest.url + "/oauth/token?grant_type=client_credentials",
                headers: {
                    Authorization:
                        "Basic " +
                        Buffer.from(
                            services.dest.clientid + ":" + services.dest.clientsecret
                        ).toString("base64"),
                },
            };
            let res1 = await axios(options1);
            try {
                let options2 = {
                    method: "GET",
                    url:
                        services.dest.uri +
                        "/destination-configuration/v1/destinations/" +
                        dest,
                    headers: {
                        Authorization: "Bearer " + res1.data.access_token,
                    },
                };
                let res2 = await axios(options2);
                // return res2.data.destinationConfiguration;
                return res2.data;
            } catch (err) {
                console.log(err.stack);
                return err.message;
            }
        } catch (err) {
            console.log(err.stack);
            return err.message;
        }
    } catch (err) {
        console.log(err.stack);
        return err.message;
    }
}
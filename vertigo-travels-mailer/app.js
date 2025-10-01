// Load environment variables from the .env file
require('dotenv').config();
const axios = require('axios');

// --- Load Configuration from .env ---
const {
    SYNC_INTERVAL_SECONDS,
    SUBMITTED_DOCS_API_HOST,
    XSUAA_AUTH_ENDPOINT,
    XSUAA_AUTH_CID,
    XSUAA_AUTH_CSECRET,
    DOC_AI_API_HOST,
    DOCAI_EMB_TOKEN_URL,
    DOCAI_EMB_TOKEN_USER,
    DOCAI_EMB_TOKEN_PASSWORD
} = process.env;

const SYNC_INTERVAL = SYNC_INTERVAL_SECONDS * 1000;

/**
 * Fetches the access token for the Submitted Documents API (XSUAA).
 * @returns {Promise<string>} The access token.
 */
async function getSubmittedDocsAccessToken() {
    try {
        const url = `${XSUAA_AUTH_ENDPOINT}/oauth/token`;
        const body = new URLSearchParams({
            client_id: XSUAA_AUTH_CID,
            client_secret: XSUAA_AUTH_CSECRET,
            grant_type: 'client_credentials'
        });

        const response = await axios.post(url, body);
        console.log("Successfully fetched access token for Submitted Docs API.");
        return response.data.access_token;
    } catch (error) {
        console.error("❌ Failed to get access token for Submitted Docs API:");
        if (error.response) {
            console.error("   - Status:", error.response.status);
            console.error("   - Data:", error.response.data);
        } else {
            console.error("   - Error:", error.message);
        }
        throw new Error("Could not authenticate with Submitted Docs API.");
    }
}

/**
 * Fetches the access token for the Document AI API.
 * @returns {Promise<string>} The access token.
 */
async function getDocAiAccessToken() {
    try {
        // Create Basic Authentication credentials
        const credentials = Buffer.from(`${DOCAI_EMB_TOKEN_USER}:${DOCAI_EMB_TOKEN_PASSWORD}`).toString('base64');

        const response = await axios.post(DOCAI_EMB_TOKEN_URL, null, { // No body needed for this grant type
            headers: {
                'Authorization': `Basic ${credentials}`
            }
        });

        console.log("Successfully fetched access token for Document AI API.");
        return response.data.access_token;
    } catch (error) {
        console.error("❌ Failed to get access token for Document AI API:");
        if (error.response) {
            console.error("   - Status:", error.response.status);
            console.error("   - Data:", error.response.data);
        } else {
            console.error("   - Error:", error.message);
        }
        throw new Error("Could not authenticate with Document AI API.");
    }
}


/**
 * The main function to sync document statuses.
 */
async function syncDocumentStatuses() {
    console.log(`[${new Date().toISOString()}] Starting document status sync...`);

    try {
        // --- Step 1: Authenticate and get tokens for both services ---
        const submittedDocsToken = await getSubmittedDocsAccessToken();
        const docAiToken = await getDocAiAccessToken();

        // --- Step 2: Fetch documents from your SubmittedDocuments service ---
        const submittedDocsResponse = await axios.get(`${SUBMITTED_DOCS_API_HOST}/admin/SubmittedDocuments`, {
            headers: { 'Authorization': `Bearer ${submittedDocsToken}` }
        });
        const submittedDocs = submittedDocsResponse.data.value;

        if (!submittedDocs || submittedDocs.length === 0) {
            console.log("No submitted documents found. Waiting for the next run.");
            return;
        }
        console.log(`Found ${submittedDocs.length} submitted document(s) to check.`);

        // --- Step 3: Fetch documents from Document AI ---
        const docAiResponse = await axios.get(`${DOC_AI_API_HOST}/document-ai/v1/DocumentService/Documents`, {
            headers: { 'Authorization': `Bearer ${docAiToken}` }
        });
        const docAiDocs = docAiResponse.data.value;

        // Create a Map for efficient lookups (O(1) average time complexity)
        const docAiMap = new Map(docAiDocs.map(doc => [doc.file_ID, doc]));
        console.log(`Found ${docAiMap.size} document(s) in Document AI.`);

        // --- Step 4: Compare and patch statuses ---
        for (const submittedDoc of submittedDocs) {
            const docAiDoc = docAiMap.get(submittedDoc.documentID);

            if (!docAiDoc) {
                console.log(`- Skipping: Document with ID ${submittedDoc.documentID} not found in Doc AI.`);
                continue;
            }

            const docAiStatus = docAiDoc.status;
            const statusesToSync = ['confirmed', 'rejected'];

            if (statusesToSync.includes(docAiStatus.toLowerCase()) && submittedDoc.status !== docAiStatus) {
                console.log(`- Updating status for document ${submittedDoc.ID} from '${submittedDoc.status}' to '${docAiStatus}'.`);

                await axios.patch(`${SUBMITTED_DOCS_API_HOST}/admin/SubmittedDocuments/${submittedDoc.ID}`,
                    { status: docAiStatus },
                    { headers: { 'Authorization': `Bearer ${submittedDocsToken}` } }
                );
                console.log(`  ✅ Successfully updated status for document ${submittedDoc.ID}.`);
            } else {
                console.log(`- Skipping document ${submittedDoc.documentID}: Status is '${docAiStatus}' (already synced or not ready for sync).`);
            }
        }
    } catch (error) {
        // Errors from token fetching are already logged. This will catch other errors.
        if (error.config) { // It's likely an axios error
            console.error(`❌ An error occurred during an API call to ${error.config.url}`);
        } else {
            console.error("❌ An unexpected error occurred during the sync process:", error.message);
        }
    } finally {
        console.log(`[${new Date().toISOString()}] Sync process finished. Next run in ${SYNC_INTERVAL_SECONDS} seconds.`);
        console.log('---');
    }
}

/**
 * Validates that all required environment variables are set.
 */
function validateEnvVariables() {
    const requiredVars = [
        'SYNC_INTERVAL_SECONDS', 'SUBMITTED_DOCS_API_HOST', 'XSUAA_AUTH_ENDPOINT',
        'XSUAA_AUTH_CID', 'XSUAA_AUTH_CSECRET', 'DOC_AI_API_HOST', 'DOCAI_EMB_TOKEN_URL',
        'DOCAI_EMB_TOKEN_USER', 'DOCAI_EMB_TOKEN_PASSWORD'
    ];
    const missingVars = requiredVars.filter(v => !process.env[v]);
    if (missingVars.length > 0) {
        throw new Error(`❌ Critical Error: Missing required environment variables: ${missingVars.join(', ')}`);
    }
}

/**
 * Starts the application and sets the timer.
 */
function startService() {
    try {
        validateEnvVariables();
        console.log("🚀 Document Sync Service is starting.");
        console.log(`Sync interval set to ${SYNC_INTERVAL_SECONDS} seconds.`);
        console.log('---');

        syncDocumentStatuses(); // Run immediately on start
        setInterval(syncDocumentStatuses, SYNC_INTERVAL); // Then run on the interval
    } catch (error) {
        console.error(error.message);
        console.error("Service will not start. Please fix the configuration in your .env file.");
    }
}

// Start the service
startService();

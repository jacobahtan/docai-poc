// script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Application State ---
    const state = {
        currentView: 'coursesCatalog',
        selectedCourse: null,
        courses: [],
        subscriptions: [],
        travelers: [],
        adminCourses: [],
        isAuthenticated: false,
        accessToken: null,
        selectedTravelerId: null,
        xsuaaTokenEndpoint: null,
        backendCDSCAPEndpoint: null,
        s4Endpoint: null
    };

    // --- DOM Element References ---
    const appContainer = document.getElementById('app-container');
    const travelerSelect = document.getElementById('traveler-select');
    const navCoursesBtn = document.getElementById('nav-courses-btn');
    const navSubscriptionsBtn = document.getElementById('nav-subscriptions-btn');
    const navAdminBtn = document.getElementById('nav-admin-btn');
    const adminDropdown = document.getElementById('admin-dropdown');
    const navAdminTravelersBtn = document.getElementById('nav-admin-travelers-btn');
    const navAdminCoursesBtn = document.getElementById('nav-admin-courses-btn');

    // --- Utility Functions ---
    /**
     * Shows a custom message box.
     * @param {string} message The message to display.
     */
    function showMessage(message) {
        const messageBox = document.getElementById('message-box');
        const messageText = document.getElementById('message-text');
        const overlay = document.getElementById('global-overlay');
        const okBtn = document.getElementById('message-ok-btn');

        messageText.textContent = message;
        messageBox.classList.remove('hidden');
        overlay.classList.remove('hidden');

        okBtn.onclick = () => {
            messageBox.classList.add('hidden');
            overlay.classList.add('hidden');
        };
    }

    /**
     * Shows or hides the global loading indicator.
     * @param {boolean} show True to show, false to hide.
     */
    function toggleLoading(show) {
        const loader = document.getElementById('loading-indicator');
        const overlay = document.getElementById('global-overlay');
        if (show) {
            loader.classList.remove('hidden');
            overlay.classList.remove('hidden');
        } else {
            loader.classList.add('hidden');
            overlay.classList.add('hidden');
        }
    }

    /**
     * Converts a File object to a Base64 encoded string.
     * @param {File} file The file to convert.
     * @returns {Promise<string>} A promise that resolves with the Base64 string.
     */
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }


    // --- Mock API Service ---
    // This service simulates backend API calls. In a real application,
    // these would be actual fetch() calls to a server.
    const ApiService = {
        async getAccessToken() {
            // This would be a real fetch call to an OAuth endpoint
            console.log("Simulating token request...");
            await new Promise(resolve => setTimeout(resolve, 500));
            state.accessToken = 'mock_access_token';
            state.isAuthenticated = true;
            console.log("Token received.");
            return state.accessToken;
        },

        async getCourses() {
            console.log("API: GET /courses");
            await new Promise(resolve => setTimeout(resolve, 300));
            return mockData.courses;
        },

        async getRequiredDocuments(courseId) {
            console.log(`API: GET /courses/${courseId}/requiredDocuments`);
            await new Promise(resolve => setTimeout(resolve, 200));
            return mockData.requiredDocuments[courseId] || [];
        },
        
        async getTravelers() {
            console.log("API: GET /travelers");
            await new Promise(resolve => setTimeout(resolve, 300));
            return mockData.travelers;
        },

        async getSubscriptions() {
            console.log("API: GET /subscriptions");
            await new Promise(resolve => setTimeout(resolve, 400));
            return mockData.subscriptions;
        },
        
        async getSubmittedDocuments() {
            console.log("API: GET /submittedDocuments");
            await new Promise(resolve => setTimeout(resolve, 300));
            return mockData.documents;
        },

        async createSubscription(subscriptionData) {
            console.log("API: POST /subscriptions", subscriptionData);
            await new Promise(resolve => setTimeout(resolve, 500));
            const newSubscription = {
                ...subscriptionData,
                ID: `sub_${crypto.randomUUID()}`,
                status: 'DocsPending',
            };
            mockData.subscriptions.push(newSubscription);
            return newSubscription;
        },

        /**
         * Simulates uploading documents to the server.
         * @param {string} subscriptionId The ID of the subscription.
         * @param {Array} documentsData Array of document objects to be created.
         */
        async createSubmittedDocuments(subscriptionId, documentsData) {
            console.log(`API: POST /subscriptions/${subscriptionId}/documents`, documentsData);
            await new Promise(resolve => setTimeout(resolve, 800));
            
            documentsData.forEach(doc => {
                const newDoc = {
                    ...doc,
                    ID: `doc_${crypto.randomUUID()}`,
                    subscription_ID: subscriptionId,
                    status: 'Uploaded'
                };
                mockData.documents.push(newDoc);
            });
            console.log("Documents created:", documentsData);
            return { success: true };
        },
        
        async updateSubscriptionStatus(subscriptionId, status, s4hanaBPID = null, s4hanaSOID = null) {
            console.log(`API: PATCH /subscriptions/${subscriptionId}`, { status, s4hanaBPID, s4hanaSOID });
            // Add a longer delay to simulate a real process
            await new Promise(resolve => setTimeout(resolve, 2000)); 
            const subscription = mockData.subscriptions.find(s => s.ID === subscriptionId);
            if (subscription) {
                subscription.status = status;
                if (s4hanaBPID) subscription.s4hanaBusinessPartnerID = s4hanaBPID;
                if (s4hanaSOID) subscription.s4hanaSalesOrderID = s4hanaSOID;
                return subscription;
            }
            throw new Error("Subscription not found");
        },
    };

    // --- View Rendering Functions ---

    /**
     * Renders the main course catalog.
     */
    async function renderCoursesCatalog() {
        appContainer.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-900 mb-6">Courses Catalog</h2>
            <div id="course-list" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <p class="text-gray-500">Loading courses...</p>
            </div>
        `;
        const courseList = document.getElementById('course-list');
        try {
            const courses = await ApiService.getCourses();
            state.courses = courses; // Cache courses
            if (courses.length > 0) {
                courseList.innerHTML = courses.map(course => `
                    <div class="ui-card flex flex-col text-center">
                        <img src="https://placehold.co/600x400/e6f2ff/007bff?text=${encodeURIComponent(course.name)}" alt="${course.name}" class="w-full h-48 object-cover">
                        <div class="p-6 flex flex-col flex-grow">
                            <h3 class="text-xl font-semibold mb-2">${course.name}</h3>
                            <p class="text-gray-600 mb-4 flex-grow">${course.description}</p>
                            <span class="text-2xl font-bold text-gray-900 mb-4">$${course.price}</span>
                            <button data-course-id="${course.ID}" class="control-button-primary w-full view-course-btn mt-auto">View Details</button>
                        </div>
                    </div>
                `).join('');
            } else {
                courseList.innerHTML = '<p class="text-gray-500 text-center col-span-full">No courses available.</p>';
            }
        } catch (error) {
            console.error("Failed to load courses:", error);
            courseList.innerHTML = '<p class="text-red-500 text-center col-span-full">Could not load courses.</p>';
        }
    }

    /**
     * Renders the details for a selected course.
     */
    async function renderCourseDetail() {
        if (!state.selectedCourse) {
            renderCoursesCatalog();
            return;
        }

        let stagedDocuments = []; // Holds files staged for upload

        appContainer.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-900 mb-8">Course: ${state.selectedCourse.name}</h2>
            <div class="flex flex-col lg:flex-row lg:space-x-8">
                <!-- Left Side: Course Info -->
                <div class="w-full lg:w-1/2 ui-card p-6 mb-8 lg:mb-0">
                    <img src="https://placehold.co/600x400/e6f2ff/007bff?text=${encodeURIComponent(state.selectedCourse.name)}" alt="${state.selectedCourse.name}" class="rounded-lg mb-4 w-full h-auto object-cover">
                    <h3 class="text-2xl font-bold text-gray-900 mb-2">${state.selectedCourse.name}</h3>
                    <p class="text-gray-600 mb-4">${state.selectedCourse.description}</p>
                    <ul class="space-y-2 text-lg">
                        <li><span class="font-semibold">Price:</span> $${state.selectedCourse.price}</li>
                        <li><span class="font-semibold">Deposit:</span> $${state.selectedCourse.depositAmount}</li>
                    </ul>
                </div>

                <!-- Right Side: Subscription Form -->
                <div class="w-full lg:w-1/2 ui-card p-6">
                    <h3 class="text-2xl font-bold mb-4">Finalize Subscription</h3>
                    <div id="required-documents-section" class="mb-6">
                        <h4 class="text-xl font-semibold mb-2">Required Documents</h4>
                        <ul id="document-list" class="list-disc list-inside space-y-2 text-gray-700"></ul>
                    </div>
                    
                    <div class="space-y-4 border-t pt-6">
                        <h4 class="text-xl font-semibold mb-2">Upload Documents</h4>
                        <select id="document-type-select" class="control-input"></select>
                        <input type="file" id="document-upload" class="control-input" accept="image/*">
                        <button id="stage-document-btn" class="control-button-secondary w-full">Stage Document for Upload</button>
                    </div>

                    <div id="staged-docs-preview" class="mt-4">
                        <h5 class="font-bold">Staged Documents:</h5>
                        <ul id="staged-docs-list" class="list-disc list-inside text-sm p-4 bg-gray-50 rounded-md">
                            <li class="text-gray-500">No documents staged.</li>
                        </ul>
                    </div>

                    <button id="subscribe-btn" class="control-button-primary mt-6 w-full">Submit Subscription</button>
                </div>
            </div>
        `;

        const requiredDocs = await ApiService.getRequiredDocuments(state.selectedCourse.ID);
        const docList = document.getElementById('document-list');
        const docTypeSelect = document.getElementById('document-type-select');

        if (requiredDocs.length > 0) {
            docList.innerHTML = requiredDocs.map(doc => `<li>${doc.description}</li>`).join('');
            docTypeSelect.innerHTML = requiredDocs.map(doc => `<option value="${doc.documentType}">${doc.description}</option>`).join('');
        } else {
            docList.innerHTML = '<li>No specific documents required.</li>';
            docTypeSelect.innerHTML = '<option value="">No documents needed</option>';
            document.getElementById('stage-document-btn').disabled = true;
        }

        // Event listener for staging a document
        document.getElementById('stage-document-btn').addEventListener('click', async () => {
            const docType = docTypeSelect.value;
            const fileInput = document.getElementById('document-upload');
            if (!fileInput.files.length || !docType) {
                showMessage("Please select a document type and a file.");
                return;
            }

            const file = fileInput.files[0];
            const base64Content = await fileToBase64(file); // Convert file to Base64

            stagedDocuments.push({
                documentType: docType,
                fileName: file.name,
                mimeType: file.type,
                content: base64Content // Store the content
            });

            // Update UI
            const stagedList = document.getElementById('staged-docs-list');
            stagedList.innerHTML = stagedDocuments.map(d => `<li>${d.documentType}: ${d.fileName}</li>`).join('');
            fileInput.value = ''; // Reset file input
            showMessage("Document staged.");
        });

        // Event listener for submitting the subscription
        document.getElementById('subscribe-btn').addEventListener('click', async () => {
            if (!state.selectedTravelerId) {
                showMessage("Please select a traveler from the header dropdown.");
                return;
            }

            toggleLoading(true);
            try {
                const subscription = await ApiService.createSubscription({
                    traveler_ID: state.selectedTravelerId,
                    course_ID: state.selectedCourse.ID,
                });
                
                if (stagedDocuments.length > 0) {
                    await ApiService.createSubmittedDocuments(subscription.ID, stagedDocuments);
                }
                
                showMessage("Subscription request submitted successfully!");
                renderManageSubscriptions();
            } catch (error) {
                console.error("Subscription failed:", error);
                showMessage("Failed to create subscription. Please try again.");
            } finally {
                toggleLoading(false);
            }
        });
    }

    /**
     * Renders the "My Subscriptions" page.
     */
    async function renderManageSubscriptions() {
        appContainer.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-900 mb-8">My Subscriptions</h2>
            <div id="subscription-list" class="space-y-6">
                <p class="text-gray-500">Loading subscriptions...</p>
            </div>
        `;

        if (!state.selectedTravelerId) {
            appContainer.innerHTML = `<p class="text-red-500">Please select a traveler to view subscriptions.</p>`;
            return;
        }

        const subscriptionList = document.getElementById('subscription-list');
        const [allSubscriptions, allCourses] = await Promise.all([
            ApiService.getSubscriptions(),
            ApiService.getCourses()
        ]);
        
        const mySubscriptions = allSubscriptions.filter(s => s.traveler_ID === state.selectedTravelerId);

        if (mySubscriptions.length > 0) {
            subscriptionList.innerHTML = mySubscriptions.map(sub => {
                const course = allCourses.find(c => c.ID === sub.course_ID);
                let actionButton = '';
                if (sub.status === 'DepositPending') {
                    actionButton = `<button data-id="${sub.ID}" class="control-button-primary pay-deposit-btn mt-4">Pay Deposit ($${course.depositAmount})</button>`;
                }
                return `
                    <div class="ui-card p-6">
                        <h3 class="text-xl font-bold mb-2">${course.name}</h3>
                        <p class="text-gray-600">Status: <span class="font-semibold text-blue-600">${sub.status}</span></p>
                        ${sub.s4hanaBusinessPartnerID ? `<p class="text-gray-500 text-sm mt-1">BP ID: ${sub.s4hanaBusinessPartnerID}</p>` : ''}
                        ${actionButton}
                    </div>
                `;
            }).join('');
        } else {
            subscriptionList.innerHTML = '<p class="text-gray-500 text-center">You have no subscriptions.</p>';
        }
    }
    
    /**
     * Renders the Admin page for managing all travelers and their documents.
     */
    async function renderManageTravelers() {
        appContainer.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-900 mb-8">Manage Travelers & Subscriptions</h2>
            <div id="traveler-list-container" class="ui-card p-6">
                <p class="text-gray-500">Loading data...</p>
            </div>
        `;
        
        const container = document.getElementById('traveler-list-container');
        const [travelers, subscriptions, documents, courses] = await Promise.all([
            ApiService.getTravelers(),
            ApiService.getSubscriptions(),
            ApiService.getSubmittedDocuments(),
            ApiService.getCourses()
        ]);

        if (travelers.length > 0) {
            container.innerHTML = travelers.map(traveler => {
                const travelerSubs = subscriptions.filter(s => s.traveler_ID === traveler.ID);
                return `
                    <div class="mb-8">
                        <h3 class="text-xl font-bold border-b pb-2 mb-4">${traveler.firstName} ${traveler.lastName} (${traveler.email})</h3>
                        ${travelerSubs.length > 0 ? travelerSubs.map(sub => {
                            const course = courses.find(c => c.ID === sub.course_ID);
                            const subDocs = documents.filter(d => d.subscription_ID === sub.ID);
                            let actionButton = '';
                            if(sub.status === 'DocsPending') {
                                actionButton = `<button data-id="${sub.ID}" class="control-button-secondary text-sm py-1 px-3 approve-docs-btn">Approve Docs</button>`;
                            }
                            return `
                                <div class="bg-gray-50 p-4 rounded-lg mb-4">
                                    <div class="flex justify-between items-start">
                                        <div>
                                            <p class="font-semibold">${course.name}</p>
                                            <p class="text-sm text-gray-600">Status: ${sub.status}</p>
                                        </div>
                                        ${actionButton}
                                    </div>
                                    <div class="mt-4">
                                        <h5 class="font-semibold text-sm">Submitted Documents:</h5>
                                        ${subDocs.length > 0 ? subDocs.map(doc => `
                                            <div class="flex items-center justify-between bg-white p-2 rounded mt-2">
                                                <p class="text-sm">${doc.fileName} (${doc.documentType})</p>
                                                <button data-doc-id="${doc.ID}" class="control-button-secondary text-xs py-1 px-2 review-doc-btn">Review</button>
                                            </div>
                                        `).join('') : '<p class="text-sm text-gray-500">No documents submitted.</p>'}
                                    </div>
                                </div>
                            `;
                        }).join('') : '<p class="text-sm text-gray-500">No subscriptions for this traveler.</p>'}
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<p class="text-center text-gray-500">No travelers found.</p>';
        }
    }

    /**
    * Renders the modal for an admin to review a single document.
    * @param {string} docId The ID of the document to review.
    */
    async function renderAdminDocumentReviewModal(docId) {
        const documents = await ApiService.getSubmittedDocuments();
        const doc = documents.find(d => d.ID === docId);

        if (!doc) {
            showMessage("Document not found.");
            return;
        }

        const modal = document.getElementById('review-modal');
        const modalBody = document.getElementById('review-modal-body');
        const overlay = document.getElementById('global-overlay');

        modalBody.innerHTML = `
            <!-- Left side: Image Preview -->
            <div class="image-preview-container">
                ${doc.mimeType.startsWith('image/') ? 
                    `<img src="${doc.content}" alt="Preview of ${doc.fileName}">` : 
                    `<p class="text-gray-500">No preview available for this file type (${doc.mimeType}).</p>`
                }
            </div>
            <!-- Right side: Data -->
            <div class="space-y-3">
                <h4 class="text-lg font-bold">Document Details</h4>
                <div class="data-item">
                    <span class="data-item-label">File Name:</span>
                    <span class="data-item-value">${doc.fileName}</span>
                </div>
                <div class="data-item">
                    <span class="data-item-label">Document Type:</span>
                    <span class="data-item-value">${doc.documentType}</span>
                </div>
                <div class="data-item">
                    <span class="data-item-label">MIME Type:</span>
                    <span class="data-item-value">${doc.mimeType}</span>
                </div>
                 <div class="data-item">
                    <span class="data-item-label">Status:</span>
                    <span class="data-item-value">${doc.status}</span>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
        overlay.classList.remove('hidden');
    }


    // --- Event Listeners ---

    // Navigation
    navCoursesBtn.addEventListener('click', renderCoursesCatalog);
    navSubscriptionsBtn.addEventListener('click', renderManageSubscriptions);
    navAdminTravelersBtn.addEventListener('click', renderManageTravelers);
    navAdminCoursesBtn.addEventListener('click', () => { 
        appContainer.innerHTML = `<h2 class="text-3xl font-bold">Manage Courses</h2><p>This feature is under construction.</p>`;
    });

    // Admin Dropdown Toggle
    navAdminBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        adminDropdown.classList.toggle('show');
    });
    
    // Global click listener to hide dropdown
    window.addEventListener('click', () => {
        if (adminDropdown.classList.contains('show')) {
            adminDropdown.classList.remove('show');
        }
    });

    // Traveler selection change
    travelerSelect.addEventListener('change', (e) => {
        state.selectedTravelerId = e.target.value;
        showMessage(`Switched to traveler: ${e.target.options[e.target.selectedIndex].text}`);
        // If on the subscriptions page, refresh it
        if (appContainer.querySelector('#subscription-list')) {
            renderManageSubscriptions();
        }
    });

    // Delegated event listeners for dynamically created content
    appContainer.addEventListener('click', async (e) => {
        // View Course Details button
        if (e.target.classList.contains('view-course-btn')) {
            const courseId = e.target.dataset.courseId;
            state.selectedCourse = state.courses.find(c => c.ID === courseId);
            renderCourseDetail();
        }

        // Pay Deposit button
        if (e.target.classList.contains('pay-deposit-btn')) {
            const button = e.target;
            const subscriptionId = button.dataset.id;
            
            toggleLoading(true); // Show loader
            button.disabled = true; // Disable button
            
            try {
                // Simulate backend process
                await ApiService.updateSubscriptionStatus(
                    subscriptionId,
                    'Confirmed',
                    'BP' + Math.floor(Math.random() * 1000000),
                    'SO' + Math.floor(Math.random() * 1000000)
                );
                showMessage("Payment confirmed and subscription updated!");
                renderManageSubscriptions(); // Refresh the view
            } catch (error) {
                console.error("Payment process failed:", error);
                showMessage("An error occurred during payment. Please try again.");
                button.disabled = false;
            } finally {
                toggleLoading(false); // Hide loader regardless of outcome
            }
        }
        
        // Admin: Approve Docs button
        if (e.target.classList.contains('approve-docs-btn')) {
            const subscriptionId = e.target.dataset.id;
            toggleLoading(true);
            await ApiService.updateSubscriptionStatus(subscriptionId, 'DepositPending');
            toggleLoading(false);
            showMessage("Documents approved. Status updated to DepositPending.");
            renderManageTravelers();
        }

        // Admin: Review Document button
        if (e.target.classList.contains('review-doc-btn')) {
            const docId = e.target.dataset.docId;
            renderAdminDocumentReviewModal(docId);
        }
    });

    // Admin Review Modal Close Button
    document.getElementById('review-modal-close-btn').addEventListener('click', () => {
        document.getElementById('review-modal').classList.add('hidden');
        document.getElementById('global-overlay').classList.add('hidden');
    });

    // --- App Initialization ---
    async function initializeApp() {
        await ApiService.getAccessToken(); // Authenticate first

        const travelers = await ApiService.getTravelers();
        if (travelers.length > 0) {
            travelerSelect.innerHTML = travelers.map(t => 
                `<option value="${t.ID}">${t.firstName} ${t.lastName}</option>`
            ).join('');
            state.selectedTravelerId = travelers[0].ID; // Set default
        } else {
            travelerSelect.innerHTML = '<option>No travelers found</option>';
        }

        renderCoursesCatalog(); // Load the default view
    }

    initializeApp();
});


// --- Mock Data ---
// In a real application, this data would come from a backend server.
const mockData = {
    courses: [
        { "ID": "course_01", "name": "Sailing Level 2", "description": "Intermediate sailing, requiring prior experience and a medical certificate.", "price": "1250.00", "depositAmount": "250.00" },
        { "ID": "course_02", "name": "Diving Expedition", "description": "A week-long diving trip to the Red Sea, requiring an advanced diver license.", "price": "2500.00", "depositAmount": "500.00" },
        { "ID": "course_03", "name": "Beginner Surf Camp", "description": "A beginner surf camp for all ages, no prior experience needed.", "price": "850.00", "depositAmount": "170.00" },
    ],
    requiredDocuments: {
        "course_01": [
            { "documentType": "ID_CARD", "description": "Valid ID card or passport" },
            { "documentType": "MEDICAL_CERT", "description": "Medical certificate for activity" }
        ],
        "course_02": [
            { "documentType": "ID_CARD", "description": "Valid ID card or passport" },
            { "documentType": "DIVING_CERT_ADV", "description": "Advanced Diver License" }
        ],
        "course_03": [
            { "documentType": "ID_CARD", "description": "Valid ID card or passport" }
        ]
    },
    travelers: [
        { "ID": "traveler_01", "firstName": "Mary", "lastName": "Travels", "email": "mary.travels@example.com" },
        { "ID": "traveler_02", "firstName": "Leo", "lastName": "Ventura", "email": "leo.ventura@example.com" },
    ],
    subscriptions: [
        { "ID": "sub_01", "course_ID": "course_01", "traveler_ID": "traveler_01", "status": "DocsPending" },
        { "ID": "sub_02", "course_ID": "course_02", "traveler_ID": "traveler_01", "status": "DepositPending" },
        { "ID": "sub_03", "course_ID": "course_03", "traveler_ID": "traveler_02", "status": "Confirmed", "s4hanaBusinessPartnerID": "BP123456" }
    ],
    documents: [
        // This will be populated dynamically when files are "uploaded"
    ]
};

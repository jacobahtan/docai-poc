# Getting Started

Welcome to your new project.

It contains these folders and files, following our recommended project layout:

File or Folder | Purpose
---------|----------
`app/` | content for UI frontends goes here
`db/` | your domain models and data go here
`srv/` | your service models and code go here
`package.json` | project metadata and configuration
`readme.md` | this getting started guide


## Next Steps

- Open a new terminal and run `cds watch`
- (in VS Code simply choose _**Terminal** > Run Task > cds watch_)
- Start adding content, for example, a [db/schema.cds](db/schema.cds).


## Learn More

Learn more at https://cap.cloud.sap/docs/get-started/.

## steps so far
cds add hana,mta,xsuaa,approuter --for production
npm update --package-lock-only
cds build --production (db will be generated build with --production)
mbt build -t gen --mtar mta.tar
cf deploy gen/mta.tar


### resources
https://developers.sap.com/tutorials/cap-service-deploy.html
https://cap.cloud.sap/docs/guides/deployment/to-cf

## what's next?
cap cds to connect with external api
- s/4
- docai
- sdm

custom logic for scenarios:
- s4hana creation of bp > update value into data tables
- docai upload document > process > retrieve values

19 Aug 2025:
- removed auth from package.json
"[production]": {
        "auth": "xsuaa",
setting to none has error.
trying mocked
after some debug, i used the wrong url. should be cap-srv one to use the xsuaa auth token

cors issue.
npm install cors
srv/server.js

trying to include destinations into cap to communicate with s4
cds add destination
modify a little on the mta file..
modify package.json to include this
"VERTIGO_S4HC": {
    "kind": "rest",
    "credentials": {
        "destination": "VERTIGO_S4HC"
    }
}
work on cds
- npm install @sap/xsenv
- for the fetch csrf, forgotten about the auth.
- auth gotten from destination authToken

locally works well > connecting to destination and calling it without issues

deploy : error on reading URL
e.g. s4desturl = dest.destinationConfiguration.URL;
{"level":"error","logger":"cds","timestamp":"2025-08-21T04:11:07.608Z","msg":"❗️Uncaught Cannot read properties of undefined (reading 'URL')","stacktrace":["TypeError: Cannot read properties of undefined (reading 'URL')","at /home/vcap/app/srv/services.js:8:47","at process.processTicksAndRejections (node:internal/process/task_queues:105:5)"],"layer":"cds","component_type":"application","container_id":"10.36.135.9","component_id":"5f7d81d0-7af7-451d-b405-166f4b30eaa2","component_name":"vertigo-travels-cap-srv","component_instance":0,"source_instance":0,"organization_name":"sadevmain","organization_id":"f9aaee44-d5e3-4463-8b42-c3097cf4e2e4","space_name":"dev","space_id":"a17ba0c7-9d96-4fe6-b990-5b7dbab2d244","type":"log"}

issue should be missing passport npm..
oh no, issue is related to destination not created yet.
stucked for very long on 401 error when cap is deployed in cf.
realised because of the old destination, password was removed <removed>
so the Bearer token was wrong.
had to restart cap service and it works again.

Next steps:
- UI to call CAP service and retrieve csrf and then S4 BP creation
- DOC AI API in CAP then integrate into UI

after deployed, the xsuaa will be refreshed.
so, get the new secret from the bound xsuaa
paste into hardcoded UI first as of this stage
cf set-env vertigo-travels-ui-node-mock XSUAA_AUTH_CSECRET 342a0798-6f4f-41e2-b0fa-6d82443c5ff8$6_J1qy6yLItutxXD-mQAHq9kzR_Yu_oP2HIjzIq5G5s=
cmd above will remove $6.. for some reasons..
.env file change secret

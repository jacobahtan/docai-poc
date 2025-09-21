Simple Example to create a NPM application
https://expressjs.com/en/starter/installing.html

$ mkdir myapp
$ cd myapp

$ npm init

$ npm install express --save

Create app.js file in folder

$ node app.js

Next, prepare to deploy into Cloud Foundry
https://docs.cloudfoundry.org/cf-cli/getting-started.html
1) Login into CF
$ cf login [-a API_URL] [-u USERNAME] [-p PASSWORD] [-o ORG] [-s SPACE]

2) Push app to CF with App name parameters, make sure port is accessible
$ cf push node-helper -k 256MB -m 256MB

App is up and running

DOCAI_ENDPOINT="https://docaiwebinar.cfapps.eu12.hana.ondemand.com"
BACKEND_CDS_ENDPOINT="https://sadevmain-dev-vertigo-travels-cap-srv.cfapps.eu10.hana.ondemand.com"
XSUAA_AUTH_ENDPOINT="https://sadevmain.authentication.eu10.hana.ondemand.com"
S4HANA_ENDPOINT="https://my301481-api.s4hana.ondemand.com"



cf push vertigo-travels-ui-node-mock -k 256MB -m 256MB
cf set-env vertigo-travels-ui-node-mock DOCAI_ENDPOINT https://docaiwebinar.cfapps.eu12.hana.ondemand.com
cf set-env vertigo-travels-ui-node-mock BACKEND_CDS_ENDPOINT https://sadevmain-dev-vertigo-travels-cap-srv.cfapps.eu10.hana.ondemand.com
cf set-env vertigo-travels-ui-node-mock XSUAA_AUTH_ENDPOINT https://sadevmain.authentication.eu10.hana.ondemand.com
cf set-env vertigo-travels-ui-node-mock XSUAA_AUTH_CSECRET 4cb5abdc-5a2e-4038-86ed-04fe002a1835$k0u0pdQ3tv8Up1bszA82AMGEnXoPGN7he3QTDm34wn0=
cf set-env vertigo-travels-ui-node-mock XSUAA_AUTH_CID 'sb-vertigo-travels-cap-sadevmain-dev!t141280'
cf set-env vertigo-travels-ui-node-mock S4HANA_ENDPOINT https://my301481.s4hana.ondemand.com

27 aug: having issues with setting env via cli.
use manifest.yml
easier to manage and push as well.

8 sep: structural change to nodejs app; error follows when push to cf
 2025-09-08T19:59:27.81+0800 [HEALTH/0] ERR Timed out after 1m0s (30 attempts) waiting for startup check to succeed: failed to make TCP connection to 10.142.169.50:8080: dial tcp 10.142.169.50:8080: connect: connection refused

   2025-09-08T19:59:27.81+0800 [CELL/0] ERR Failed after 1m0.162s: startup health check never passed.
solution:
const port = process.env.PORT || 3000; // You can use 3000 as a standard fallback for local dev

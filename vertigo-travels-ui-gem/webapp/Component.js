sap.ui.define([
   "sap/ui/core/UIComponent",
   "sap/ui/model/json/JSONModel",
   "sap/ui/model/odata/v4/ODataModel",
   "sap/ui/Device"
], function (UIComponent, JSONModel, ODataModel, Device) {
   "use strict";

   return UIComponent.extend("vertigo.travels.Component", {
      metadata : {
            interfaces: ["sap.ui.core.IAsyncContentCreation"],
            manifest: "json"
      },

      init : function () {
         // call the init function of the parent
         UIComponent.prototype.init.apply(this, arguments);

         // set device model
         var oDeviceModel = new JSONModel(Device);
         oDeviceModel.setDefaultBindingMode("OneWay");
         this.setModel(oDeviceModel, "device");

         // create the views based on the url/hash
         this.getRouter().initialize();

         // OData V4 model
         var oModel = new ODataModel({
                groupId: "$direct",
                synchronizationMode: "None",
                serviceUrl: "https://sadevmain-dev-vertigo-travels-cap.cfapps.eu10.hana.ondemand.com/admin/"
            });
         this.setModel(oModel);

         var oTravelerModel = new ODataModel({
                groupId: "$direct",
                synchronizationMode: "None",
                serviceUrl: "https://sadevmain-dev-vertigo-travels-cap.cfapps.eu10.hana.ondemand.com/traveler/"
         });
         this.setModel(oTravelerModel, "traveler");
      },

      getContentDensityClass : function() {
         if (!this._sContentDensityClass) {
            if (!Device.support.touch) {
               this._sContentDensityClass = "sapUiSizeCompact";
            } else {
               this._sContentDensityClass = "sapUiSizeCozy";
            }
         }
         return this._sContentDensityClass;
      }
   });
});

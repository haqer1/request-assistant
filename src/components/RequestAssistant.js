if (!com) var com = {};
if (!com.github) com.github = {};
if (!com.github.haqer1) com.github.haqer1 = {};
if (!com.github.haqer1.app) com.github.haqer1.app = {};
if (!com.github.haqer1.logging) com.github.haqer1.logging = {};

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

// TODO: puts, i18n

/**
 * Logs to console, and optionally also dumps.
 */
com.github.haqer1.logging.Logger = function(isim, useDump, skipTimestamp) {
	var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);

	this.log = function(text) {
		var mesaj = isim;
		if (!skipTimestamp) {
			var date = new Date();
			//mesaj += " (" +date.toLocaleFormat("%Y-%m-%d %T") + ')';
			mesaj += " (" +formatDate(date)+ ')';
		}
		mesaj += ": " +text;
		consoleService.logStringMessage(mesaj);
		if (useDump)
			dump(mesaj+ '\n');
	}

	function formatDate(d) {
		function pad(n) {return n<10 ? '0'+n : n}

		return d.getFullYear()+'-'
			+ pad(d.getMonth()+1)+'-'
			+ pad(d.getDate())+' '
			+ pad(d.getHours())+':'
			+ pad(d.getMinutes())+':'
			+ pad(d.getSeconds());
	}
}

com.github.haqer1.app.PreferenceClearer = function(prefBranchName, _prefsArray) {
	var bu = this;
	var _prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
	var _prefBranch = _prefService.getBranch(prefBranchName).QueryInterface(Components.interfaces.nsIPrefBranch);
	Object.defineProperty(bu, "prefBranch", {
		value: _prefBranch,
		writable: false
	});
	Object.defineProperty(bu, "prefsArray", {value: _prefsArray, writable: false});
}

Object.defineProperty(com.github.haqer1.app.PreferenceClearer.prototype, "clearPreferences", {
		value: function() {
//			this.prefsArray.forEach(this.clearPreference);
			for (var i = 0; i < this.prefsArray.length; i++)
				this.clearPreference(this.prefsArray[i]);
		},
		writable: false
	});
Object.defineProperty(com.github.haqer1.app.PreferenceClearer.prototype, "clearPreference", {
		value: function(pref) {
			if (this.prefBranch.prefHasUserValue(pref))
				this.prefBranch.clearUserPref(pref);
		},
		writable: false
	});

com.github.haqer1.app.RequestAssistantDelegate = function(logger) {
	com.github.haqer1.app.PreferenceClearer.call(this, "browser.dom.window.dump.", ["enabled"]);

	this.observe = function(subject, topic, data) {
		if (topic == "http-on-modify-request") {
			var httpChannel = subject.QueryInterface(Components.interfaces.nsIHttpChannel);
			if (httpChannel.URI.spec == httpChannel.originalURI.spec)
				logger.log(httpChannel.URI.spec);
			else
				logger.log("2. " +httpChannel.URI.spec+ " (1. " +httpChannel.originalURI.spec+ ')');
			return;
		} else if (topic == "profile-change-teardown") {
			this.clearPreferences();
		}
	};
}

com.github.haqer1.app.RequestAssistantDelegate.prototype = Object.create(com.github.haqer1.app.PreferenceClearer.prototype, {
	logger: {
		value: new com.github.haqer1.logging.Logger("RequestAssistantDelegate", true),
		writable: false
	},
	clearPreferences: {
		value: function() {
			this.logger.log("Clearing preferences by calling parent class...");
			com.github.haqer1.app.PreferenceClearer.prototype.clearPreferences.apply(this, arguments);
			this.logger.log("Done.");
		}
	}
});
com.github.haqer1.app.RequestAssistantDelegate.prototype.constructor=com.github.haqer1.app.RequestAssistantDelegate;

/**
 * Currently, logs all HTTP requests, using Logger.
 */
com.github.haqer1.app.RequestAssistant = function() {
	const logger = new com.github.haqer1.logging.Logger("RequestAssistant", true);
	const DEBUG_ENABLED = true;
	var delegate = new com.github.haqer1.app.RequestAssistantDelegate(logger);

	this.observe = function(subject, topic, data) {
		if (topic == "profile-after-change") {
			if (DEBUG_ENABLED)	logger.log("profile-after-change...");
			var os = Components.classes["@mozilla.org/observer-service;1"]
					 .getService(Components.interfaces.nsIObserverService);
			os.addObserver(delegate, "http-on-modify-request", false);
			os.addObserver(delegate, "profile-change-teardown", false);
		} 	
	}

	this.QueryInterface = function (iid) {
		if (iid.equals(Components.interfaces.nsIObserver) ||
		    iid.equals(Components.interfaces.nsISupports))
		    return this;
		
		Components.returnCode = Components.results.NS_ERROR_NO_INTERFACE;
		return null;
	};
}

com.github.haqer1.app.RequestAssistant.prototype = {
	classID: Components.ID("{e03aca24-5f35-477f-abd3-ae69f41256de}"),
	progID: "@haqer1.github.com/request-assistant;1",
	requestAssistantName: "Request Assistant"
};

if (XPCOMUtils.generateNSGetFactory)
    var NSGetFactory = XPCOMUtils.generateNSGetFactory([com.github.haqer1.app.RequestAssistant]);
else
    var NSGetModule = XPCOMUtils.generateNSGetModule([com.github.haqer1.app.RequestAssistant]);

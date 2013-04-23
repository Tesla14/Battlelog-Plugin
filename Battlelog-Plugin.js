/*

* @autheur TopperHarley
* @version 0.1
* @date 09.04.2013
* Copyright (c) 2013, TopperHarley
* All rights reserved.


href="/bf3/fr/language/"

*/

DiceFriendsPlugin = {
  playerList : [],
	updateInterval : 60*2.5,
	huntDiceData : "http://www.furydivine.net/api/hunt-dice/active/",
	showingDiceFriends : true,
	platformIcon : {
		'pc' : 'common-game-2-1',
		'xbox' : 'common-game-2-2',
		'ps3' : 'common-game-2-4'
	},
	settings : {
		'filters' : {
			'pc' : true,
			'xbox' : false,
			'ps3' : false,
			'dice' : true,
			'dev' : true,
			'dicefriend' : true,
			'other_dogtags' : true
		}
	},
	platformTranslations : {},

	init : function()
	{
		this.platformTranslations[platforms.PC] = 'pc';
		this.platformTranslations[platforms.XBOX360] = 'xbox';
		this.platformTranslations[platforms.PS3] = 'ps3';

		// add a hook to the refresh function of the comcenter friend list to redraw the dice friend list whenever needed
		var friendListSurface = $S('comcenter-surface-friends');
		friendListSurface.oldUpdate = friendListSurface.update;
		friendListSurface.update = function(itemState, opts) { var ret = this.oldUpdate(itemState, opts); DiceFriendsPlugin.displayPlayerList(); return ret;}
		friendListSurface.oldRefresh = friendListSurface.refresh;
		friendListSurface.refresh = function() { var ret = this.oldRefresh(); DiceFriendsPlugin.displayPlayerList(); return ret;}
		
		// create a style node to append the new css style for the dogtag button
		$('head').append($('<style>').attr('type', 'text/css').text(
			'.comcenter-interact-dogtag-parent {\n\
				height: 24px;\n\
				width: 23px;\n\
				float: right;\n\
				margin-top: 6px;\n\
				display: block;\n\
			}\n\
			.comcenter-interact-dogtag-icon {\n\
				width: 14px;\n\
				height: 14px;\n\
				background: url(http://battlelog-cdn.battlefield.com/public/profile/profile-icons.png) no-repeat scroll -15px 0 transparent;\n\
				background-position: -42px -56px;\n\
				margin-top: 6px;\n\
				margin-left: 5px;\n\
				float: left;\n\
			}\n\
			body.fullwidth .comcenter-interact-dogtag-icon {\n\
				background-position: -70px -56px;\n\
			}\n\
			.comcenter-interact-dogtag-parent:hover .comcenter-interact-dogtag-icon {\n\
				background-position: -42px -56px;\n\
			}\n\
			body.fullwidth .comcenter-interact-dogtag-parent:hover .comcenter-interact-dogtag-icon {\n\
				background-position: -56px -56px;\n\
			}\n\
			.no-dice-dogtag {\n\
				display:none;\n\
			}\n\
			.only-dev-dogtag {\n\
				opacity: .4;\n\
				filter: alpha(opacity=40);\n\
			}\n\
			.comcenter-interact-empty\n\
			{\n\
				height:24px;\n\
				width:23px;\n\
				float:right;\n\
				margin-top:6px;\n\
			}\n\
			.comcenter-username .fake_a\n\
			{\n\
				white-space:nowrap;\n\
				width:132px;\n\
				text-overflow:ellipsis;\n\
				overflow:hidden;\n\
			}\n\
			.comcenter-interact-settings\n\
			{\n\
				width: 24px;\n\
				height: 24px;\n\
				display: inline-block;\n\
				position: absolute;\n\
				right: 12px;\n\
				top: -4px;\n\
				cursor: pointer;\n\
				opacity: .4;\n\
				filter: alpha(opacity=40);\n\
			}\n\
			.comcenter-interact-settings-icon\n\
			{\n\
				width: 14px;\n\
				height: 14px;\n\
				background: url(http://battlelog-cdn.battlefield.com/public/profile/profile-icons.png) no-repeat scroll -15px 0 transparent;\n\
				background-position: -28px -42px;\n\
				margin-left: 5px;\n\
				margin-top: 5px;\n\
			}\n\
			.comcenter-separator:hover .comcenter-interact-settings\n\
			{\n\
				opacity: 1;\n\
				filter: alpha(opacity=100);\n\
			}\n\
			body.fullwidth .comcenter-interact-settings:hover .comcenter-interact-settings-icon\n\
			{\n\
				background-position: -14px -42px;\n\
			}\n\
			.comcenter-interact-settings:hover .comcenter-interact-settings-icon\n\
			{\n\
				background-position: 0px -42px;\n\
			}\n\
			#popup-dicefriend-settings h2\n\
			{\n\
				font-weight: bold;\n\
				color: #8A8A8A;\n\
				text-shadow: none;\n\
				float: left;\n\
				font-size: 11px;\n\
				margin-right: 0;\n\
				margin-top: 12px;\n\
				text-align: left;\n\
				font-family: Tahoma,Arial,sans-serif;\n\
				width: 100%;\n\
				clear: both;\n\
				position: relative;\n\
				text-transform: uppercase;\n\
			}\n\
			.dicefriends-settings-column\n\
			{\n\
				width: 220px;\n\
				float: left;\n\
				padding-bottom: 10px;\n\
				padding-left: 16px;\n\
			}\n\
			.classname\n\
			{\n\
				position: absolute;\n\
				top: 200px;\n\
				left: 30px;\n\
				color: #8A8A8A;\n\
				font-size: 11px;\n\
			}\n\
			'
		));
		
		// set a timer to update the friend list periodically
		setInterval(function(){ DiceFriendsPlugin.update(); }, this.updateInterval * 1000);

		// load settings from BBLog's persistent storage
		filters = BBLog.storage('dicefriends-filters');
		if(filters)
			this.settings.filters = filters;
	},
	
	update : function()
	{
		this.playerList = [];

		this.getJSON(this.huntDiceData, function(json){
			DiceFriendsPlugin.parseHuntDiceData(json);
			DiceFriendsPlugin.displayPlayerList();
		});
	},
	
	getJSON : function(url, callback)
	{
		$.ajax({url:url, dataType:"jsonp", success:callback, jsonpCallback:"callback"});
	},

	getJSONFromBattlelog : function(url, callback)
	{
		$.ajax({url:url, dataType:"json", success:callback, headers:{'X-AjaxNavigation': 1}	});
	},

	displayPopup : function(title, contentHtml, callback)
	{
		var popupHtml = $('<div>').attr('id', 'popup-dicefriend-settings').addClass('common-popup medium common-popup-remove ui-draggable').attr('style', 'margin-left: -457px; margin-top: -169px; top: 50%; position: fixed; display: block; z-index: 1002;').append(
			$('<div>').addClass('common-popup-title-container').append(
				$('<div>').addClass('common-popup-title common-popup-handle')
					.text(title).append(
					$('<div>').addClass('common-popup-close-container').append(
						$('<div>').addClass('common-popup-close').html("&nbsp;")
					)
				)
			),
			$('<div>').addClass('common-popup-content-container').append(
				contentHtml
			),
			$('<div>').addClass('common-popup-footer-container').append(
				$('<form>').attr('id', 'popup-dicefriend-settings-form').append(
					$('<input>').attr('type', 'submit').attr('value', "Save").addClass('base-button-arrow-small')
				)
			)
		)

		popupHtml.find('form').bind('submit', function(e){
			popup.closePopup("popup-dicefriend-settings");
			if(callback)
				callback();
			return false;
		});

		popupHtml.appendTo(".base-center-popups");
		popup.centerAndShowPopup(popupHtml);
	},

	displaySettingsPopup : function()
	{
		popupHtml = $('<div>').addClass('common-popup-content')
			.append(
			//$('<h1>').addClass('bblog-title').text('Filter players'),
			$('<div>').addClass('').append(
				$('<div>').addClass('dicefriends-settings-column').append(
					$('<h2>').text("Show by platform"),
					this.displaySettingsOption("PC", 'pc'),
					this.displaySettingsOption("XBOX 360", 'xbox'),
					this.displaySettingsOption("PS3", 'ps3')
				),
				$('<div>').addClass('dicefriends-settings-column').append(
					$('<h2>').text("Show by dogtag"),
					this.displaySettingsOption("DICE dogtag", 'dice'),
					this.displaySettingsOption("Dev Team dogtag", 'dev'),
					this.displaySettingsOption("DICE Friend dogtag", 'dicefriend'),
					this.displaySettingsOption("Other dogtags", 'other')
				)
			),
			$('<p>').addClass('clear')//,
			//$('<input>').attr('type', 'button').addClass('orange bblog-button save').attr('value', "Apply and Save")
		);

		popupHtml.find('.entry').bind('click', function(e){
			$(this).find('.bblog-checkbox').toggleClass('active');
		});

		popupHtml.find('.save').bind('click', function(e){
			DiceFriendsPlugin.saveSettings(popupHtml);
			$('#bblog-modal').hide();
		});

		this.displayPopup("Dice Friends settings", popupHtml, function(){
			DiceFriendsPlugin.saveSettings(popupHtml);
		});
		//BBLog.modalWindow('Dice Friends settings', popupHtml);
	},

	displaySettingsOption : function(name, dataKey)
	{
		settingHtml = $('<div>').addClass('entry').append(			
			$('<div>').addClass('bblog-checkbox').attr('data-key', dataKey),
			$('<span>').addClass('text').text(name)
		)

		if(this.settings.filters[dataKey])
		{
			settingHtml.find('.bblog-checkbox').addClass('active');
		}

		return settingHtml;
	},

	saveSettings : function(popupHtml)
	{
		popupHtml.find('.bblog-checkbox').each(function(index, element) {
			elt = $(element);
			DiceFriendsPlugin.settings.filters[elt.attr('data-key')] = elt.hasClass('active');
		});

		BBLog.storage('dicefriends-filters', DiceFriendsPlugin.settings.filters);

		DiceFriendsPlugin.update();
	},

	displayComcenterSeparator : function(playerCount)
	{
		$('#comcenterDiceFriends').append(
			$('<li>').attr('id', 'comcenter-dicefriends-separator').addClass('comcenter-separator showing-online').append(
				$('<div>').addClass('dropdownicon'),
				$('<surf:container>').attr('id', 'comcenterDiceFriends').append(
					$('<span>').text(playerCount.toString() + " Dice En Ligne")
				),
				$('<div>').attr('id', 'comcenter-dicefriends-settings')
						  .attr('data-tooltip-position', "left")
						  .attr('data-tooltip', "Open Settings")
						  .addClass('comcenter-interact-settings').append(
					$('<div>').addClass('comcenter-interact-settings-icon')
				)
			)
		);
		
		// add the handler to open the settings   comcenter-offline-separator
		$('#comcenter-dicefriends-settings').bind('click', function (e) {
			DiceFriendsPlugin.displaySettingsPopup();
			e.stopPropagation()
		});


		// add the click handler to collapse the list
		$('#comcenter-dicefriends-separator').bind('click', function (e) {
			var bar = $('#comcenter-dicefriends-separator');
			if (bar.hasClass('showing-online')) {
				bar.removeClass('showing-online');
				$('.comcenter-dicefriend-online').addClass('comcenter-friend-hidden');
				DiceFriendsPlugin.showingDiceFriends = false;
			} else {
				bar.addClass('showing-online');
				$('.comcenter-dicefriend-online').removeClass('comcenter-friend-hidden');
				DiceFriendsPlugin.showingDiceFriends = true;
			}
			comcenter.resizeComCenter();
			comcenter.scrollableReinitialise();
		});
	},

	displayPlayer : function(player, separatorValue)
	{
		var playerContainer = $('<surf:container>').attr('id', 'comcenter-surface-friends_' + player.userId);

		playerContainer.append(
			$('<li>').attr('id', 'comcenter-' + player.userId)
					 .addClass('comcenter-friend-item comcenter-friend comcenter-friend-playing comcenter-dicefriend-online') // comcenter-friend-online
					 .attr('rel', player.userId)
					 .append(
				$('<div>').addClass('comcenter-friend-draggable-dummy'),
				$('<div>').addClass('comcenter-avatar').append(
					$('<div>').attr('rel', player.userId).addClass('base-avatar-container base-avatar-size-small').append(
						$('<div>').addClass('base-avatar-status-overlay base-avatar-status-overlay-playing').append(
							$('<img>').attr('src', player.userAvatar)
									  .attr('width', 22)
									  .attr('height', 22)
						)
					)
				),
				$('<div>').addClass('comcenter-username').append(
					$('<a>').addClass('comcenter-username-link')
							.attr('data-profile', '/bf3/user/'+ player.name +'/')
							.text(player.name),
					$('<div>').addClass('comcenter-username-serverinfo').append(
						$('<span>').addClass('comcenter-full-height common-gameicon-hori bright comcenter-game-icon')
								   .addClass(this.platformIcon[player.platform]),
						$('<span>').addClass('comcenter-small-height common-gameicon-hori comcenter-game-icon')
								   .addClass(this.platformIcon[player.platform]),
						$('<span>').addClass('common-playing-link').append(
							(player.serverGuid ?
								($('<a>').attr('title', player.serverName)
										.addClass('common-playing-link base-no-ajax comcenter-playing-link')
										.attr('href', this.makeLocalizedUrl('/servers/show/'+ player.serverGuid +'/'))
										.text(player.serverName))
							:
								($('<span>').addClass('common-playing-link base-no-ajax comcenter-playing-link fake_a').text(player.serverName))
							)
						)
					)
				),
				$('<div>').addClass('comcenter-interact-container').append(
					(player.serverGuid ?
						$('<form>').addClass('join-friend').attr('method', 'POST').attr('action', this.makeLocalizedUrl('/servers/show/'+ player.serverGuid +'/')).append(
							$('<input>').attr('type', 'hidden').attr('name', 'game').attr('value', 2),
							$('<input>').attr('type', 'hidden').attr('name', 'guid').attr('value', player.serverGuid),
							$('<div>').addClass('join-friend-submit-link comcenter-interact-playing')
									  .attr('data-tooltip-position', "left")
									  .attr('data-tooltip', "Rejoindre partie")
						)
					:
						$('<div>').addClass('join-friend-submit-link comcenter-interact-empty')
					),
					$('<a>').attr('data-tooltip-position', "left").attr('data-tooltip', "")
							.attr('href', this.makeLocalizedUrl('/soldier/' + player.name + '/dogtags/' + player.personaId + '/'))
							.addClass('comcenter-interact-dogtag-parent').append(
						$('<span>').addClass('comcenter-interact-dogtag-icon')
					)
				)
			)
		);
		
		$('#comcenterDiceFriends').append(playerContainer);
		
		this.updateDogtagDisplay(player);
	},

	displayPlayerList : function()
	{
		// check if container used to add our players exists
		var diceFriendsContainer = $('#comcenterDiceFriends');
		if(diceFriendsContainer.length > 0)
		{
			// if yes, clear it
			diceFriendsContainer.empty();
		}
		else
		{
			// if no, create it
			$('#comcenter-surface-friends .comcenter-add-friend').before(
				$('<surf:container>').attr('id', 'comcenterDiceFriends')
			);
		}
	
		// create the separator
		this.displayComcenterSeparator(this.playerList.length);
		
		// display each player
		for(var i in this.playerList)
		{
			var player = this.playerList[i];
			this.displayPlayer(player);
		}
		
		// collapse the dice friend list if it was previously collapsed
		if(!this.showingDiceFriends)
		{
			$('#comcenter-dicefriends-separator').removeClass('showing-online');
			$('.comcenter-dicefriend-online').addClass('comcenter-friend-hidden');
		}
		
		// ask battlelog to resize the comcenter
		comcenter.resizeComCenter();
		comcenter.scrollableReinitialise();
		
		
		/*
		Disabled, this element is rendered by battlelog after my hook has been called, overwriting my modifications
		
		// add playing dice friend count to the friend count in the taskbar of compact com center
		var a = $('.comcenter-button-info');
		a.text(a.text() + " - " + this.playerList.length.toString() + " dice");
		*/
	},


	updateDogtagDisplay : function(player)
	{
		var dogtagDiv = $('#comcenter-' + player.userId + ' .comcenter-interact-dogtag-parent');
	
		if(player.hasDogtag.dicefriend)
		{
			dogtagDiv.attr('data-tooltip', "Dogtag Dice Friend");
			dogtagDiv.removeClass('no-dice-dogtag');
			dogtagDiv.removeClass('only-dev-dogtag');
		}
		else
		{
			if(player.hasDogtag.dice)
			{
				if(player.hasDogtag.dev)
				{
					dogtagDiv.attr('data-tooltip', "Dogtag Dice & Dev");
					dogtagDiv.removeClass('no-dice-dogtag');
					dogtagDiv.removeClass('only-dev-dogtag');
				}
				else
				{
					dogtagDiv.attr('data-tooltip', "Dogtag Dice");
					dogtagDiv.removeClass('no-dice-dogtag');
					dogtagDiv.removeClass('only-dev-dogtag');
				}
			}
			else
			{
				if(player.hasDogtag.dev)
				{
					dogtagDiv.attr('data-tooltip', "Dogtag Dev");
					dogtagDiv.removeClass('no-dice-dogtag');
					dogtagDiv.addClass('only-dev-dogtag');
				}
				else
				{
					dogtagDiv.attr('data-tooltip', "No Dice Dogtags");
					dogtagDiv.addClass('no-dice-dogtag');
					dogtagDiv.removeClass('only-dev-dogtag');
				}
			}
		}
	},


	parseHuntDiceData : function(json)
	{
		var members = json

		for(var i in members)
		{
			var member = members[i];
			var user = member.player;

			// if player is member of the platoon (not only invited) and in a PC game
			if(user.onlineStatus.isPlaying)
			{
				var player =
				{
					name : user.profile.playerName,
					userId : user.profile.playerId,
					personaId : user.profile.personaId,
					userAvatar : user.profile.playerImage,
					serverGuid : user.onlineStatus.serverGUID,
					serverName : user.onlineStatus.serverName,
					platform : user.profile.namespace,
					hasDogtag : {
						dice : user.dogTags.left.nameSID == "BF3_ID_DT_N_DTB090_CAMPAIGN",
						dev : user.dogTags.right.nameSID == "BF3_ID_DT_N_DTA_DICE",
						dicefriend : user.dogTags.right.nameSID == 'BF3_ID_DT_COMMUNITY_N_DOGTAG'
					}
				}
				
				player.hasDogtag.other = !(player.hasDogtag.dice || player.hasDogtag.dev || player.hasDogtag.dicefriend)
				
				if(!this.filterPlayer(player))
					continue;

				this.playerList.push(player);
			}
		}
	},
	
	// filters player according to settings. true = display player
	filterPlayer : function(player)
	{
		filterForDogtags = false;
		for(dogtag in player.hasDogtag)
		{
			hasDogtag = player.hasDogtag[dogtag];
			filterdogtag = this.settings.filters[dogtag];

			// if a player has a dogtag that is to be displayed
			if(hasDogtag && filterdogtag)
				filterForDogtags = true;
		}

		filterForPlatform = this.settings.filters[player.platform]
		return filterForDogtags && filterForPlatform
	},

	makeLocalizedUrl : function(path)
	{
		var url = "";
		if(Surface.urlContext._language != null && Surface.urlContext._language != 'en')
			url = '/bf3/' + Surface.urlContext._language + path;
		else
			url = '/bf3' + path;
		return url;
	},
	
	makeCallbackWithParam  : function(f, p)
	{
		var self = this;
		return function(json) {
			f.call(self, json, p);
		}
	}
}

$(document).ready(function() {
	DiceFriendsPlugin.init();
	DiceFriendsPlugin.update();
})




/**
 * Assignment Info - simple plugin for better battlelog.
 * It puts up assignment names as small headers on top of assignment images
 * in the assignment pages allowing the user to ctrl+f through them.
 *
 * @author Sami "NLG" Kurvinen
 * @version 0.1
 */

// initialize your plugin
BBLog.handle("add.plugin", {

    /**
    * The unique, lowercase id of my plugin
    * Allowed chars: 0-9, a-z, -
    */
    id : "assignmentinfo",

    /**
    * The name of my plugin, used to show config values in bblog options
    * Could also be translated with the translation key "plugin.name" (optional)
    *
    * @type String
    */
    name : "Assignment Info",

    /**
    * Some translations for this plugins
    * For every config flag must exist a corresponding EN translation
    *   otherwise the plugin will no be loaded
    *
    * @type Object
    */
    translations : {
        "en" : {
            // 'useStorage': 'Use caching and storage?',
            // 'Clear': 'Press to clear assignment storage'
        },
    },

    configFlags : [

     //    /**
     //     * Use storage means that it will store assignment data to storage 
     //     */
     //    ['useStorage', 0],
     //    *
     //     * Clear configflag makes a button to the plugin configs that will
     //     * clear the storage (cache) of assignment info and force refetching them
         
    	// ["Clear", 0, function(instance){
    	//     instance.clearAssignmentStorage(instance);
    	// }],
    ],

    /**
    * Run on every refresh, but just once. 
    */
    init : function(instance){
        // some log to the console to show you how the things work
        console.log('AssignmentInfo plugin loaded');
    },

    /**
    * A trigger that fires everytime when the dom is changing
    * This is how BBLog track Battlelog for any change, like url, content or anything
    *
    * @param object instance The instance of your plugin which is the whole plugin object
    *    Always use "instance" to access any plugin related function, not use "this" because it's not working properly
    *    For example: If you add a new function to your addon, always pass the "instance" object
    */
    domchange : function(instance){

    	$assignmentsContainer = $('.assignments-container');
    	$loadedIndicator = $('<span class="assignmentInfoLoaded"></span>');
    	loadedIndicatorFound = $assignmentsContainer.find('.assignmentInfoLoaded').length;
        $progressBars = $assignmentsContainer.find('.progress_bar');

    	/**
    	 * Make sure we are in the assignments page
    	 */
    	if ( $assignmentsContainer.length > 0 && loadedIndicatorFound == 0 && $progressBars.length > 0) {

            /**
             * Put up a dom element that we can search, and indicate if we have actually gone
             * through the assignment process and it has not been resetted.
             */
    		$assignmentsContainer.prepend($loadedIndicator);

            /**
             * Get your assignments. In this case we dont really use other than the assignment names
             */
    		name = instance.getTargetName( instance );
    		assignments = instance.getAssignments( instance, name );

            console.log(assignments);
            unfinishedAssignments = instance.getUnfinishedAssignments( instance, assignments );

            /**
             * Upcoming unlocks HTML copy
             */
            $UAtemplate = $('<div id="profile-stats-awards-upcoming" class="profile-stats-type-container"><h1> Upcoming Unlocks </h1><div class="profile-stats-type-container-filters"></div><surf:container id="unlocks"><table cellpadding="0" cellspacing="0" class="leaderboard-venice-specific" id="profile-stats-awards-upcoming-table"><thead><tr><th class="profile-stats-venice-awards-head-completion"> Completion </th><th class="profile-stats-venice-awards-head-award"></th></tr></thead><tbody><tr class="leaderboard-venice-specific-row first filterByKit filterByKit_8"><td class="leaderboard-venice-specific-cell"><div class="profile-stats-venice-awards-body-completion"><div class="profile-stats-venice-awards-body-completion-meter-wrapper"><div class="profile-stats-venice-awards-body-completion-meter" style="width: 99%;"></div></div><span class="profile-stats-venice-awards-body-completion-value"><span class="common-sorting-value"> 99 </span> % </span></div><div class="profile-stats-venice-awards-body-separator"></div></td><td class="leaderboard-venice-specific-cell"><div class="profile-stats-venice-awards-body-award"><table cellspacing="0" cellpadding="0" border="0" class="profile-stats-venice-awards-body-award-padder"><tbody><tr><td class="profile-stats-venice-awards-body-award-class"><div class="common-bf3-kit-icon common-bf3-kit-icon-recon"></div></td><td class="profile-stats-venice-awards-body-award-type-img wide"><a href="/bf3/soldier/N-L-G/iteminfo/m417/392292591/pc/"><img width="90" height="54" src="http://battlelog-cdn.battlefield.com/cdnprefix/eaf9512714a/public/profile/bf3/stats/items_90x54/pkas.png" alt=""></a></td><td class="profile-stats-venice-awards-body-award-info"><div class="profile-stats-venice-awards-body-award-info-title"><span class="common-sorting-value" style="font-size:12px;"><a href="/bf3/soldier/N-L-G/iteminfo/m417/392292591/pc/" style="font-size:12px;"> PKA-S (HOLO) </a></span></div><div class="profile-stats-venice-awards-body-award-info-todo"> 198 / 200 M417 Kills </div></td></tr></tbody></table></div></td></tr></tbody></table></surf:container><div class="base-clear"></div></div>');
            $UAtable = $UAtemplate.find('#profile-stats-awards-upcoming-table > tbody');
            $UArow = $UAtemplate.find('.leaderboard-venice-specific-row.first');
            $UArow.find('.profile-stats-venice-awards-body-award-class').remove();
            $UArow.remove();

            unfinishedAssignments = unfinishedAssignments.slice(0, 4);

            $.each(unfinishedAssignments, function(k, assignment) {
                var $UArowClone = $UArow.clone();
                $UArowClone.find('.profile-stats-venice-awards-body-completion-value > .common-sorting-value').text(assignment.completion * 100);
                $UArowClone.find('.profile-stats-venice-awards-body-completion-meter').css({width: (assignment.completion * 100) + '%'})
                $UArowClone.find('.profile-stats-venice-awards-body-award-info-title a').attr('href', '#'+assignment.id).text( assignment.name + ' (' + assignment.desc + ')');

                var criteriaText = '';
                $.each(assignment.criteria, function(k, criteria) {
                    if ( criteria.completion < 1 ) {
                        criteriaText += '('+criteria.curr +' / ' + criteria.needed + ') ' + criteria.nname + '<br />';
                    }
                });

                $UArowClone.find('.profile-stats-venice-awards-body-award-type-img').html('<img src="http://files.bf3stats.com/img/bf3/' + assignment.img + '" style="width: 130px" alt="' + assignment.desc + '" />');
                $UArowClone.find('.profile-stats-venice-awards-body-award-info-todo').html( criteriaText );
                $UAtable.append($UArowClone);
            });
            
            $assignmentsContainer.find('#assignments-1024').before($UAtemplate);

            /**
             * Go through the assignments and put up the header dom
             */
    		$.each(assignments, function( assignmentId, assignment ) {
    			$('#' + assignmentId).prepend('<h3>' + assignment.name + '</h3>');
    		})

    	}
    },


    /**
     * Gets your own name from dom
     */
    getOwnName : function ( instance ) {
        var name = $('.base-header-soldier-link').text().trim();
        return name;
    },

    /**
     * Gets the active user's name that you're browsing assignments for
     */
    getTargetName : function ( instance ) {
        var name = $('.profile-venicestats-header-soldier-info-name > span').text();
        return name;
    },

    /**
     * Get assignment data 
     * @note used to contain cache data, but decided its better to update assignment data every now and then
     */
    getAssignments : function ( instance, name ) {
    	assignments = instance.fetchAssignments( instance, name );
    	return assignments;
    },

    /**
     * Fetch assignment data from BF3stats
     */
    fetchAssignments : function ( instance, name ) {
		var assignments = {};

    	$.ajax({
			url: 'http://api.bf3stats.com/pc/player/',
			async: false,
			type: 'post',
			data: { 
				player: name, 
				opt: {
                    all: true,
					assignments: true,
                    assignmentsName: true
				}
			},
			dataType: 'json'
		}).done( function( data ) {
			if ( data.stats == null ) {
				console.log('User not updated');
				return false;
			}

            console.log(data);

			/**
			 * Unwrap the hierarchy from assignments and store them as assignmentId : assignmentData type object in "assignments" var
             * Also put up the assignment completion % in the object as well.
 			 */
			$.each(data.stats.assignments, function( groupId, assignmentGroup ) {
				$.each(assignmentGroup, function( assignmentId, assignment ) {
                    assignment.id = assignmentId;
                    assignment = instance.getAssignmentCompletion( instance, assignment );
					assignments[assignmentId] = assignment;
				});
			});
		});

		return assignments;
    },

    /**
     * Counts the percentage of assignment completion on a given assignment object
     * @return {object} Assignment object, but updated with completion data
     */
    getAssignmentCompletion : function ( instance, assignment ) {
        var sum = 0;
        var completion = 0;

        $.each(assignment.criteria, function ( k, criteria ) {
            criteriaCompletion = Math.round(criteria.curr / criteria.needed * 100) / 100;
            sum += criteriaCompletion;
            assignment.criteria[k].completion = criteriaCompletion;
        })
        assignment.completion = Math.round(sum / assignment.criteria.length * 100) / 100;
        return assignment;
    },


    /**
     * Filters out any assignments that are completed and orders them by completion
     */
    getUnfinishedAssignments : function ( instance, assignments ) {
        var unfinishedAssignments = [];
        var sortedAssignments = instance.sortAssignmentsOnCompletion( instance, assignments );

        $.each( sortedAssignments, function(k, assignment ) {
            if ( assignment.completion < 1 ) {
                unfinishedAssignments[unfinishedAssignments.length] = assignment;
            }
        });

        return unfinishedAssignments;
    },


    /**
     * Sorts  the given assignment object according to completion
     */
    sortAssignmentsOnCompletion : function ( instance, assignments ) {
        var sorted = [];
        $.each( assignments, function( k, v ) {
            sorted[sorted.length] = v;
        })

        sorted.sort(function( a, b ) {
            return b.completion - a.completion;
        });

        return sorted;
    },

    /**
     * Clears the stored assignment info, forcing a new fetch on reload
     */
    clearAssignmentStorage : function ( instance ) {
    	instance.storage('assignments', null);
    	console.log('storage cleared');
    },

});

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
        "fr" : {
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
